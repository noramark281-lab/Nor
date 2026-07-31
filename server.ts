import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// 1. Google Gen AI Setup
// ---------------------------------------------------------------------------
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn('⚠️ GEMINI_API_KEY is missing from environment variables.');
}

// ---------------------------------------------------------------------------
// 2. In-Memory Store & State
// ---------------------------------------------------------------------------
export interface ApiCredentials {
  apiKey: string;
  secretKey: string;
}

export interface MexcOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price?: number;
  quantity: number;
  leverage?: number;
  isSimulated?: boolean;
}

export interface MexcPosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  markPrice: number;
  quantity: number;
  leverage: number;
  unrealizedPnL: number;
  margin: number;
  isSimulated: boolean;
}

export interface BotInstance {
  id: string;
  name: string;
  pair: string;
  strategy: string;
  status: 'active' | 'paused' | 'stopped';
  profit: number;
  isSimulated: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// Memory Storage
let currentCredentials: ApiCredentials = {
  apiKey: process.env.MEXC_API_KEY || '',
  secretKey: process.env.MEXC_SECRET_KEY || '',
};

let simulatedAccount = {
  totalBalance: 10000,
  availableBalance: 8500,
  inOrderMargin: 1500,
  currency: 'USDT',
};

let positions: MexcPosition[] = [
  {
    id: 'pos-1',
    symbol: 'BTCUSDT',
    side: 'LONG',
    entryPrice: 91250,
    markPrice: 93400,
    quantity: 0.1,
    leverage: 10,
    unrealizedPnL: 215.00,
    margin: 912.5,
    isSimulated: true,
  },
  {
    id: 'pos-2',
    symbol: 'ETHUSDT',
    side: 'SHORT',
    entryPrice: 3420,
    markPrice: 3380,
    quantity: 1.5,
    leverage: 5,
    unrealizedPnL: 60.00,
    margin: 1026.0,
    isSimulated: true,
  },
];

let activeBots: BotInstance[] = [
  { id: 'bot-1', name: 'Scalper AI Alpha', pair: 'BTCUSDT', strategy: 'Ultra Scalping', status: 'active', profit: 342.50, isSimulated: true },
  { id: 'bot-2', name: 'Grid Master V2', pair: 'SOLUSDT', strategy: 'Grid Trading', status: 'active', profit: 128.10, isSimulated: true },
  { id: 'bot-3', name: 'Arbitrage Hunter', pair: 'ETHUSDT', strategy: 'Arbitrage', status: 'paused', profit: 45.00, isSimulated: true },
];

let serverLogs: LogEntry[] = [
  { id: '1', timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'System backend initialized correctly.' },
  { id: '2', timestamp: new Date().toLocaleTimeString(), type: 'success', message: 'Connected to MEXC simulated execution environment.' }
];

// Helper to push logs safely with limit
function addLog(type: LogEntry['type'], message: string) {
  serverLogs.unshift({
    id: Date.now().toString(),
    timestamp: new Date().toLocaleTimeString(),
    type,
    message
  });
  if (serverLogs.length > 100) {
    serverLogs.pop();
  }
}

// Helper: MEXC Spot API Signature Generator
function generateMexcSpotSignature(secretKey: string, queryString: string): string {
  return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
}

// Helper: MEXC Contract/Futures API Signature Generator
function generateMexcFuturesSignature(apiKey: string, secretKey: string, reqTime: string, paramsStr: string = ''): string {
  const strToSign = apiKey + reqTime + paramsStr;
  return crypto.createHmac('sha256', secretKey).update(strToSign).digest('hex');
}

// ---------------------------------------------------------------------------
// 3. API Endpoints
// ---------------------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get Server Logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: serverLogs });
});

// Update API Credentials
app.post('/api/credentials', (req, res) => {
  const { apiKey, secretKey } = req.body;
  if (!apiKey || !secretKey) {
    return res.status(400).json({ error: 'Both API Key and Secret Key are required.' });
  }

  currentCredentials = { apiKey, secretKey };
  addLog('success', 'MEXC API Credentials updated on backend.');
  res.json({ message: 'Credentials updated successfully.', apiKeySet: true });
});

// Test MEXC API Credentials (Spot & Futures)
app.post('/api/mexc/test-credentials', async (req, res) => {
  const { apiKey, secretKey } = req.body;
  const keyToUse = apiKey || currentCredentials.apiKey;
  const secretToUse = secretKey || currentCredentials.secretKey;

  if (!keyToUse || !secretToUse) {
    return res.status(400).json({ success: false, message: 'Missing API Credentials.' });
  }

  try {
    // 1. Try Spot Account Check
    const ts = Date.now();
    const queryString = `recvWindow=5000&timestamp=${ts}`;
    const spotSig = generateMexcSpotSignature(secretToUse, queryString);

    const spotRes = await axios.get(`https://api.mexc.com/api/v3/account?${queryString}&signature=${spotSig}`, {
      headers: { 'X-MEXC-APIKEY': keyToUse },
      timeout: 5000,
    });

    addLog('success', 'MEXC Spot API connected successfully!');
    return res.json({
      success: true,
      mode: 'Spot API',
      accountInfo: spotRes.data,
      message: 'Successfully authenticated with MEXC Spot API!',
    });
  } catch (spotErr: any) {
    // 2. Fallback to Contract / Futures Check
    try {
      const ts = Date.now().toString();
      const futuresSig = generateMexcFuturesSignature(keyToUse, secretToUse, ts, '');

      const futuresRes = await axios.get('https://contract.mexc.com/api/v1/private/account/assets', {
        headers: {
          'ApiKey': keyToUse,
          'Request-Time': ts,
          'Signature': futuresSig,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (futuresRes.data && futuresRes.data.success) {
        addLog('success', 'MEXC Futures API connected successfully!');
        return res.json({
          success: true,
          mode: 'Futures API',
          accountInfo: futuresRes.data.data,
          message: 'Successfully authenticated with MEXC Futures API!',
        });
      }

      throw new Error(futuresRes.data?.message || 'Failed to authenticate Futures API');
    } catch (futuresErr: any) {
      const errorMsg = spotErr.response?.data?.msg || futuresErr.response?.data?.message || futuresErr.message || spotErr.message;
      addLog('error', `MEXC API Connection Failed: ${errorMsg}`);
      return res.status(401).json({
        success: false,
        message: `Authentication failed: ${errorMsg}`,
      });
    }
  }
});

// Fetch Real-time Balance
app.get('/api/mexc/balance', async (req, res) => {
  if (!currentCredentials.apiKey || !currentCredentials.secretKey) {
    return res.json({ isSimulated: true, ...simulatedAccount });
  }

  try {
    const ts = Date.now();
    const queryString = `recvWindow=5000&timestamp=${ts}`;
    const signature = generateMexcSpotSignature(currentCredentials.secretKey, queryString);

    const response = await axios.get(`https://api.mexc.com/api/v3/account?${queryString}&signature=${signature}`, {
      headers: { 'X-MEXC-APIKEY': currentCredentials.apiKey },
      timeout: 4000,
    });

    const usdtAsset = response.data.balances?.find((b: any) => b.asset === 'USDT');
    const free = parseFloat(usdtAsset?.free || '0');
    const locked = parseFloat(usdtAsset?.locked || '0');

    return res.json({
      isSimulated: false,
      totalBalance: free + locked,
      availableBalance: free,
      inOrderMargin: locked,
      currency: 'USDT',
    });
  } catch (err) {
    // Fallback to simulation if live API fails
    return res.json({ isSimulated: true, ...simulatedAccount });
  }
});

// Fetch Active Positions
app.get('/api/mexc/positions', (req, res) => {
  res.json({ positions });
});

// Execute Trading Order
app.post('/api/mexc/order/place', async (req, res) => {
  const orderReq: MexcOrderRequest = req.body;

  if (!orderReq.symbol || !orderReq.side || !orderReq.quantity) {
    return res.status(400).json({ error: 'Missing required order fields.' });
  }

  if (orderReq.isSimulated || !currentCredentials.apiKey) {
    // Execute simulated order
    const entryPrice = orderReq.price || (orderReq.symbol.includes('BTC') ? 92000 : 3400);
    const leverage = orderReq.leverage || 10;
    const positionMargin = (entryPrice * orderReq.quantity) / leverage;

    if (positionMargin > simulatedAccount.availableBalance) {
      return res.status(400).json({ error: 'Insufficient simulated balance for position.' });
    }

    simulatedAccount.availableBalance -= positionMargin;
    simulatedAccount.inOrderMargin += positionMargin;

    const newPosition: MexcPosition = {
      id: `pos-${Date.now()}`,
      symbol: orderReq.symbol,
      side: orderReq.side === 'BUY' ? 'LONG' : 'SHORT',
      entryPrice,
      markPrice: entryPrice,
      quantity: orderReq.quantity,
      leverage,
      unrealizedPnL: 0,
      margin: positionMargin,
      isSimulated: true,
    };

    positions.push(newPosition);
    addLog('info', `Simulated Order Executed: ${orderReq.side} ${orderReq.quantity} ${orderReq.symbol} @ $${entryPrice}`);

    return res.json({
      success: true,
      isSimulated: true,
      orderId: `sim-ord-${Date.now()}`,
      position: newPosition,
    });
  }

  // Live Order Logic (Spot Example)
  try {
    const ts = Date.now();
    const queryString = `symbol=${orderReq.symbol}&side=${orderReq.side}&type=${orderReq.type}&quantity=${orderReq.quantity}&timestamp=${ts}`;
    const signature = generateMexcSpotSignature(currentCredentials.secretKey, queryString);

    const response = await axios.post(
      `https://api.mexc.com/api/v3/order?${queryString}&signature=${signature}`,
      {},
      { headers: { 'X-MEXC-APIKEY': currentCredentials.apiKey } }
    );

    addLog('success', `Live Order Placed on MEXC: ${orderReq.side} ${orderReq.symbol}`);
    return res.json({ success: true, isSimulated: false, orderData: response.data });
  } catch (err: any) {
    const errorMsg = err.response?.data?.msg || err.message;
    addLog('error', `Live Order Failed: ${errorMsg}`);
    return res.status(500).json({ error: errorMsg });
  }
});

// Close Active Position
app.post('/api/mexc/position/close', (req, res) => {
  const { positionId } = req.body;
  const index = positions.findIndex(p => p.id === positionId);

  if (index === -1) {
    return res.status(404).json({ error: 'Position not found.' });
  }

  const pos = positions[index];
  const realizedPnL = pos.unrealizedPnL || 0;
  simulatedAccount.availableBalance += (pos.margin + realizedPnL);
  simulatedAccount.inOrderMargin = Math.max(0, simulatedAccount.inOrderMargin - pos.margin);
  simulatedAccount.totalBalance += realizedPnL;

  positions.splice(index, 1);
  addLog('success', `Closed position ${pos.symbol} (${pos.side}) with PnL: $${realizedPnL.toFixed(2)}`);

  res.json({ success: true, closedPositionId: positionId, pnl: realizedPnL });
});

// Bot Management Endpoints
app.get('/api/bots', (req, res) => {
  res.json({ bots: activeBots });
});

app.post('/api/bots/toggle', (req, res) => {
  const { botId, action } = req.body;
  const bot = activeBots.find(b => b.id === botId);

  if (!bot) return res.status(404).json({ error: 'Bot not found.' });

  if (action === 'start') bot.status = 'active';
  else if (action === 'pause') bot.status = 'paused';
  else if (action === 'stop') bot.status = 'stopped';

  addLog('info', `Bot ${bot.name} status updated to: ${bot.status}`);
  res.json({ success: true, bot });
});

// ---------------------------------------------------------------------------
// 4. Gemini AI Integration (Market Analysis & Insights)
// ---------------------------------------------------------------------------
app.post('/api/ai/analyze', async (req, res) => {
  const { symbol = 'BTCUSDT', timeframe = '1h' } = req.body;

  if (!ai) {
    return res.json({
      symbol,
      recommendation: 'HOLD',
      confidence: 65,
      summary: 'Gemini AI key missing. Showing simulated offline analysis.',
      suggestedLeverage: 5,
      stopLoss: 90000,
      takeProfit: 95000,
    });
  }

  try {
    const prompt = `
      Act as an expert crypto trading strategist. Analyze current market dynamics for ${symbol} on timeframe ${timeframe}.
      Provide a concise recommendation response in JSON format matching this TypeScript interface:
      {
        "recommendation": "BUY" | "SELL" | "HOLD",
        "confidence": number (0-100),
        "summary": "Short 2-sentence market overview explanation.",
        "suggestedLeverage": number,
        "stopLoss": number,
        "takeProfit": number
      }
      Return raw JSON only without markdown code blocks.
    `;

    // Fixed model name to official stable gemini-2.0-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    addLog('info', `AI Market Analysis completed for ${symbol}`);
    res.json({ symbol, ...analysis });
  } catch (err: any) {
    addLog('error', `AI Analysis error: ${err.message}`);
    // Fallback response on AI error
    res.json({
      symbol,
      recommendation: 'BUY',
      confidence: 78,
      summary: 'Automated fallback analysis: Market shows bullish consolidation above key support level.',
      suggestedLeverage: 10,
      stopLoss: 90500,
      takeProfit: 94800,
    });
  }
});

// Simulated Background Bot Trading Engine Loop
setInterval(() => {
  activeBots.forEach(bot => {
    if (bot.status === 'active') {
      const delta = (Math.random() - 0.48) * 1.5;
      bot.profit += delta;
    }
  });

  // Periodically update PnL on open simulated positions
  positions.forEach(pos => {
    const fluctuation = (Math.random() - 0.49) * 20;
    pos.markPrice += fluctuation;
    const diff = pos.side === 'LONG' ? pos.markPrice - pos.entryPrice : pos.entryPrice - pos.markPrice;
    pos.unrealizedPnL = parseFloat(((diff / pos.entryPrice) * pos.margin * pos.leverage).toFixed(2));
  });
}, 5000);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 MEXC AI Trading Backend Engine running on port ${PORT}`);
  console.log(`📡 Gemini AI API configured: ${apiKey ? 'YES' : 'NO'}`);
});
