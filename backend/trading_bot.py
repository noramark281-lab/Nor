"""
Cloud Trading Bot - 24/7 Automated Trading on MEXC
Runs independently and can be controlled via REST API
"""
import time
import threading
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum
import json
import os

from mexc_client import MexcClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OrderSide(Enum):
    BUY = "BUY"
    SELL = "SELL"


class BotStatus(Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"


@dataclass
class TradeConfig:
    """Trading configuration"""
    symbol: str = "BTCUSDT"
    max_trade_usd: float = 1.0  # $1 cap per trade
    strategy: str = "scalping"
    interval_seconds: int = 60
    stop_loss_percent: float = 2.0
    take_profit_percent: float = 3.0
    max_daily_trades: int = 50
    enabled: bool = True


@dataclass
class TradeRecord:
    """Record of a single trade"""
    id: str
    symbol: str
    side: str
    amount_usd: float
    price: float
    quantity: float
    timestamp: datetime
    status: str = "open"  # open, closed, cancelled
    pnl: Optional[float] = None
    close_price: Optional[float] = None
    close_time: Optional[datetime] = None
    order_id: Optional[int] = None


class TradingBot:
    """
    24/7 Cloud Trading Bot for MEXC
    
    Features:
    - Multiple trading strategies
    - $1 max per trade cap
    - Risk management (stop loss, take profit)
    - Daily trade limits
    - Real balance checking before each trade
    - Full trade history logging
    """
    
    def __init__(self, api_key: str, api_secret: str):
        self.client = MexcClient(api_key, api_secret)
        self.status = BotStatus.STOPPED
        self.config = TradeConfig()
        self.trade_history: List[TradeRecord] = []
        self.open_positions: List[TradeRecord] = []
        self.daily_trade_count = 0
        self.last_trade_date = datetime.now().date()
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self._callbacks: List[Callable] = []
        self._error_message: Optional[str] = None
        self._balance = 0.0
        self._server_time_offset = 0
        
    def add_callback(self, callback: Callable):
        """Add callback for trade events"""
        self._callbacks.append(callback)
    
    def _notify(self, event_type: str, data: Dict):
        """Notify all callbacks"""
        for cb in self._callbacks:
            try:
                cb(event_type, data)
            except Exception as e:
                logger.error(f"Callback error: {e}")
    
    def sync_time(self):
        """Sync local time with MEXC server time"""
        try:
            server_time = self.client.get_server_time()
            server_ms = server_time.get('serverTime', 0)
            local_ms = int(time.time() * 1000)
            self._server_time_offset = server_ms - local_ms
            logger.info(f"Time synced. Offset: {self._server_time_offset}ms")
        except Exception as e:
            logger.warning(f"Time sync failed: {e}")
    
    def get_synced_time(self) -> int:
        """Get current time synced with MEXC server"""
        return int(time.time() * 1000) + self._server_time_offset
    
    def update_balance(self) -> float:
        """Update and return current USDT balance"""
        try:
            self._balance = self.client.get_balance('USDT')
            return self._balance
        except Exception as e:
            logger.error(f"Balance update failed: {e}")
            return self._balance
    
    def _check_daily_reset(self):
        """Reset daily counters if date changed"""
        today = datetime.now().date()
        if today != self.last_trade_date:
            self.daily_trade_count = 0
            self.last_trade_date = today
            logger.info("Daily counters reset")
    
    def _can_trade(self) -> bool:
        """Check if trading is allowed"""
        if self.status != BotStatus.RUNNING:
            return False
        if not self.config.enabled:
            return False
        self._check_daily_reset()
        if self.daily_trade_count >= self.config.max_daily_trades:
            return False
        if self._balance < self.config.max_trade_usd:
            logger.warning(f"Insufficient balance: ${self._balance:.2f}")
            return False
        return True
    
    # ========== STRATEGIES ==========
    
    def _strategy_scalping(self, klines: List) -> Optional[str]:
        """
        Simple scalping strategy based on short-term price movement
        Uses 1-minute candles
        """
        if len(klines) < 3:
            return None
        
        # Get last 3 candles
        c1, c2, c3 = klines[-3], klines[-2], klines[-1]
        
        # Calculate price changes
        change1 = (float(c1[4]) - float(c1[1])) / float(c1[1]) * 100
        change2 = (float(c2[4]) - float(c2[1])) / float(c2[1]) * 100
        change3 = (float(c3[4]) - float(c3[1])) / float(c3[1]) * 100
        
        # Simple momentum: 3 consecutive moves in same direction
        if change1 > 0.05 and change2 > 0.05 and change3 > 0.05:
            return "BUY"  # Uptrend
        elif change1 < -0.05 and change2 < -0.05 and change3 < -0.05:
            return "SELL"  # Downtrend
        return None
    
    def _strategy_mean_reversion(self, klines: List) -> Optional[str]:
        """
        Mean reversion: buy when price drops below average, sell when above
        """
        if len(klines) < 20:
            return None
        
        closes = [float(k[4]) for k in klines[-20:]]
        avg = sum(closes) / len(closes)
        current = closes[-1]
        deviation = (current - avg) / avg * 100
        
        if deviation < -0.5:
            return "BUY"  # Price below average, expect bounce
        elif deviation > 0.5:
            return "SELL"  # Price above average, expect drop
        return None
    
    def _strategy_rsi_simple(self, klines: List) -> Optional[str]:
        """
        Simple RSI-based strategy
        """
        if len(klines) < 15:
            return None
        
        closes = [float(k[4]) for k in klines[-15:]]
        
        # Calculate simple RSI (14 period)
        gains = []
        losses = []
        for i in range(1, 15):
            change = closes[i] - closes[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        avg_gain = sum(gains) / len(gains) if gains else 0
        avg_loss = sum(losses) / len(losses) if losses else 0
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        if rsi < 30:
            return "BUY"  # Oversold
        elif rsi > 70:
            return "SELL"  # Overbought
        return None
    
    def _strategy_trend_following(self, klines: List) -> Optional[str]:
        """
        Trend following using simple moving average crossover
        """
        if len(klines) < 20:
            return None
        
        closes = [float(k[4]) for k in klines]
        ma_short = sum(closes[-5:]) / 5
        ma_long = sum(closes[-20:]) / 20
        
        prev_ma_short = sum(closes[-6:-1]) / 5
        prev_ma_long = sum(closes[-21:-1]) / 20
        
        # Golden cross (short crosses above long)
        if prev_ma_short <= prev_ma_long and ma_short > ma_long:
            return "BUY"
        # Death cross (short crosses below long)
        elif prev_ma_short >= prev_ma_long and ma_short < ma_long:
            return "SELL"
        return None
    
    def _execute_strategy(self) -> Optional[str]:
        """Execute selected strategy and return signal"""
        try:
            klines = self.client.get_klines(
                self.config.symbol, 
                interval='1m', 
                limit=50
            )
            
            strategy_map = {
                'scalping': self._strategy_scalping,
                'mean_reversion': self._strategy_mean_reversion,
                'rsi': self._strategy_rsi_simple,
                'trend_following': self._strategy_trend_following,
            }
            
            strategy_fn = strategy_map.get(self.config.strategy, self._strategy_scalping)
            return strategy_fn(klines)
            
        except Exception as e:
            logger.error(f"Strategy execution error: {e}")
            return None
    
    def _place_trade(self, side: str) -> Optional[TradeRecord]:
        """Place a real trade with $1 cap"""
        try:
            # Get current price to calculate quantity
            ticker = self.client.get_ticker_24h(self.config.symbol)
            current_price = float(ticker.get('lastPrice', 0))
            
            if current_price <= 0:
                logger.error("Invalid price")
                return None
            
            # Calculate quantity for exactly $1 worth
            quantity = round(self.config.max_trade_usd / current_price, 6)
            
            # Ensure minimum notional value
            if quantity * current_price < 5:  # MEXC minimum
                logger.warning("Trade below minimum notional, skipping")
                return None
            
            # Place MARKET order with quoteOrderQty for exact USD amount
            result = self.client.place_order(
                symbol=self.config.symbol,
                side=side,
                order_type='MARKET',
                quote_order_qty=self.config.max_trade_usd
            )
            
            trade = TradeRecord(
                id=f"trade_{int(time.time() * 1000)}",
                symbol=self.config.symbol,
                side=side,
                amount_usd=self.config.max_trade_usd,
                price=current_price,
                quantity=quantity,
                timestamp=datetime.now(),
                status="closed" if side == "SELL" else "open",
                order_id=result.get('orderId')
            )
            
            with self._lock:
                self.trade_history.insert(0, trade)
                if side == "BUY":
                    self.open_positions.append(trade)
                self.daily_trade_count += 1
            
            self._balance = self.update_balance()
            
            self._notify("trade_executed", {
                "trade": trade.__dict__,
                "balance": self._balance
            })
            
            logger.info(f"Trade executed: {side} ${self.config.max_trade_usd} of {self.config.symbol} @ {current_price}")
            return trade
            
        except Exception as e:
            logger.error(f"Trade placement failed: {e}")
            self._error_message = str(e)
            return None
    
    def _manage_positions(self):
        """Check open positions for stop loss / take profit"""
        try:
            ticker = self.client.get_ticker_24h(self.config.symbol)
            current_price = float(ticker.get('lastPrice', 0))
            
            for pos in self.open_positions[:]:
                if pos.side == "BUY":
                    change_pct = (current_price - pos.price) / pos.price * 100
                    
                    if change_pct <= -self.config.stop_loss_percent:
                        # Stop loss hit - sell
                        logger.info(f"Stop loss hit for {pos.id}: {change_pct:.2f}%")
                        self._place_trade("SELL")
                        pos.status = "closed"
                        pos.pnl = -pos.amount_usd * self.config.stop_loss_percent / 100
                        pos.close_price = current_price
                        pos.close_time = datetime.now()
                        self.open_positions.remove(pos)
                        
                    elif change_pct >= self.config.take_profit_percent:
                        # Take profit hit - sell
                        logger.info(f"Take profit hit for {pos.id}: {change_pct:.2f}%")
                        self._place_trade("SELL")
                        pos.status = "closed"
                        pos.pnl = pos.amount_usd * self.config.take_profit_percent / 100
                        pos.close_price = current_price
                        pos.close_time = datetime.now()
                        self.open_positions.remove(pos)
                        
        except Exception as e:
            logger.error(f"Position management error: {e}")
    
    def _trading_loop(self):
        """Main trading loop running 24/7"""
        logger.info("Trading loop started")
        self.sync_time()
        self.update_balance()
        
        while not self._stop_event.is_set():
            try:
                if self.status != BotStatus.RUNNING:
                    time.sleep(5)
                    continue
                
                # Update balance
                self.update_balance()
                
                # Manage existing positions
                self._manage_positions()
                
                # Check if we can trade
                if not self._can_trade():
                    time.sleep(self.config.interval_seconds)
                    continue
                
                # Execute strategy
                signal = self._execute_strategy()
                
                if signal:
                    logger.info(f"Strategy signal: {signal}")
                    trade = self._place_trade(signal)
                    if trade:
                        self._notify("signal_executed", {
                            "signal": signal,
                            "trade": trade.__dict__
                        })
                
                # Wait for next interval
                time.sleep(self.config.interval_seconds)
                
            except Exception as e:
                logger.error(f"Trading loop error: {e}")
                self._error_message = str(e)
                self.status = BotStatus.ERROR
                time.sleep(30)
    
    # ========== PUBLIC API ==========
    
    def start(self):
        """Start the trading bot"""
        if self.status == BotStatus.RUNNING:
            return {"status": "already_running"}
        
        self._stop_event.clear()
        self.status = BotStatus.RUNNING
        self._error_message = None
        
        self._thread = threading.Thread(target=self._trading_loop, daemon=True)
        self._thread.start()
        
        logger.info("Trading bot started")
        return {"status": "started"}
    
    def stop(self):
        """Stop the trading bot"""
        self.status = BotStatus.STOPPED
        self._stop_event.set()
        
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        
        logger.info("Trading bot stopped")
        return {"status": "stopped"}
    
    def pause(self):
        """Pause trading (keep bot alive but don't place orders)"""
        self.status = BotStatus.PAUSED
        return {"status": "paused"}
    
    def resume(self):
        """Resume trading"""
        if self.status == BotStatus.PAUSED:
            self.status = BotStatus.RUNNING
            return {"status": "resumed"}
        return {"status": "not_paused"}
    
    def get_status(self) -> Dict[str, Any]:
        """Get full bot status"""
        return {
            "status": self.status.value,
            "config": {
                "symbol": self.config.symbol,
                "max_trade_usd": self.config.max_trade_usd,
                "strategy": self.config.strategy,
                "interval_seconds": self.config.interval_seconds,
                "stop_loss_percent": self.config.stop_loss_percent,
                "take_profit_percent": self.config.take_profit_percent,
                "max_daily_trades": self.config.max_daily_trades,
                "enabled": self.config.enabled,
            },
            "balance_usdt": self._balance,
            "daily_trades": self.daily_trade_count,
            "open_positions": len(self.open_positions),
            "total_trades": len(self.trade_history),
            "error": self._error_message,
            "server_time_offset_ms": self._server_time_offset,
        }
    
    def update_config(self, **kwargs):
        """Update bot configuration"""
        for key, value in kwargs.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)
        return self.get_status()
    
    def get_trade_history(self, limit: int = 100) -> List[Dict]:
        """Get trade history"""
        with self._lock:
            return [t.__dict__ for t in self.trade_history[:limit]]
    
    def get_open_positions(self) -> List[Dict]:
        """Get open positions"""
        with self._lock:
            return [p.__dict__ for p in self.open_positions]
    
    def manual_trade(self, side: str) -> Dict:
        """Execute manual trade"""
        if self._balance < self.config.max_trade_usd:
            return {"error": "Insufficient balance"}
        
        trade = self._place_trade(side)
        if trade:
            return {"success": True, "trade": trade.__dict__}
        return {"error": "Trade failed"}
    
    def emergency_close_all(self) -> Dict:
        """Emergency close all open positions"""
        results = []
        for pos in self.open_positions[:]:
            result = self._place_trade("SELL")
            if result:
                pos.status = "closed"
                pos.close_price = result.price
                pos.close_time = datetime.now()
                self.open_positions.remove(pos)
                results.append(result.__dict__)
        
        return {"closed": len(results), "trades": results}
