# Quick Start Guide - MEXC Spot Auto-Trading Bot

Follow these 5 simple steps to get the bot running in 10 minutes.

## Step 1: Clone & Setup (2 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/Nor.git
cd Nor

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Step 2: Get MEXC API Keys (3 minutes)

1. Go to https://www.mexc.com/user/setting/api
2. Click **"Create API Key"**
3. Set Label: `MEXC-Bot`
4. **Security Settings:**
   - ✅ Spot Trading
   - ✅ Read Accounts
   - ❌ Uncheck Withdrawal/Transfer
5. Copy `API Key` and `Secret Key`

## Step 3: Configure Bot (2 minutes)

```bash
# Copy example config
cp config.json.example config.json

# Edit config.json (replace with your keys)
{
  "mexc": {
    "api_key": "YOUR_API_KEY_HERE",
    "api_secret": "YOUR_API_SECRET_HERE"
  },
  "trading": {
    "default_allocation": 1.0
  }
}
```

## Step 4: Test Connection (1 minute)

```bash
# Test API connection
python src/main.py --test

# Expected output:
# "Connected! USDT Balance: $XX.XX"
# "Exchange has 2000+ trading pairs"
```

## Step 5: Start Trading (2 minutes)

```bash
# Start GUI
python src/main.py --gui

# OR start CLI (headless)
python src/main.py --cli
```

---

## ✅ You're Done!

The bot is now:
- ✓ Monitoring market sentiment
- ✓ Scanning top volume pairs
- ✓ Ready to execute trades
- ✓ Tracking stop-loss in real-time

---

## 🎯 First Trade (Test)

1. Open the bot GUI
2. Click **"Start Trading"**
3. Monitor the **Live Log** window
4. First buy signal usually appears within 10-30 minutes

---

## ⚠️ Important Reminders

- 🔒 **NEVER share** API key/secret
- 💰 **Start small** - Test with $1-10 first
- 🛑 **Have kill-switch ready** - Stop button always visible
- 📊 **Monitor trades** - Don't leave unattended
- 📝 **Check logs** - All trades recorded in `trading_bot.log`

---

## 🆘 Common Errors & Fixes

| Error | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'kivy'` | Run: `pip install kivy` |
| `Invalid API key` | Check key spelling, API must be enabled |
| `Insufficient balance` | Deposit USDT to Spot Account, minimum $1 |
| `Connection refused` | Check internet, MEXC servers may be down |

---

## 📖 Next Steps

- Read full documentation: [BOT_README.md](BOT_README.md)
- Customize configuration: [config.json.example](config.json.example)
- View source code: [src/](src/)
- Check API docs: https://mexcdeveloper.com/

**Good luck with your automated trading! 🚀**
