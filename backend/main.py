"""
MEXC Cloud Trading Bot API Server
FastAPI backend for 24/7 automated trading
"""
import os
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from trading_bot import TradingBot
from mexc_client import MexcClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MEXC Cloud Trading Bot API",
    description="24/7 automated trading backend for MEXC exchange",
    version="2.0.0"
)

# CORS - allow Flutter app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global bot instance (initialized with env vars)
bot: Optional[TradingBot] = None

# ========== Pydantic Models ==========

class ApiCredentials(BaseModel):
    api_key: str
    api_secret: str

class BotConfig(BaseModel):
    symbol: Optional[str] = "BTCUSDT"
    max_trade_usd: Optional[float] = Field(default=1.0, ge=0.1, le=100.0)
    strategy: Optional[str] = "scalping"
    interval_seconds: Optional[int] = Field(default=60, ge=10, le=3600)
    stop_loss_percent: Optional[float] = Field(default=2.0, ge=0.1, le=50.0)
    take_profit_percent: Optional[float] = Field(default=3.0, ge=0.1, le=100.0)
    max_daily_trades: Optional[int] = Field(default=50, ge=1, le=500)
    enabled: Optional[bool] = True

class ManualTradeRequest(BaseModel):
    side: str = Field(..., regex="^(BUY|SELL)$")
    symbol: Optional[str] = None
    amount_usd: Optional[float] = Field(default=1.0, ge=0.1, le=100.0)

class TradeResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# ========== Helper Functions ==========

def get_bot() -> TradingBot:
    """Get or initialize bot instance"""
    global bot
    if bot is None:
        api_key = os.getenv("MEXC_API_KEY")
        api_secret = os.getenv("MEXC_API_SECRET")
        
        if not api_key or not api_secret:
            raise HTTPException(status_code=400, detail="Bot not initialized. Set API credentials first.")
        
        bot = TradingBot(api_key, api_secret)
    return bot

# ========== API Endpoints ==========

@app.get("/")
def root():
    return {
        "service": "MEXC Cloud Trading Bot API",
        "version": "2.0.0",
        "status": "running",
        "time": datetime.now().isoformat()
    }

@app.post("/api/init")
def initialize_bot(credentials: ApiCredentials):
    """Initialize bot with API credentials"""
    global bot
    try:
        # Test credentials first
        client = MexcClient(credentials.api_key, credentials.api_secret)
        account = client.get_account()
        
        bot = TradingBot(credentials.api_key, credentials.api_secret)
        
        return {
            "success": True,
            "message": "Bot initialized successfully",
            "account_type": account.get('accountType', 'unknown'),
            "can_trade": account.get('canTrade', False)
        }
    except Exception as e:
        logger.error(f"Bot initialization failed: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid credentials or API error: {str(e)}")

@app.get("/api/status")
def get_status():
    """Get bot status and account info"""
    try:
        b = get_bot()
        return b.get_status()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/start")
def start_bot():
    """Start the trading bot"""
    try:
        b = get_bot()
        result = b.start()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stop")
def stop_bot():
    """Stop the trading bot"""
    try:
        b = get_bot()
        result = b.stop()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pause")
def pause_bot():
    """Pause trading"""
    try:
        b = get_bot()
        return b.pause()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resume")
def resume_bot():
    """Resume trading"""
    try:
        b = get_bot()
        return b.resume()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/config")
def update_config(config: BotConfig):
    """Update bot configuration"""
    try:
        b = get_bot()
        update_data = {k: v for k, v in config.dict().items() if v is not None}
        return b.update_config(**update_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/balance")
def get_balance(asset: str = "USDT"):
    """Get account balance for specific asset"""
    try:
        b = get_bot()
        balance = b.client.get_balance(asset)
        all_balances = b.client.get_all_balances()
        return {
            "asset": asset,
            "balance": balance,
            "all_balances": all_balances,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/account")
def get_account():
    """Get full account information"""
    try:
        b = get_bot()
        account = b.client.get_account()
        return account
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/trade/manual")
def manual_trade(request: ManualTradeRequest):
    """Execute manual trade"""
    try:
        b = get_bot()
        
        # Override symbol if provided
        if request.symbol:
            b.config.symbol = request.symbol
        
        # Override amount (still capped at $1 for safety)
        if request.amount_usd:
            b.config.max_trade_usd = min(request.amount_usd, 1.0)
        
        result = b.manual_trade(request.side)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trades/history")
def get_trade_history(limit: int = 100):
    """Get trade history"""
    try:
        b = get_bot()
        return {
            "trades": b.get_trade_history(limit),
            "count": len(b.trade_history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/positions")
def get_open_positions():
    """Get open positions"""
    try:
        b = get_bot()
        return {
            "positions": b.get_open_positions(),
            "count": len(b.open_positions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emergency/close-all")
def emergency_close_all():
    """Emergency close all positions"""
    try:
        b = get_bot()
        return b.emergency_close_all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/ticker")
def get_ticker(symbol: str = "BTCUSDT"):
    """Get 24h ticker for a symbol"""
    try:
        b = get_bot()
        return b.client.get_ticker_24h(symbol)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/klines")
def get_klines(symbol: str = "BTCUSDT", interval: str = "1m", limit: int = 100):
    """Get kline/candlestick data"""
    try:
        b = get_bot()
        return {
            "symbol": symbol,
            "interval": interval,
            "data": b.client.get_klines(symbol, interval, limit)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/price")
def get_current_price(symbol: str = "BTCUSDT"):
    """Get current price"""
    try:
        b = get_bot()
        ticker = b.client.get_ticker_24h(symbol)
        return {
            "symbol": symbol,
            "price": float(ticker.get('lastPrice', 0)),
            "change_24h": float(ticker.get('priceChangePercent', 0)),
            "high_24h": float(ticker.get('highPrice', 0)),
            "low_24h": float(ticker.get('lowPrice', 0)),
            "volume_24h": float(ticker.get('volume', 0)),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/time/sync")
def sync_time():
    """Sync and return server time"""
    try:
        b = get_bot()
        b.sync_time()
        server_time = b.client.get_server_time()
        return {
            "server_time_ms": server_time.get('serverTime'),
            "local_time_ms": int(datetime.now().timestamp() * 1000),
            "offset_ms": b._server_time_offset,
            "synced": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== Health Check ==========

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "bot_initialized": bot is not None,
        "bot_status": bot.status.value if bot else "not_initialized"
    }

# ========== Auto-start from env ==========

@app.on_event("startup")
def startup_event():
    """Auto-initialize bot if credentials are in environment"""
    api_key = os.getenv("MEXC_API_KEY")
    api_secret = os.getenv("MEXC_API_SECRET")
    
    if api_key and api_secret:
        global bot
        try:
            bot = TradingBot(api_key, api_secret)
            logger.info("Bot auto-initialized from environment variables")
            
            # Auto-start if configured
            if os.getenv("AUTO_START", "false").lower() == "true":
                bot.start()
                logger.info("Bot auto-started")
        except Exception as e:
            logger.error(f"Auto-initialization failed: {e}")
    else:
        logger.info("No API credentials in environment. Bot must be initialized manually.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
