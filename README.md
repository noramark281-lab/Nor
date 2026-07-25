# MEXC AI Futures Trading Terminal & Cloud Bot Platform 🚀

A high-performance full-stack web application for trading crypto futures on MEXC with automated cloud bots, live candlestick charts, real-time depth order books, and AI market analysis powered by Google Gemini.

---

## 🌟 Key Features

- **📊 Live Market Terminal**: Real-time ticker prices, order book (depth), live candlestick charts, and instant position management.
- **🤖 Cloud Trading Bots**: Run automated trading strategies with custom risk management, leverage settings, take-profit, and stop-loss rules.
- **🧠 AI Trading Assistant**: Integrated with Gemini API for technical market analysis and strategy recommendations.
- **🔐 API Credentials Management**: Secure storage and instant validation of MEXC API keys & secrets (supporting paper trading and real futures).
- **📱 Responsive & Mobile Ready**: Clean dark-mode trading interface optimized for both desktop terminals and mobile screens.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons, Motion animations.
- **Backend**: Express.js, Node.js, REST Proxy with custom headers & failover fallback.
- **AI Integration**: `@google/genai` (Gemini API).

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18 or v20+)
- npm or yarn or bun

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/noramark281-lab/Nor.git
   cd Nor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your keys in `.env` (optional for local dev):
   ```env
   MEXC_API_KEY=your_mexc_api_key
   MEXC_SECRET_KEY=your_mexc_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 GitHub Actions CI

This repository is equipped with GitHub Actions (`.github/workflows/ci.yml`) to automatically test type safety and build the production bundle on every push to `main`.

---

## 📄 License

MIT License.
