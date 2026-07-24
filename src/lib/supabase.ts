import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/mexc-api`

async function edgeFetch(action: string, params?: Record<string, string>, body?: any) {
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
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    throw new Error(err.error || `HTTP ${response.status}`)
  }
  return response.json()
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
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (error) throw error
    return data
  },
  async saveSettings(settings: Partial<{
    api_key: string
    api_secret: string
    trade_amount: number
    selected_symbol: string
    bot_strategy: string
    bot_running: boolean
  }>) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle()
    if (error) throw error
    return data
  },
  async getTrades(limit = 100) {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },
  async getBotTrades(limit = 100) {
    const { data, error } = await supabase
      .from('bot_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
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
    const { data, error } = await supabase.from('trades').insert(trade).select().maybeSingle()
    if (error) throw error
    return data
  },
  async deleteTrade(id: string) {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) throw error
  },
  async clearTrades() {
    const { error } = await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
  },
  async clearBotTrades() {
    const { error } = await supabase.from('bot_trades').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
  },
}
