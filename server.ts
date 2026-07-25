import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Bot State
let botState = {
  running: false,
  symbol: 'BTCUSDT',
  strategy: 'MEXC Event Futures - High Speed Momentum',
  timeframe: '15m',
  tradeAmount: 5.0,
  tradesCount: 0,
  pnlUsdt: 0,
  logs: [
    `[${new Date().toLocaleTimeString('ar-EG')}] تم تجهيز محرك التداول الآلي على MEXC.`,
  ] as string[],
  lastTradeTime: new Date().toLocaleTimeString('ar-EG'),
};

// ============================================================
// MEXC API Helper: Build signature and call MEXC
// ============================================================
const MEXC_BASE_URL = 'https://contract.mexc.com';
const MEXC_SPOT_URL = 'https://api.mexc.com';

function getMexcKeys() {
  const apiKey = process.env.MEXC_API_KEY;
  const secretKey = process.env.MEXC_SECRET_KEY;
  if (!apiKey || !secretKey) {
    return null;
  }
  return { apiKey, secretKey };
}

/**
 * Build HMAC-SHA256 signature for MEXC API
 */
function sign(params: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(params).digest('hex');
}

/**
 * Call MEXC Futures API (authenticated)
 * Uses v1/private endpoints for futures account
 * IMPORTANT: GET requests must NOT have Content-Type header at all
 * This fixes the "Invalid content Type" error (code:700013)
 */
async function mexcFuturesGet(endpoint: string, secretKey: string): Promise<any> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = sign(queryString, secretKey);
  const url = `${MEXC_BASE_URL}/api/v1/private${endpoint}?${queryString}&signature=${signature}`;

  // CRITICAL FIX: For GET requests, ONLY send X-MEXC-APIKEY header
  // DO NOT send Content-Type at all - this was causing the 700013 error
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-MEXC-APIKEY': process.env.MEXC_API_KEY!,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.msg || json.message || errorMsg;
    } catch (e) {
      errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Call MEXC Futures API - POST (place order)
 * For POST requests, send body as form-urlencoded with signature in URL
 */
async function mexcFuturesPost(endpoint: string, bodyParams: Record<string, string>, secretKey: string): Promise<any> {
  const timestamp = Date.now();
  // Build query string from body params + timestamp
  const paramEntries = Object.entries(bodyParams);
  const paramStr = paramEntries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const queryString = `${paramStr}&timestamp=${timestamp}`;
  const signature = sign(queryString, secretKey);
  const url = `${MEXC_BASE_URL}/api/v1/private${endpoint}?timestamp=${timestamp}&signature=${signature}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-MEXC-APIKEY': process.env.MEXC_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyParams),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.msg || json.message || errorMsg;
    } catch (e) {
      errorMsg = text;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Call MEXC Spot API (authenticated)
 */
async function mexcSpotGet(endpoint: string, secretKey: string): Promise<any> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}&recvWindow=10000`;
  const signature = sign(queryString, secretKey);
  const url = `${MEXC_SPOT_URL}/api/v3${endpoint}?${queryString}&signature=${signature}`;

  // CRITICAL: No Content-Type for GET requests
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-MEXC-APIKEY': process.env.MEXC_API_KEY!,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      errorMsg = json.msg || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// ============================================================
// Routes
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MEXC Market Tickers - Real prices from MEXC API
app.get('/api/mexc/tickers', async (req, res) => {
  try {
    // Fetch real ticker prices from MEXC
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    const tickers = [];

    for (const symbol of symbols) {
      try {
        const res2 = await fetch(`https://contract.mexc.com/api/v1/contract/detail/${symbol}`);
        if (res2.ok) {
          const data = await res2.json();
          if (data.success && data.data) {
            const d = data.data;
            tickers.push({
              symbol: symbol,
              name: `${symbol.replace('USDT', '')} Event Futures`,
              price: parseFloat(d.lastPrice || '0'),
              change24h: parseFloat(d.chgRate || '0') * 100,
              high24h: parseFloat(d.high24Price || '0'),
              low24h: parseFloat(d.low24Price || '0'),
              yieldRate: 80,
            });
            continue;
          }
        }
      } catch (e) {
        // Fall through to fallback
      }
    }

    // If we got no real data, return fallback
    if (tickers.length === 0) {
      return res.json({
        tickers: [
          { symbol: 'BTCUSDT', name: 'Bitcoin Event Futures', price: 0, change24h: 0, high24h: 0, low24h: 0, yieldRate: 80, error: 'تعذر جلب الأسعار الحقيقية' },
          { symbol: 'ETHUSDT', name: 'Ethereum Event Futures', price: 0, change24h: 0, high24h: 0, low24h: 0, yieldRate: 80, error: 'تعذر جلب الأسعار الحقيقية' },
          { symbol: 'SOLUSDT', name: 'Solana Event Futures', price: 0, change24h: 0, high24h: 0, low24h: 0, yieldRate: 80, error: 'تعذر جلب الأسعار الحقيقية' },
        ],
      });
    }

    res.json({ tickers, source: 'MEXC Live' });
  } catch (err: any) {
    res.status(500).json({ tickers: [], error: err.message });
  }
});

// Real MEXC Futures Account Balance
app.get('/api/mexc/account', async (req, res) => {
  try {
    const keys = getMexcKeys();

    if (!keys) {
      // No API keys configured - return error instead of fake balance
      return res.json({
        success: false,
        error: 'لم يتم تكوين مفاتيح API MEXC. يرجى إضافة MEXC_API_KEY و MEXC_SECRET_KEY في إعدادات المشروع.',
        hasKeys: false,
        usdtBalance: 0,
        futuresBalance: 0,
        status: 'غير متصل - مفاتيح API غير مهيأة',
      });
    }

    try {
      // Call MEXC Futures API to get ALL account assets
      const accountData = await mexcFuturesGet('/account/assets', keys.secretKey);

      if (!accountData || !accountData.success || accountData.code !== 0) {
        return res.json({
          success: false,
          error: accountData?.message || accountData?.msg || 'فشل في جلب بيانات الحساب',
          details: accountData,
          usdtBalance: 0,
          futuresBalance: 0,
          status: 'خطأ في API MEXC',
        });
      }

      // Find USDT balance from futures account
      let usdtBalance = 0;
      let futuresEquity = 0;
      let totalCashBalance = 0;

      const assets = accountData.data || [];
      for (const asset of assets) {
        if (asset.currency === 'USDT') {
          usdtBalance = parseFloat(asset.availableBalance || '0');
          futuresEquity = parseFloat(asset.equity || '0');
          totalCashBalance = parseFloat(asset.cashBalance || '0');
        }
      }

      res.json({
        success: true,
        hasKeys: true,
        usdtBalance: usdtBalance,
        futuresEquity: futuresEquity,
        cashBalance: totalCashBalance,
        allAssets: assets,
        status: 'متصل بـ MEXC Futures API - رصيد حقيقي',
        source: 'contract.mexc.com/api/v1/private/account/assets',
      });
    } catch (err: any) {
      console.error('MEXC Futures API Error:', err.message);
      return res.json({
        success: false,
        error: err.message,
        usdtBalance: 0,
        futuresBalance: 0,
        status: 'خطأ في الاتصال بـ MEXC Futures API',
        hasKeys: true,
      });
    }
  } catch (err: any) {
    console.error('Account endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'خطأ في الخادم',
      details: err.message,
    });
  }
});

// MEXC Trade / Order Execution - Futures
app.post('/api/mexc/trade', async (req, res) => {
  try {
    const { symbol, side, amount, leverage } = req.body;
    const keys = getMexcKeys();

    if (!keys) {
      return res.status(400).json({
        success: false,
        error: 'مفاتيح API غير مهيأة للتداول الحقيقي',
      });
    }

    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: 'بيانات الصفقة غير مكتملة: symbol, side, amount مطلوبة',
      });
    }

    // Map UP/DOWN to Long/Short for futures
    const positionType = side === 'UP' ? 1 : 2; // 1=Long, 2=Short
    const qty = parseFloat(amount);

    try {
      // Place a futures order via MEXC Futures API
      const orderParams: Record<string, string> = {
        symbol: symbol,
        leverage: (leverage || '10').toString(),
        positionType: positionType.toString(),
        openType: '1', // isolated margin
        quantity: qty.toString(),
        orderType: '1', // limit
        price: '0', // market-like (will need to get current price)
      };

      // For market orders, we need to use a different approach
      // MEXC Futures uses limit orders with aggressive pricing for market-like execution
      // Or we can use the spot API for simple BUY/SELL

      // Try placing order
      const orderData = await mexcFuturesPost('/order/submit', orderParams, keys.secretKey);

      if (!orderData || !orderData.success) {
        throw new Error(orderData?.msg || orderData?.message || 'فشل تنفيذ الصفقة');
      }

      botState.logs.unshift(`[${new Date().toLocaleTimeString('ar-EG')}] ✅ صفقة حقيقية: ${side === 'UP' ? 'Long' : 'Short'} بمبلغ ${qty} على ${symbol}`);
      botState.tradesCount += 1;
      botState.lastTradeTime = new Date().toLocaleTimeString('ar-EG');

      res.json({
        success: true,
        orderId: orderData.data?.orderId || orderData.data?.id || Date.now().toString(),
        symbol: symbol,
        type: side,
        amount: qty,
        leverage: leverage || 10,
        message: 'تم تنفيذ الصفقة الحقيقية بنجاح على منصة MEXC Futures',
        details: orderData.data,
      });
    } catch (err: any) {
      console.error('MEXC Futures Order Error:', err.message);
      throw new Error(`فشل تنفيذ الصفقة على MEXC: ${err.message}`);
    }
  } catch (err: any) {
    console.error('MEXC trade error:', err);
    botState.logs.unshift(`[${new Date().toLocaleTimeString('ar-EG')}] ❌ خطأ: ${err.message}`);
    res.status(500).json({
      success: false,
      error: err.message || 'فشل تنفيذ الصفقة',
    });
  }
});

// Bot Control Endpoints
app.get('/api/bot/status', (req, res) => {
  res.json(botState);
});

app.post('/api/bot/start', (req, res) => {
  botState.running = true;
  const time = new Date().toLocaleTimeString('ar-EG');
  botState.logs.unshift(`[${time}] 🚀 تم تشغيل بوت التداول الآلي`);
  res.json({ success: true, running: true });
});

app.post('/api/bot/stop', (req, res) => {
  botState.running = false;
  const time = new Date().toLocaleTimeString('ar-EG');
  botState.logs.unshift(`[${time}] 🛑 تم إيقاف بوت التداول الآلي`);
  res.json({ success: true, running: false });
});

// GitHub Actions Trigger
app.post('/api/github/trigger-build', async (req, res) => {
  try {
    const token = process.env.TOKEN_NOR || process.env.GITHUB_TOKEN;
    const repoOwner = 'noramark281-lab';
    const repoName = 'Nor';

    if (!token) {
      return res.json({
        success: true,
        message: 'لا يوجد توكن GitHub متاح. البناء يعمل تلقائياً عند push.',
      });
    }

    const triggerUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/main.yml/dispatches`;
    const ghRes = await fetch(triggerUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (ghRes.ok) {
      res.json({ success: true, message: 'تم إرسال أمر البناء لـ GitHub Actions' });
    } else {
      res.json({
        success: false,
        message: 'فشل إرسال أمر البناء',
        details: await ghRes.text(),
      });
    }
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// Serve static files & SPA fallback
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
