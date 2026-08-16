# MEXC Spot Auto-Trading Bot

A sophisticated automated trading bot for MEXC Spot Trading with sentiment analysis, risk management, and multi-platform support.

## Features

✨ **Core Trading Features:**
- ✅ REST API integration with HMAC SHA256 authentication
- ✅ Real-time WebSocket streams for price updates
- ✅ Fixed allocation trading ($1.00 USD or minimum notional)
- ✅ Dynamic pair scanning based on 24h volume > $1,000,000
- ✅ Sentiment-driven trading triggered by market news
- ✅ Trailing stop-loss (1.5% - 2.0%) for risk mitigation
- ✅ Automated dust cleanup for residual balances
- ✅ Rate limiting (1-2 sec cooldown) to prevent API bans

🎯 **User Interface:**
- ✅ Cross-platform Kivy GUI (Desktop & Mobile)
- ✅ CLI mode for server/headless operation
- ✅ Live balance display and activity logs
- ✅ Real-time position tracking
- ✅ Configurable trading parameters

🔧 **Advanced Features:**
- ✅ Multi-pair scanning and filtering
- ✅ News sentiment analysis (CryptoPanic, RSS feeds)
- ✅ Portfolio value calculation
- ✅ Performance analytics
- ✅ Comprehensive logging

## Project Structure

```
├── .github/
│   └── workflows/
│       ├── build-android.yml    # GitHub Action for Android .apk (Buildozer)
│       └── build-windows.yml    # GitHub Action for Windows .exe (PyInstaller)
├── src/
│   ├── __init__.py
│   ├── main.py                  # Entry point (GUI + CLI)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── mexc_spot_client.py  # MEXC REST API wrapper
│   │   └── mexc_ws.py           # WebSocket client
│   ├── strategy/
│   │   ├── __init__.py
│   │   ├── balance_manager.py   # $1 allocation validator
│   │   ├── scanner.py           # Top volume/volatility filter
│   │   ├── news_sentiment.py    # News sentiment analyzer
│   │   └── freeze_manager.py    # Stop-loss & dust cleaner
│   └── gui/
│       ├── __init__.py
│       └── main_app.py          # Kivy GUI interface
├── buildozer.spec                # Android config (Kivy)
├── config.json.example          # Configuration template
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## Installation

### Prerequisites

- **Python 3.8+** (Python 3.10+ recommended)
- **pip** (Python package manager)
- MEXC API key and secret (from https://www.mexc.com/api)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/noramark281-lab/Nor.git
   cd Nor
   ```

2. **Create virtual environment (recommended):**
   ```bash
   python -m venv .venv
   
   # On Windows:
   .venv\Scripts\activate
   
   # On Linux/Mac:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create configuration file:**
   ```bash
   python src/main.py --create-config
   ```

5. **Edit `config.json` with your MEXC API credentials:**
   ```json
   {
     "api_key": "your_mexc_api_key_here",
     "api_secret": "your_mexc_api_secret_here",
     "allocation": 1.0,
     "min_volume": 1000000,
     "stop_loss": 2.0,
     "enable_news_sentiment": true,
     "dry_run": true
   }
   ```

## Usage

### GUI Mode (Default)

Start the user-friendly Kivy interface:
```bash
python src/main.py --gui
```

Or simply:
```bash
python src/main.py
```

**GUI Features:**
- API Key/Secret configuration
- Start/Stop trading toggle
- Real-time balance display
- Active positions panel
- Activity log
- Pair scanning
- News sentiment check

### CLI Mode

Run in command-line mode (for servers):
```bash
python src/main.py --cli
```

**CLI Features:**
- Non-interactive trading
- Periodic balance checks
- Pair scanning and analysis
- Sentiment analysis (if enabled)
- Log output to console

### Test Mode

Run tests without making real trades:
```bash
python src/main.py --test
```

**Test includes:**
- Balance manager validation
- Sentiment analysis demo
- Exchange connectivity check

### Additional Options

```bash
python src/main.py --help

# With custom config file:
python src/main.py --cli --config my_config.json

# Verbose logging:
python src/main.py -v --cli

# Create config and exit:
python src/main.py --create-config
```

## Configuration

### config.json Parameters

```json
{
  "api_key": "Your MEXC API key",
  "api_secret": "Your MEXC API secret",
  
  "allocation": 1.0,              // Per-trade amount in USD
  "min_volume": 1000000,          // Minimum 24h volume in USD
  "stop_loss": 2.0,               // Trailing stop-loss %
  "sentiment_sensitivity": 0.6,   // News sentiment threshold (0-1)
  
  "enable_news_sentiment": true,  // Enable sentiment-driven trading
  "dry_run": true,                // Test mode (no real trades)
  "rate_limit_delay": 1.0,        // Delay between API calls (seconds)
  
  "max_concurrent_positions": 5,  // Max open positions
  "check_interval_seconds": 60    // Price check frequency
}
```

## API Reference

### MEXC Spot Client

```python
from src.api.mexc_spot_client import MEXCSpotClient

# Initialize
client = MEXCSpotClient(api_key="key", api_secret="secret")

# Account operations
account = client.get_account_info()
balance = client.get_usdt_balance()

# Trading
order = client.place_spot_order(
    symbol="BTCUSDT",
    side="BUY",
    order_type="MARKET",
    quote_order_qty=1.0  # $1.00
)

# Market data
ticker = client.get_24h_ticker(symbol="BTCUSDT")
pairs = client.get_exchange_info()
```

### Balance Manager

```python
from src.strategy.balance_manager import BalanceManager

bm = BalanceManager(default_allocation=1.0)

# Validate trade
validation = bm.validate_trade(
    symbol="BTCUSDT",
    available_usdt=100.0,
    current_price=50000.0,
    min_notional=10.0,
    step_size=0.00001
)

if validation["valid"]:
    print(f"Order quantity: {validation['order_quantity']}")
```

### Pair Scanner

```python
from src.strategy.scanner import PairScanner

scanner = PairScanner(min_volume_usdt=1000000)

# Get top pairs by volume
tickers = client.get_24h_ticker()
top_pairs = scanner.get_top_pairs(tickers, limit=50, criteria="volume")

# Get trending pairs
trending = scanner.get_trending_pairs(tickers, limit=20)
```

### News Sentiment Analyzer

```python
from src.strategy.news_sentiment import NewsSentimentAnalyzer

analyzer = NewsSentimentAnalyzer(sensitivity=0.6)

# Analyze sentiment
news_items = analyzer.fetch_news()
analyzed = analyzer.analyze_news_batch(news_items)

for item in analyzed:
    if analyzer.should_buy_signal(item, "BTC"):
        print(f"BUY signal: {item['title']}")

# Market summary
summary = analyzer.get_sentiment_summary(analyzed)
print(f"Market Sentiment: {summary['market_sentiment']}")
```

### Freeze Manager (Risk Management)

```python
from src.strategy.freeze_manager import FreezeManager

fm = FreezeManager(trailing_stop_loss_percent=2.0)

# Track position
fm.open_position(
    order_id="123",
    symbol="BTCUSDT",
    entry_price=50000,
    quantity=0.00002,
    buy_amount=1.0
)

# Update price and check stop-loss
status = fm.update_price(order_id="123", current_price=49500)
if status["should_sell"]:
    # Execute sell order
    pass

# Close position
result = fm.close_position(order_id="123", exit_price=51000)
print(f"Profit: ${result['profit']:.2f} ({result['profit_percent']:.2f}%)")
```

## Building for Production

### Android APK Build

**Requirements:**
- Android SDK
- Java Development Kit (JDK)
- Buildozer

**Build locally:**
```bash
pip install buildozer cython

# Build release APK
buildozer android release

# Output: bin/mexc_trading_bot-1.0.0-release.apk
```

**Or use GitHub Actions:**
- Push tag: `git tag v1.0.0 && git push origin v1.0.0`
- Automatic build and release

### Windows EXE Build

**Requirements:**
- Python 3.8+
- PyInstaller

**Build locally:**
```bash
pip install pyinstaller

# Create executable
pyinstaller --onefile src/main.py

# Output: dist/main.exe
```

**Or use GitHub Actions:**
- Automatic build on push to main
- Artifacts available in Actions tab

## Trading Strategy

### Pair Selection Flow
1. Fetch 24h tickers from MEXC
2. Filter pairs with volume > $1,000,000 USDT
3. Rank by volume, volatility, or spread
4. Check sentiment if enabled
5. Validate allocation against balance and pair constraints

### Buy Trigger
1. **Volume-based**: High liquidity, active trading
2. **Sentiment-based**: Positive news with high confidence
3. **Volatility-based**: Trending pairs with momentum

### Risk Management
- **Pre-trade checks**: USDT balance validation
- **Stop-loss**: Trailing 1.5-2.0% from peak
- **Dust cleanup**: Residual balances < $10
- **Rate limiting**: 1-2 sec between API calls

### Position Lifecycle
```
Balance Check → Validate Trade → Place BUY Order
                                        ↓
                            Track Position (WebSocket)
                                        ↓
                    Price Updates → Check Stop-Loss
                                        ↓
                         Stop-Loss Triggered → SELL
                                    OR
                         Manual Close → Record P&L
```

## Security Best Practices

⚠️ **IMPORTANT:**
1. **Never commit credentials**: Keep API keys in `config.json` (added to .gitignore)
2. **Use IP whitelist**: Restrict API key to your IP on MEXC dashboard
3. **Start with dry_run**: Test in dry run mode before live trading
4. **Monitor closely**: Watch activity log during first trades
5. **Use dedicated account**: Trading account separate from main holdings
6. **Small amounts**: Start with minimum allocation ($1)

## API Limits

MEXC rate limits:
- REST API: 100 requests/second
- WebSocket: Unlimited connections
- Bot uses: 1-2 second cooldown between requests

## Troubleshooting

### Connection Errors
```bash
# Check API credentials
python src/main.py --test

# Verify network connectivity
ping api.mexc.com
```

### Insufficient Balance Error
- Ensure USDT balance >= minimum notional for pair
- Check config.json allocation setting
- Review dust balances

### WebSocket Connection Issues
- Firewall blocking WebSocket (port 443)
- Check internet connection
- Restart bot to reconnect

### GUI Not Starting
```bash
# Verify Kivy installation
pip install --upgrade kivy

# Try CLI mode instead
python src/main.py --cli
```

## Performance Optimization

### Database Caching (Optional)
```bash
pip install sqlite3
# For future: Add trade history database
```

### Async Operations
- WebSocket runs in background thread
- GUI remains responsive during API calls
- News fetching non-blocking

## Logging

Logs are saved to console and can be redirected:
```bash
# Verbose logging
python src/main.py --cli -v > trading.log 2>&1

# Check specific errors
tail -f trading.log | grep ERROR
```

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## Testing

```bash
# Run test mode
python src/main.py --test

# Test specific module
python -m pytest tests/ -v

# For future: Add comprehensive test suite
```

## Roadmap

- [ ] Database for trade history
- [ ] Advanced charting (Matplotlib/Plotly)
- [ ] Machine learning price prediction
- [ ] Multi-exchange support (Binance, OKX, etc.)
- [ ] Telegram bot notifications
- [ ] Mobile app (native iOS/Android)
- [ ] Cloud deployment support
- [ ] Backtesting framework

## Disclaimer

⚠️ **Risk Warning:**
- Trading cryptocurrencies is high-risk
- Past performance ≠ future results
- Bot can cause substantial losses
- Use small amounts initially
- Understand all parameters before trading
- Monitor bot regularly

**No warranty**: This software is provided AS-IS without warranty or guarantees.

## Support

- 📧 Email: [your-email@example.com]
- 💬 GitHub Issues: Report bugs and feature requests
- 📖 Documentation: See inline code comments
- 🐛 Debug: Use `--verbose` flag for detailed logs

## License

[MIT License](LICENSE) - See LICENSE file for details

## Acknowledgments

- MEXC API Documentation: https://mexcdevelop.github.io/apidocs
- Kivy Framework: https://kivy.org
- CryptoPanic News: https://cryptopanic.com
- Python Community: Open source tools and libraries

---

## Quick Start Summary

```bash
# 1. Clone and setup
git clone https://github.com/noramark281-lab/Nor.git
cd Nor
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# 2. Install and configure
pip install -r requirements.txt
python src/main.py --create-config
# Edit config.json with your API keys

# 3. Run
python src/main.py --gui    # GUI mode
# or
python src/main.py --cli    # CLI mode
# or
python src/main.py --test   # Test mode
```

**Happy trading! 🚀**
