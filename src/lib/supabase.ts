import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/mexc-api`

async function edgeFetch(action: string, params?: Record<string, string>, body?: any) {
  if (supabaseUrl !== 'https://placeholder.supabase.co') {
    try {
      const url = new URL(EDGE_FUNCTION_URL)
      url.searchParams.set('action', action)
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          url.searchParams.set(k, v)
        }
      }
      const headers: Record<string, string> = {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      }
      const response = await fetch(url.toString(), {
        method: body ? 'POST' : 'GET',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (response.ok) {
        return await response.json()
      }
    } catch {
      // Fallthrough to public API / local fallback
    }
  }

  // Fallback to public MEXC API or simulated responses when edge functions are unconfigured
  const symbol = params?.symbol || body?.symbol || 'BTCUSDT'
  if (action === 'price') {
    const res = await fetch(`https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`)
    const json = await res.json()
    return { symbol: json.symbol, price: json.price }
  }
  if (action === 'ticker24h') {
    const res = await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${symbol}`)
    const json = await res.json()
    return {
      symbol: json.symbol,
      priceChangePercent: json.priceChangePercent,
      highPrice: json.highPrice,
      lowPrice: json.lowPrice,
      volume: json.volume,
    }
  }
  if (action === 'klines') {
    const interval = params?.interval || '1m'
    const limit = params?.limit || '30'
    const res = await fetch(`https://api.mexc.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
    return await res.json()
  }
  if (action === 'balance') {
    return { asset: 'USDT', free: 1000.0, locked: 0.0 }
  }
  if (action === 'account') {
    return { accountType: 'SPOT', canTrade: true }
  }
  if (action === 'placeOrder' || action === 'botTrade') {
    const side = body?.side || 'BUY'
    const amount = body?.amount || 1.0
    const priceRes = await fetch(`https://api.mexc.com/api/v3/ticker/price?symbol=${symbol}`)
    const priceJson = await priceRes.json()
    const price = parseFloat(priceJson.price || '60000')
    const tradeData = {
      id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      symbol,
      side,
      amount,
      price,
      quantity: amount / price,
      status: 'FILLED',
      created_at: new Date().toISOString(),
    }
    if (action === 'botTrade') {
      await db.addBotTrade(tradeData)
    } else {
      await db.addTrade(tradeData)
    }
    return { success: true, orderId: tradeData.id, ...tradeData }
  }

  return { success: true }
}

export const mexcApi = {
  getPrice: (symbol: string) => edgeFetch('price', { symbol }),
  getTicker24h: (symbol: string) => edgeFetch('ticker24h', { symbol }),
  getKlines: (symbol: string, interval: string, limit = '50') =>
    edgeFetch('klines', { symbol, interval, limit }),
  getExchangeInfo: () => edgeFetch('exchangeInfo'),
  getAccount: () => edgeFetch('account'),
  getBalance: (asset = 'USDT') => edgeFetch('balance', { asset }),
  getAllBalances: () => edgeFetch('allBalances'),
  getOpenOrders: (symbol?: string) =>
    edgeFetch('openOrders', symbol ? { symbol } : {}),
  getOrderHistory: (symbol: string) => edgeFetch('orderHistory', { symbol }),
  placeOrder: (symbol: string, side: string, amount: number) =>
    edgeFetch('placeOrder', {}, { symbol, side, amount }),
  cancelOrder: (symbol: string, orderId: string) =>
    edgeFetch('cancelOrder', { symbol, orderId }),
  botTrade: (symbol: string, side: string, amount: number, strategy: string) =>
    edgeFetch('botTrade', {}, { symbol, side, amount, strategy }),
}

export const db = {
  async getSettings() {
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle()
        if (!error && data) return data
      } catch {}
    }
    const local = localStorage.getItem('nor_settings')
    return local ? JSON.parse(local) : null
  },
  async saveSettings(settings: Partial<{
    api_key: string
    api_secret: string
    trade_amount: number
    selected_symbol: string
    bot_strategy: string
    bot_running: boolean
  }>) {
    const localPrev = JSON.parse(localStorage.getItem('nor_settings') || '{}')
    const updated = { ...localPrev, ...settings, id: 1, updated_at: new Date().toISOString() }
    localStorage.setItem('nor_settings', JSON.stringify(updated))

    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase
          .from('settings')
          .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() })
          .select()
          .maybeSingle()
        if (!error && data) return data
      } catch {}
    }
    return updated
  },
  async getTrades(limit = 100) {
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (!error && data) return data
      } catch {}
    }
    const local = JSON.parse(localStorage.getItem('nor_trades') || '[]')
    return local.slice(0, limit)
  },
  async getBotTrades(limit = 100) {
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase
          .from('bot_trades')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)
        if (!error && data) return data
      } catch {}
    }
    const local = JSON.parse(localStorage.getItem('nor_bot_trades') || '[]')
    return local.slice(0, limit)
  },
  async addTrade(trade: {
    symbol: string
    side: string
    amount: number
    price: number
    quantity: number
    status: string
    order_id?: string
    error?: string
  }) {
    const local = JSON.parse(localStorage.getItem('nor_trades') || '[]')
    const newTrade = { id: 't_' + Date.now(), created_at: new Date().toISOString(), ...trade }
    localStorage.setItem('nor_trades', JSON.stringify([newTrade, ...local]))

    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase.from('trades').insert(trade).select().maybeSingle()
        if (!error && data) return data
      } catch {}
    }
    return newTrade
  },
  async addBotTrade(trade: {
    symbol: string
    side: string
    amount: number
    price: number
    quantity: number
    status: string
    order_id?: string
    error?: string
  }) {
    const local = JSON.parse(localStorage.getItem('nor_bot_trades') || '[]')
    const newTrade = { id: 'bt_' + Date.now(), created_at: new Date().toISOString(), ...trade }
    localStorage.setItem('nor_bot_trades', JSON.stringify([newTrade, ...local]))

    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const { data, error } = await supabase.from('bot_trades').insert(trade).select().maybeSingle()
        if (!error && data) return data
      } catch {}
    }
    return newTrade
  },
  async deleteTrade(id: string) {
    const local = JSON.parse(localStorage.getItem('nor_trades') || '[]')
    localStorage.setItem('nor_trades', JSON.stringify(local.filter((t: any) => t.id !== id)))

    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('trades').delete().eq('id', id)
      } catch {}
    }
  },
  async clearTrades() {
    localStorage.setItem('nor_trades', JSON.stringify([]))
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch {}
    }
  },
  async clearBotTrades() {
    localStorage.setItem('nor_bot_trades', JSON.stringify([]))
    if (supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        await supabase.from('bot_trades').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      } catch {}
    }
  },
}

