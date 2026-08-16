# MEXC Spot Auto-Trading Bot - Deployment Guide

This guide covers deployment across Windows, Linux, Android, and Cloud platforms.

## 📦 Pre-Deployment Checklist

- [ ] Python 3.8+ installed locally
- [ ] Git installed and configured
- [ ] MEXC account with API credentials (Spot trading enabled)
- [ ] MEXC API key whitelist configured (optional but recommended)
- [ ] GitHub account with repo access (for CI/CD)
- [ ] GitHub Personal Access Token (for releases)

---

## 🖥️ Windows Deployment

### Local Standalone Executable

**Option 1: Build Manually**

```bash
# Clone and setup
git clone https://github.com/yourusername/Nor.git
cd Nor

# Setup environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install pyinstaller

# Build executable
pyinstaller --onefile ^
  --windowed ^
  --name MEXCTradingBot ^
  --add-data "config.json.example;." ^
  src/main.py

# Run
dist\MEXCTradingBot.exe
```

**Option 2: GitHub Actions (Automated)**

1. Push to main branch:
   ```bash
   git add .
   git commit -m "MEXC Bot deployment v1.0.0"
   git push origin main
   ```

2. Go to GitHub → Actions → "Build Windows EXE"
3. Wait for build to complete (5-10 minutes)
4. Download artifact: `mexc-trading-bot-windows`

**Option 3: Installer (NSIS)**

```bash
# After building EXE, build installer
makensis.exe installer.nsi

# Result: dist/MEXCTradingBot-Installer.exe
```

### Windows System Requirements

- **OS**: Windows 10 or later (64-bit)
- **RAM**: 512 MB minimum, 1 GB recommended
- **Disk**: 100 MB free space
- **Network**: Continuous internet required
- **Firewall**: Allow outbound HTTPS/WSS traffic

---

## 🐧 Linux Deployment

### Linux CLI/Headless

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-dev python3-pip

# Clone and setup
git clone https://github.com/yourusername/Nor.git
cd Nor

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt

# Run CLI mode
python src/main.py --cli --config config.json
```

### Linux systemd Service

Create `/etc/systemd/system/mexc-bot.service`:

```ini
[Unit]
Description=MEXC Spot Auto-Trading Bot
After=network.target

[Service]
Type=simple
User=tradingbot
WorkingDirectory=/home/tradingbot/Nor
ExecStart=/home/tradingbot/Nor/.venv/bin/python /home/tradingbot/Nor/src/main.py --cli --config config.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable mexc-bot
sudo systemctl start mexc-bot

# Monitor logs
journalctl -u mexc-bot -f
```

### Linux Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .

RUN pip install -r requirements.txt

CMD ["python", "src/main.py", "--cli", "--config", "config.json"]
```

```bash
# Build and run
docker build -t mexc-bot .
docker run -d --name mexc-bot mexc-bot
```

---

## 📱 Android Deployment

### Build APK Locally

**Requirements:**
- Java JDK 11+
- Android SDK / NDK
- Buildozer

```bash
# Install Buildozer
pip install buildozer cython

# Configure buildozer.spec (edit as needed)
# - Change app name, title, version
# - Configure permissions and features

# Build APK (first time: 20-30 minutes)
buildozer android release

# Output: bin/MEXC*.apk
```

### Deploy via GitHub Actions

```bash
# Trigger workflow
git push origin main

# Monitor: GitHub → Actions → "Build Android APK"
# Download: bin/MEXC*.apk
```

### Install on Android Device

**Method 1: Direct Install (Developer Mode)**
```bash
# Enable USB Debugging on device
adb install bin/MEXC*.apk
```

**Method 2: File Transfer**
1. Copy APK to device
2. Open file manager
3. Tap APK to install

**Android Permissions Required:**
- Internet (network access)
- Access Network State

---

## ☁️ Cloud Deployment (AWS/DigitalOcean/Heroku)

### AWS EC2

```bash
# Launch EC2 instance (t3.micro, Ubuntu 22.04)
ssh -i key.pem ubuntu@<instance-ip>

# Setup
sudo apt-get update
sudo apt-get install -y python3-pip git

git clone https://github.com/yourusername/Nor.git
cd Nor

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy config (or use environment variables)
cp config.json.example config.json
# Edit config.json with your API keys

# Run in background
nohup python src/main.py --cli --config config.json > trading.log 2>&1 &

# Monitor
tail -f trading.log
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Create app:
   - **Build Command**: `pip install -r requirements.txt`
   - **Run Command**: `python src/main.py --cli`
   - **Environment Variables**: Add MEXC_API_KEY, MEXC_API_SECRET
3. Deploy

### Heroku (Free Alternative)

```bash
# Setup
heroku login
heroku create mexc-trading-bot
git remote add heroku https://git.heroku.com/mexc-trading-bot.git

# Procfile
echo 'worker: python src/main.py --cli' > Procfile

# Deploy
git push heroku main

# Start worker
heroku ps:scale worker=1

# Monitor logs
heroku logs --tail
```

---

## 🔒 Production Security Checklist

- [ ] Store API credentials in **environment variables**, not in code
  ```bash
  export MEXC_API_KEY="..."
  export MEXC_API_SECRET="..."
  ```

- [ ] Use **IP whitelisting** on MEXC (Admin Panel → Security)

- [ ] Enable **2FA** on MEXC account

- [ ] Use **read-only API key** for monitoring, **trading key** separate

- [ ] Set **API rate limits** in MEXC settings (if available)

- [ ] Monitor bot logs for suspicious activity:
  ```bash
  grep -i "error\|failed\|unauthorized" trading_bot.log
  ```

- [ ] Set up **alerts** for:
  - Unexpected trades
  - API errors
  - Balance changes

- [ ] Use **firewalls** to restrict outbound connections to only MEXC API

- [ ] Regularly **backup** trading logs and configuration

---

## 📊 Monitoring & Logging

### Log Files

- **Location**: `./trading_bot.log`
- **Format**: `[TIMESTAMP] - [MODULE] - [LEVEL] - [MESSAGE]`

### Log Levels

```bash
# Edit config.json
"logging": {
  "level": "DEBUG"  # DEBUG, INFO, WARNING, ERROR
}
```

### Real-time Monitoring

```bash
# Watch logs live
tail -f trading_bot.log

# Filter by error
grep "ERROR" trading_bot.log

# Watch for trades
grep "TRADE\|BUY\|SELL" trading_bot.log
```

---

## 🚀 Scaling Strategies

### Multiple Instances (High Volume)

```bash
# Instance 1: Monitor & Sentiment
python src/main.py --role monitor --config config-1.json

# Instance 2: Trading (High-frequency)
python src/main.py --role trader --config config-2.json

# Instance 3: Risk Management
python src/main.py --role risk --config config-3.json
```

### Load Balancing

- Use **centralized config service** for all instances
- Implement **position locking** to prevent duplicate trades
- Use **message queue** (Redis/RabbitMQ) for order coordination

---

## 🔧 Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| "ImportError: No module named 'kivy'" | `pip install kivy` |
| "Permission denied" (Linux) | `chmod +x src/main.py` |
| "API rate limit" | Increase `rate_limit_delay` in config |
| "Out of memory" | Reduce `pair_scanner.top_pairs_limit` |
| "WebSocket timeout" | Check firewall, increase `reconnect_interval_seconds` |
| "Config not found" | Ensure `config.json` exists in working directory |

---

## 📈 Performance Tuning

### Reduce CPU Usage
```json
{
  "pair_scanner": {
    "top_pairs_limit": 10  // Default: 20
  },
  "websocket": {
    "streams": ["ticker"]  // Remove "orderbook" if not needed
  }
}
```

### Reduce Memory Usage
```json
{
  "logging": {
    "max_log_size_mb": 50  // Limit log file size
  }
}
```

### Improve Response Time
```json
{
  "rate_limiting": {
    "rest_delay_seconds": 0.5  // Minimum safe value
  }
}
```

---

## 📝 Deployment Checklist

- [ ] Pull latest code: `git pull origin main`
- [ ] Update dependencies: `pip install -r requirements.txt`
- [ ] Run tests: `python run_tests.py`
- [ ] Configure API credentials
- [ ] Test dry-run: `python src/main.py --test`
- [ ] Start bot: `python src/main.py --cli` or `--gui`
- [ ] Monitor logs for 1-2 hours
- [ ] Verify trades are executing correctly
- [ ] Enable monitoring/alerting

---

## 🎯 Post-Deployment

### Regular Maintenance

- **Daily**: Check logs for errors
- **Weekly**: Review trading performance
- **Monthly**: Update dependencies with `pip install -r requirements.txt --upgrade`
- **Quarterly**: Test stop-loss and risk management

### Scaling Plan

1. **Phase 1**: Single instance, $10-50 trading volume
2. **Phase 2**: Multiple high-volume pairs, $50-500 volume
3. **Phase 3**: Multi-instance distributed system, $500+ volume
4. **Phase 4**: Enterprise setup with fail-overs, $1000+ volume

---

## 📞 Support & Escalation

- **Logs**: Check `trading_bot.log` first
- **Issues**: GitHub Issues with error log excerpt
- **Security**: Report to security@example.com

---

**Last Updated**: August 16, 2026  
**Version**: 1.0.0
