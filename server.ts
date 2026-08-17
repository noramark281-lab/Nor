import express from 'express'
import path from 'path'
import crypto from 'crypto'
import cors from 'cors'
import { createServer as createViteServer } from 'vite'

const app = express()
const PORT = 3000
const MEXC_API_BASE = 'https://api.mexc.com'

app.use(cors())
app.use(express.json())

// Helper to sign query string with secret key using HMAC SHA-256
function signMexcQuery(secretKey: string, queryString: string): string {
  return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex')
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 2. MEXC Price ticker proxy
app.get('/api/mexc/ticker/price', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || ''
    const url = symbol
      ? `${MEXC_API_BASE}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`
      : `${MEXC_API_BASE}/api/v3/ticker/price`
    const mexcRes = await fetch(url)
    const data = await mexcRes.json()
    res.status(mexcRes.status).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch price from MEXC' })
  }
})

// 3. MEXC 24hr Ticker proxy
app.get('/api/mexc/ticker/24hr', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || ''
    const url = symbol
      ? `${MEXC_API_BASE}/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`
      : `${MEXC_API_BASE}/api/v3/ticker/24hr`
    const mexcRes = await fetch(url)
    const data = await mexcRes.json()
    res.status(mexcRes.status).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch 24hr ticker from MEXC' })
  }
})

// 4. MEXC Klines proxy
app.get('/api/mexc/klines', async (req, res) => {
  try {
    const { symbol, interval, limit } = req.query
    const query = new URLSearchParams()
    if (symbol) query.append('symbol', symbol as string)
    if (interval) query.append('interval', interval as string)
    if (limit) query.append('limit', limit as string)

    const mexcRes = await fetch(`${MEXC_API_BASE}/api/v3/klines?${query.toString()}`)
    const data = await mexcRes.json()
    res.status(mexcRes.status).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch klines from MEXC' })
  }
})

// 5. MEXC Account & Balances (Authenticated)
app.all('/api/mexc/account', async (req, res) => {
  try {
    const apiKey = (req.headers['x-mexc-apikey'] as string) || (req.query.apiKey as string) || (req.body?.apiKey as string) || process.env.MEXC_API_KEY || ''
    const apiSecret = (req.headers['x-mexc-secret'] as string) || (req.query.apiSecret as string) || (req.body?.apiSecret as string) || process.env.MEXC_API_SECRET || ''

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        error: 'API Key and Secret Key are required to fetch real account data.',
        isMock: true,
      })
    }

    const timestamp = Date.now().toString()
    const queryString = `timestamp=${timestamp}`
    const signature = signMexcQuery(apiSecret, queryString)

    const mexcRes = await fetch(`${MEXC_API_BASE}/api/v3/account?${queryString}&signature=${signature}`, {
      headers: {
        'X-MEXC-APIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    })

    const data = await mexcRes.json()
    res.status(mexcRes.status).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to connect to MEXC Account API' })
  }
})

// 6. MEXC Spot Order (Authenticated POST)
app.post('/api/mexc/order', async (req, res) => {
  try {
    const apiKey = (req.headers['x-mexc-apikey'] as string) || (req.body?.apiKey as string) || process.env.MEXC_API_KEY || ''
    const apiSecret = (req.headers['x-mexc-secret'] as string) || (req.body?.apiSecret as string) || process.env.MEXC_API_SECRET || ''

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        error: 'API Key and Secret Key are required to place spot orders on MEXC.',
      })
    }

    const { symbol, side, type, quantity, quoteOrderQty, price } = req.body
    if (!symbol || !side || !type) {
      return res.status(400).json({ error: 'Missing required order fields: symbol, side, type' })
    }

    const timestamp = Date.now().toString()
    const params = new URLSearchParams()
    params.append('symbol', symbol.toUpperCase())
    params.append('side', side.toUpperCase())
    params.append('type', type.toUpperCase())
    if (quantity) params.append('quantity', quantity.toString())
    if (quoteOrderQty) params.append('quoteOrderQty', quoteOrderQty.toString())
    if (price && type === 'LIMIT') params.append('price', price.toString())
    params.append('timestamp', timestamp)

    const queryString = params.toString()
    const signature = signMexcQuery(apiSecret, queryString)

    const mexcRes = await fetch(`${MEXC_API_BASE}/api/v3/order?${queryString}&signature=${signature}`, {
      method: 'POST',
      headers: {
        'X-MEXC-APIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    })

    const data = await mexcRes.json()
    res.status(mexcRes.status).json(data)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to execute order on MEXC' })
  }
})

// 7. Start Server & Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`)
  })
}

startServer()
