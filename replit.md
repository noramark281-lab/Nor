# MEXC AI Futures Trading Terminal

A full-stack crypto futures trading web app for MEXC exchange, with live market data, cloud trading bots, and AI analysis via Google Gemini.

## Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion
- **Backend**: Express.js (TypeScript) serving both the Vite dev middleware and REST API
- **AI**: Google Gemini (`@google/genai`)
- **Mobile**: Capacitor (Android APK build)

## How to run

```bash
npm run dev       # Development server on port 5000
npm run build     # Production build (dist/)
npm start         # Serve production build
```

The workflow **Start application** runs `npm run dev` and serves the app on port 5000.

## Environment variables (optional)

| Variable | Purpose |
|---|---|
| `MEXC_API_KEY` | MEXC exchange API key (live trading) |
| `MEXC_SECRET_KEY` | MEXC exchange secret (live trading) |
| `GEMINI_API_KEY` | Google Gemini API key (AI analysis) |

The app works in read-only/paper trading mode without any keys set.

## API routing
- In browser (dev or deployed): all `/api/*` calls go to the local Express server
- In native Android app (Capacitor): calls route to `CLOUD_BACKEND_URL` in `src/utils/api.ts`

## Android APK
- Capacitor config: `capacitor.config.json`
- Android project: `android/`
- Build: `npm run build` then `npx cap sync android` then open in Android Studio

## User preferences
- Keep existing project structure; do not migrate or restructure without asking
