# MEXC Spot Auto-Trading Bot

A comprehensive, production-ready automated spot trading bot for MEXC crypto exchange platform. The bot features real-time market analysis, sentiment-driven automated buy orders, risk management, and cross-platform support (Windows, Android, Linux).

## 🚀 Features

### Core Trading Features
- ✅ **MEXC Spot Trading** - Direct REST API integration with HMAC SHA256 authentication
- ✅ **Market Buy/Sell Orders** - Execute market and limit orders
- ✅ **Fixed $1 USD Allocation** - Enforce consistent position sizing with MEXC minimum notional compliance
- ✅ **WebSocket Real-time Data** - Live price updates and order book monitoring
- ✅ **Dynamic Pair Filtering** - Automatically select top volume/volatility pairs (>$1M 24h volume)
- ✅ **Sentiment-Driven Trading** - News sentiment analysis triggers automated buy orders

### Risk Management
- ✅ **Trailing Stop-Loss** - 1.5% - 2.0% automated stop-loss tracking
- ✅ **Dust Cleanup** - Automatic cleanup of non-tradable residual balances
- ✅ **Balance Validation** - Pre-trade USDT balance checking
- ✅ **Rate Limiting** - Built-in 1-2 sec rate limiter to prevent API bans

### User Interface
- ✅ **Kivy Cross-Platform GUI** - Works on Windows, Linux, Android, macOS
- ✅ **CLI Interface** - Command-line option for headless server mode
- ✅ **Real-time Monitoring** - Live log display, balance tracking, status indicators
- ✅ **Configuration Management** - Easy JSON-based config for all settings

### Automation & CI/CD
- ✅ **GitHub Actions** - Automated APK build (Android) and EXE build (Windows)
- ✅ **Multi-Platform Builds** - Generate release artifacts for all platforms

---

## 📋 Project Structure

```
/workspaces/Nor/
├── src/
│   ├── __init__.py
│   ├── main.py                          # Entry point (GUI + CLI fallback)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── mexc_spot_client.py         # HMAC SHA256 auth & REST API wrapper
│   │   └── mexc_ws.py                  # WebSocket client for real-time data
│   ├── strategy/
│   │   ├── __init__.py
│   │   ├── balance_manager.py          # $1 / Min-notional allocation validator
│   │   ├── scanner.py                  # Top volume/volatility pair filter
│   │   ├── news_sentiment.py           # News scraper & sentiment evaluator
│   │   └── freeze_manager.py           # Trailing stop-loss & dust cleaner
│   └── gui/
│       ├── __init__.py
│       └── main_app.py                 # Kivy cross-platform GUI
├── .github/
│   └── workflows/
│       ├── build-android.yml           # GitHub Action for .apk build
│       └── build-windows.yml           # GitHub Action for .exe build
├── config.json.example                 # Configuration template
├── requirements.txt                    # Python dependencies
├── buildozer.spec                      # Kivy Android build config
└── README.md                           # This file
```

---

## 🛠 Installation & Setup

### Prerequisites
- **Python 3.8+**
- **Git**
- **pip** (Python package manager)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/Nor.git
cd Nor
```

### 2. Create Virtual Environment
```bash
# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure MEXC API Credentials

**Step 1:** Get your API keys from MEXC
- Go to https://www.mexc.com/user/setting/api
- Create a new API key with **Spot Trading** permissions
- ⚠️ **Security**: Never enable **Withdraw** permission

**Step 2:** Copy & configure config.json
```bash
cp config.json.example config.json
```

**Step 3:** Edit `config.json` with your credentials
```json
{
  "mexc": {
    "api_key": "YOUR_API_KEY_HERE",
    "api_secret": "YOUR_API_SECRET_HERE"
  },
  "trading": {
    "default_allocation": 1.0,
    "max_concurrent_trades": 5
  }
}
```

---

## 🚀 Running the Bot

### GUI Mode (Recommended for Desktop)
```bash
python src/main.py --gui
```
This launches a Kivy GUI window with:
- API credential input fields
- Real-time balance display
- Start/Stop trading buttons
- Live trading log

### CLI Mode (Headless/Server)
```bash
python src/main.py --cli --config config.json
```

### Test Mode (Validate configuration)
```bash
python src/main.py --test
```

### Help
```bash
python src/main.py --help
```

---

## ⚙️ Configuration Reference

### config.json Structure

```json
{
  "mexc": {
    "api_key": "YOUR_API_KEY",
    "api_secret": "YOUR_API_SECRET",
    "base_url": "https://api.mexc.com/api/v3"
  },
  "trading": {
    "default_allocation": 1.0,              # $1 USD per trade
    "max_concurrent_trades": 5,             # Max open positions
    "risk_management": {
      "trailing_stop_loss_percent": 1.5,   # Stop-loss at 1.5%
      "dust_cleanup_enabled": true,
      "min_notional_dust": 10.0
    }
  },
  "pair_scanner": {
    "min_volume_usdt": 1000000,             # Filter: >$1M 24h volume
    "max_spread_percent": 2.0,              # Filter: <2% bid-ask spread
    "min_price_change_percent": 0.5,        # Filter: >0.5% volatility
    "top_pairs_limit": 20
  },
  "sentiment_analysis": {
    "enabled": true,
    "cryptopanic_api_key": "YOUR_KEY",      # Optional: CryptoPanic API key
    "min_confidence_threshold": 0.65,       # 65% confidence minimum
    "refresh_interval_seconds": 300
  },
  "websocket": {
    "enabled": true,
    "streams": ["ticker", "orderbook"],
    "reconnect_interval_seconds": 5,
    "max_retries": 3
  },
  "rate_limiting": {
    "rest_delay_seconds": 1.0,              # 1 second between REST requests
    "batch_size": 5
  },
  "logging": {
    "level": "INFO",
    "log_file": "trading_bot.log",
    "max_log_size_mb": 100
  }
}
```

---

## 📊 Core Modules Explained

### 1. MEXC API Client (`src/api/mexc_spot_client.py`)

Handles authentication and REST API requests.

**Key Methods:**
```python
client = MEXCSpotClient(api_key, api_secret)

# Account & Balance
account = client.get_account_info()
balance = client.get_balance("USDT")

# Market Data
ticker = client.get_24h_ticker("BTCUSDT")
top_pairs = client.get_top_volume_pairs(limit=20)
symbol_info = client.get_symbol_info("BTCUSDT")

# Trading
order = client.buy_market("BTCUSDT", quote_order_qty=1.0)
order = client.sell_market("BTCUSDT", quantity=0.00001)
```

### 2. WebSocket Client (`src/api/mexc_ws.py`)

Real-time data streaming for prices and order books.

```python
ws = MEXCWebSocketClient()
ws.on("ticker", lambda data: print(data))
ws.on("orderbook", lambda data: print(data))

# Start receiving updates
asyncio.run(ws.subscribe_ticker(["BTCUSDT", "ETHUSDT"]))
```

### 3. Balance Manager (`src/strategy/balance_manager.py`)

Validates trades and enforces $1 USD allocation rules.

```python
bm = BalanceManager(default_allocation=1.0)

# Validate trade
result = bm.validate_trade(
    symbol="BTCUSDT",
    available_usdt=100.0,
    current_price=50000.0,
    min_notional=10.0,
    step_size=0.00001,
    allocation=1.0
)

if result["valid"]:
    print(f"Order quantity: {result['order_quantity']}")
```

### 4. Pair Scanner (`src/strategy/scanner.py`)

Dynamically selects top trading pairs by volume, volatility, or spread.

```python
scanner = PairScanner(
    min_volume_usdt=1000000,
    max_spread_percentage=2.0
)

# Get top pairs by volume
top_pairs = scanner.get_top_pairs(tickers, limit=20, criteria="volume")

# Get volatile pairs
volatile_pairs = scanner.get_top_pairs(tickers, limit=20, criteria="volatility")
```

### 5. News Sentiment Analyzer (`src/strategy/news_sentiment.py`)

Analyzes market sentiment from news sources and triggers buy signals.

```python
analyzer = NewsSentimentAnalyzer(cryptopanic_api_key="YOUR_KEY")

# Analyze news for a symbol
analysis = analyzer.analyze_news_for_symbol("BTC")
print(f"Sentiment: {analysis['sentiment']}")  # POSITIVE, NEGATIVE, NEUTRAL
print(f"Confidence: {analysis['confidence']}")

# Get buy signals
buy_signals = analyzer.get_buy_signals(["BTCUSDT", "ETHUSDT"])
```

### 6. Freeze Manager (`src/strategy/freeze_manager.py`)

Risk management with trailing stop-loss and dust cleanup.

```python
freeze_mgr = FreezeManager(trailing_stop_loss_percent=1.5)

# Track position
freeze_mgr.open_position(
    order_id="123",
    symbol="BTCUSDT",
    entry_price=50000.0,
    quantity=0.00001,
    buy_amount=1.0
)

# Check stop-loss
result = freeze_mgr.update_price("123", current_price=48500.0)
if result["should_sell"]:
    print(f"SELL at loss: {result['loss_percent']}%")

# Cleanup dust
dust = freeze_mgr.cleanup_dust_balances(balances)
```

---

## 🤖 Trading Strategy Workflow

```
┌─────────────────┐
│  Start Bot      │
└────────┬────────┘
         │
    ┌────▼─────────────────┐
    │  Check USDT Balance  │
    │  (Validate Account)  │
    └────┬─────────────────┘
         │
    ┌────▼──────────────────────┐
    │  Scan Top Pairs           │
    │  (Filter by Volume/Risk)  │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │  Analyze News Sentiment   │
    │  (Detect Buy Signals)     │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │  Positive Sentiment?      │
    └─┬──────────────────────┬──┘
      │ YES                  │ NO
  ┌───▼──────────────┐  ┌───▼──────────┐
  │  Validate Trade  │  │  Wait (60s)  │
  │  (Balance Check) │  │  & Retry     │
  └──┬──────────────┘  └──┬───────────┘
     │                    │
     │ VALID             │
  ┌──▼────────────────┐  │
  │  Execute Buy      │  │
  │  Market Order     │──┼─────┐
  │  ($1 USD)         │  │     │
  └──┬───────────────┘  │     │
     │                  │     │
  ┌──▼──────────────────┐  │
  │  Track Position     │  │
  │  (Set Stop-Loss)    │  │
  └──┬─────────────────┘  │
     │                    │
  ┌──▼──────────────────────┐
  │  Monitor Price          │
  │  & Trigger Stop-Loss    │
  │  (Every Check Interval) │
  └──┬──────────────────────┘
     │
     └─────────────────────►  Loop
```

---

## 🔐 Security Best Practices

⚠️ **CRITICAL**: Follow these security practices:

1. **Never commit credentials**
   - Use `.gitignore` to exclude `config.json`
   - Only commit `config.json.example`

2. **Restrict API permissions**
   - ✅ Enable: **Spot Trading** (Buy/Sell)
   - ✅ Enable: **Read Account Data**
   - ❌ NEVER enable: **Withdraw/Transfer**
   - ❌ NEVER enable: **Margin Trading**

3. **IP Whitelisting** (MEXC Admin Panel)
   - Add only the IPs from which the bot will run

4. **Use environment variables** (Optional advanced setup)
   ```bash
   export MEXC_API_KEY="your_key"
   export MEXC_API_SECRET="your_secret"
   ```

5. **Secure Kivy GUI passwords**
   - The app uses `password=True` for text input fields
   - Credentials are NOT stored by default

---

## 📱 Building for Mobile & Desktop

### Android APK

**Local Build** (requires Android SDK, NDK, Java JDK):
```bash
# Install Buildozer (may take 10-20 minutes on first run)
pip install buildozer cython

# Build APK
buildozer android release
# Output: bin/MEXC*.apk
```

**GitHub Actions** (automated):
```bash
git push main  # Triggers .github/workflows/build-android.yml
# Check "Actions" tab → "Build Android APK"
# Download artifact when complete
```

### Windows EXE

**Local Build**:
```bash
pip install pyinstaller

pyinstaller --onefile \
  --name MEXCTradingBot \
  --windowed \
  src/main.py
# Output: dist/MEXCTradingBot.exe
```

**GitHub Actions** (automated):
```bash
git push main  # Triggers .github/workflows/build-windows.yml
# Check "Actions" tab → "Build Windows EXE"
# Download .exe artifact
```

---

## 🐛 Troubleshooting

### Common Issues

**Error: "Invalid API key"**
- ✓ Verify API key is copied correctly
- ✓ Check API key is enabled on MEXC
- ✓ Wait 5 minutes after creating key

**Error: "Insufficient balance"**
- ✓ Ensure you have at least $1 USDT
- ✓ Check USDT is in **Spot Account** (not Futures/Margin)
- ✓ Verify no pending withdrawals

**GUI won't start**
```bash
# Install Kivy dependencies
pip install kivy kivy-garden

# Test GUI separately
python -c "from kivy.app import App; print('Kivy OK')"
```

**WebSocket connection refused**
- ✓ Check internet connection
- ✓ MEXC WebSocket is wss://wbs.mexc.com/raw
- ✓ Some firewalls block WebSocket (port 443)

**Rate limit hit (API ban)**
- ✓ Already built-in: 1-2 sec delay between requests
- ✓ Reduce `rate_limiting.rest_delay_seconds` in config (not below 1.0)
- ✓ Wait 15 minutes if already banned

### Debug Mode

Enable detailed logging:
```bash
# Edit config.json
"logging": {
  "level": "DEBUG"  # Change from INFO to DEBUG
}
```

Then check `trading_bot.log` for details.

---

## 📚 API Documentation

### MEXC API Reference
- **Spot Trading**: https://mexcdeveloper.com/en/api
- **WebSocket**: https://mexcdeveloper.com/en/websocket

### CryptoPanic News API (Optional)
- **Free Tier**: 500 API calls/day
- **Register**: https://cryptopanic.com/developers/api

---

## ⚖️ Legal Disclaimer

**This software is provided AS-IS without any warranty.**

- ⚠️ Cryptocurrency trading involves significant financial risk
- ⚠️ Past performance does not guarantee future results
- ⚠️ You alone are responsible for any losses
- ⚠️ Bot malfunction is possible — always have kill-switches ready
- ⚠️ Check your local regulations for crypto trading compliance

**USE AT YOUR OWN RISK.**

---

## 📄 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/MyFeature`)
3. Commit changes (`git commit -m 'Add MyFeature'`)
4. Push to branch (`git push origin feature/MyFeature`)
5. Open a Pull Request

---

## 💬 Support

For issues, questions, or suggestions:
- 📧 Email: [your-email@example.com]
- 🐛 GitHub Issues: [Link to Issues]
- 💬 Discussions: [Link to Discussions]

---

## 🔄 Version History

**v1.0.0** (August 16, 2026)
- Initial release
- MEXC Spot trading support
- Real-time WebSocket streaming
- News sentiment analysis
- Risk management with trailing stop-loss
- Cross-platform GUI (Kivy)
- GitHub Actions CI/CD

---

**Built with ❤️ for crypto traders**
