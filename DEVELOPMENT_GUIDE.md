# MEXC Trading Bot - Development Guide

## Project Overview

This is a complete implementation of the **MEXC Spot Auto-Trading Bot** with the following components:

### Core Architecture

```
MEXC Trading Bot
├── API Layer (src/api/)
│   ├── MEXC REST API Client (HMAC SHA256)
│   └── WebSocket Real-time Stream Handler
├── Strategy Layer (src/strategy/)
│   ├── Balance Manager (allocation & validation)
│   ├── Pair Scanner (volume & volatility filtering)
│   ├── News Sentiment Analyzer
│   └── Freeze Manager (stop-loss & risk management)
├── UI Layer
│   ├── Kivy GUI (src/gui/)
│   ├── CLI Interface (src/main.py)
│   └── Test Mode
└── Build System
    ├── GitHub Actions (CI/CD)
    ├── PyInstaller (Windows .exe)
    └── Buildozer (Android .apk)
```

## Key Features Implemented

### 1. MEXC REST API Client (`src/api/mexc_spot_client.py`)
**Features:**
- HMAC SHA256 signature generation
- Rate limiting (1-2 second cooldown)
- All major endpoints:
  - `get_account_info()` - Account balance and holdings
  - `get_usdt_balance()` - Quick USDT balance check
  - `get_24h_ticker()` - Market data
  - `place_spot_order()` - Market and limit orders
  - `get_exchange_info()` - Pair constraints (minNotional, stepSize)
  - `get_klines()` - Historical price data
  - `get_open_orders()` / `cancel_order()` - Order management

**Authentication:**
```python
signature = hmac.new(
    api_secret.encode('utf-8'),
    query_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()
```

### 2. WebSocket Real-time Data (`src/api/mexc_ws.py`)
**Features:**
- Multi-stream subscriptions (ticker, klines, depth)
- Threading for non-blocking updates
- Auto-reconnection support
- Background message processing

### 3. Balance Manager (`src/strategy/balance_manager.py`)
**Features:**
- Fixed $1.00 USD allocation per trade
- Validation against MEXC constraints:
  - Minimum notional (minNotional)
  - Step size precision (stepSize)
- Dust detection (< $10 USDT value)
- Portfolio value calculation

**Validation Flow:**
```
1. Check USDT balance >= min_buffer
2. Calculate order amount (min of allocation vs available)
3. Check against minNotional
4. Round to stepSize
5. Validate final amount >= minNotional
```

### 4. Pair Scanner (`src/strategy/scanner.py`)
**Filtering Criteria:**
- Volume filtering (default: > $1,000,000 24h volume)
- Volatility detection (price change %)
- Spread analysis (bid-ask spread)
- Liquidity assessment

**Methods:**
```python
filter_by_volume()     # Top volume pairs
filter_by_volatility() # Trending pairs
filter_by_spread()     # Tight spreads
get_top_pairs()        # Ranked by criteria
get_trending_pairs()   # Positive momentum
```

### 5. News Sentiment Analysis (`src/strategy/news_sentiment.py`)
**Features:**
- RSS feed parsing (CryptoPanic, Bloomberg, CoinDesk)
- Keyword-based sentiment classification
- Cryptocurrency symbol extraction
- Market sentiment aggregation
- Buy signal generation

**Sentiment Scoring:**
```
positive_keywords = ["surge", "bull", "rally", "gain", ...]
negative_keywords = ["crash", "bear", "decline", ...]

score = positive_count / (positive_count + negative_count)
sentiment = "POSITIVE" if score > 0.6 else "NEGATIVE" if score < 0.4 else "NEUTRAL"
```

### 6. Freeze Manager - Risk Management (`src/strategy/freeze_manager.py`)
**Features:**
- Trailing stop-loss tracking
- Position lifecycle management
- P&L calculation
- Dust identification
- Performance analytics

**Stop-loss Logic:**
```
stop_loss_price = highest_price * (1 - trailing_stop_loss_percent / 100)
should_sell = current_price <= stop_loss_price
```

## File Structure

### Entry Point
- **src/main.py** (526 lines)
  - CLI argument parsing
  - Mode selection (GUI/CLI/Test)
  - Configuration management
  - Main application logic

### API Layer
- **src/api/mexc_spot_client.py** (393 lines)
  - MEXC REST API wrapper
  - Authentication & signing
  - Rate limiting
- **src/api/mexc_ws.py** (251 lines)
  - WebSocket client
  - Real-time stream management
  - Threading support

### Strategy Layer
- **src/strategy/balance_manager.py** (235 lines)
  - Balance validation
  - Allocation enforcement
  - Dust detection
- **src/strategy/scanner.py** (298 lines)
  - Pair filtering and ranking
  - Volume/volatility analysis
  - Market statistics
- **src/strategy/news_sentiment.py** (358 lines)
  - RSS feed parsing
  - Sentiment analysis
  - Symbol extraction
- **src/strategy/freeze_manager.py** (385 lines)
  - Position tracking
  - Stop-loss management
  - P&L calculation
  - Performance metrics

### GUI Layer
- **src/gui/main_app.py** (434 lines)
  - Kivy cross-platform GUI
  - Real-time UI updates
  - Background threading
  - Live logging display

### Configuration & Build
- **config.json.example** - Configuration template
- **requirements.txt** - Python dependencies
- **buildozer.spec** - Android build config
- **MEXCTradingBot.spec** - PyInstaller config
- **installer.nsi** - Windows installer
- **setup.sh** / **setup.bat** - Setup scripts

### Workflows
- **.github/workflows/build-android.yml** - Android APK build
- **.github/workflows/build-windows.yml** - Windows EXE build

## Trading Flow Diagram

```
Start Bot
    ↓
[1] Connect to MEXC
    ├─ Verify API credentials
    ├─ Get account info
    └─ Check USDT balance
    ↓
[2] Scan Market
    ├─ Fetch 24h tickers
    ├─ Filter by volume (> $1M)
    ├─ Rank by criteria
    └─ Get top 50 pairs
    ↓
[3] Sentiment Analysis (if enabled)
    ├─ Fetch news from feeds
    ├─ Analyze sentiment
    ├─ Extract symbols
    └─ Generate buy signals
    ↓
[4] Select Pair to Trade
    ├─ Pick top volume pair
    └─ Or use sentiment signal
    ↓
[5] Validate Trade
    ├─ Check USDT balance
    ├─ Get pair info (minNotional, stepSize)
    ├─ Calculate allocation
    ├─ Validate constraints
    └─ If valid → continue
    ↓
[6] Place BUY Order
    ├─ Market order (quote_order_qty=$1.00)
    └─ Record order ID
    ↓
[7] Track Position
    ├─ Subscribe to WebSocket
    ├─ Monitor price updates
    ├─ Track highest price
    └─ Calculate profit %
    ↓
[8] Check Stop-Loss
    ├─ Calculate stop level
    ├─ If price ≤ stop → SELL
    └─ Or manual exit
    ↓
[9] Close Position
    ├─ Record P&L
    ├─ Update performance metrics
    └─ Log trade history
    ↓
Repeat
```

## Configuration Options

```json
{
  "api_key": "MEXC API Key",
  "api_secret": "MEXC API Secret",
  
  "allocation": 1.0,                  // USD per trade
  "min_volume": 1000000,              // Min 24h volume USD
  "stop_loss": 2.0,                   // Trailing stop % 
  "sentiment_sensitivity": 0.6,       // News confidence threshold (0-1)
  
  "enable_news_sentiment": true,      // Enable news-driven trading
  "dry_run": true,                    // Test mode (no real trades)
  "rate_limit_delay": 1.0,            // API request delay (sec)
  
  "max_concurrent_positions": 5,      // Max open trades
  "check_interval_seconds": 60        // Price check frequency
}
```

## Usage Modes

### 1. GUI Mode (Default)
```bash
python src/main.py --gui

# Provides:
# - Visual dashboard
# - Real-time balance updates
# - Active positions display
# - Activity log
# - Configuration inputs
# - One-click trading controls
```

### 2. CLI Mode (Server)
```bash
python src/main.py --cli

# Provides:
# - Headless operation
# - Console output
# - Periodic status updates
# - Suitable for VPS/Docker deployment
```

### 3. Test Mode
```bash
python src/main.py --test

# Tests:
# - Balance manager validation
# - Sentiment analysis
# - API connectivity
# - No real trades placed
```

## API Rate Limiting

MEXC Limits:
- REST API: 100 requests/second
- WebSocket: Unlimited
- Bot implementation: 1-2 second delays between requests

**Rate Limiter Implementation:**
```python
def _apply_rate_limit(self):
    elapsed = time.time() - self.last_request_time
    if elapsed < self.rate_limit_delay:
        time.sleep(self.rate_limit_delay - elapsed)
    self.last_request_time = time.time()
```

## Error Handling

All components include:
- Try-except blocks for network errors
- Graceful degradation
- Detailed error logging
- User-friendly error messages

## Testing Strategy

### Unit Tests (To be added)
- Balance validation edge cases
- Sentiment scoring accuracy
- Stop-loss calculation
- Order rounding

### Integration Tests (To be added)
- API connectivity
- WebSocket subscription
- End-to-end trading flow

### Manual Testing
```bash
python src/main.py --test
```

## Performance Optimization

1. **Threading**: Background tasks (news fetch, WebSocket)
2. **Rate limiting**: Prevent API bans
3. **Caching**: Reduce API calls
4. **Async operations**: Non-blocking UI
5. **Memory efficiency**: Limited log history (100 lines)

## Security Considerations

1. **API Key Protection**
   - Never hardcode credentials
   - Use config.json (in .gitignore)
   - Use IP whitelist on MEXC

2. **Request Signing**
   - HMAC SHA256 for all authenticated endpoints
   - Timestamp validation

3. **Trade Safety**
   - Dry run mode by default
   - Small allocation ($1)
   - Pre-trade validation
   - Stop-loss protection

## Deployment

### Local Development
```bash
./setup.sh  # or setup.bat on Windows
python src/main.py --cli
```

### Docker (Future)
```dockerfile
FROM python:3.11
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "src/main.py", "--cli"]
```

### Server Deployment
```bash
nohup python src/main.py --cli > trading.log 2>&1 &
```

### Android APK
```bash
buildozer android release
# or via GitHub Actions
```

### Windows EXE
```bash
pyinstaller MEXCTradingBot.spec
# or via GitHub Actions
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes
4. Commit: `git commit -m 'Add feature'`
5. Push: `git push origin feature/name`
6. Create Pull Request

## Code Style

- PEP 8 Python style guide
- Type hints for all functions
- Docstrings for modules/classes/functions
- Clear variable names
- Comments for complex logic

## Roadmap

Phase 1 (Completed):
- ✅ MEXC API integration
- ✅ Balance management
- ✅ Pair scanning
- ✅ News sentiment analysis
- ✅ Stop-loss management
- ✅ GUI with Kivy
- ✅ CI/CD workflows

Phase 2 (Planned):
- [ ] Database for trade history
- [ ] Advanced charting
- [ ] Machine learning predictions
- [ ] Multi-exchange support
- [ ] Telegram notifications
- [ ] Mobile native app
- [ ] Backtesting framework
- [ ] Cloud deployment

## Documentation

- **README_TRADING_BOT.md** - User guide (quick start, features, API reference)
- **DEVELOPMENT_GUIDE.md** - This file (architecture, code overview)
- **Inline code comments** - Implementation details
- **Docstrings** - Function documentation

## Support

- GitHub Issues: Bug reports and feature requests
- README_TRADING_BOT.md: User documentation
- Code comments: Developer documentation

## License

MIT License - See LICENSE file

---

**Last Updated**: August 16, 2024
**Project Version**: 1.0.0
**Status**: Production Ready
