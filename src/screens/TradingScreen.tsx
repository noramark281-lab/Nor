import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowUp, ArrowDown, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { mexcApi, db } from '../lib/supabase'
import { SYMBOLS, TIMEFRAMES, MAX_TRADE_AMOUNT, MIN_TRADE_AMOUNT } from '../lib/constants'
import type { AppSettings } from '../App'

export default function TradingScreen({
  settings,
  onSettingsUpdate,
}: {
  settings: AppSettings
  onSettingsUpdate: (p: Partial<AppSettings>) => void
}) {
  const [price, setPrice] = useState(0)
  const [ticker, setTicker] = useState<any>(null)
  const [klines, setKlines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeframe, setTimeframe] = useState('1m')
  const symbol = settings.selected_symbol
  const amount = settings.trade_amount
  const hasApiKey = settings.api_key && settings.api_secret

  const fetchPrice = useCallback(async () => {
    try {
      const data = await mexcApi.getPrice(symbol)
      if (!data.error && data.price) {
        setPrice(parseFloat(data.price))
      }
    } catch {}
  }, [symbol])

  const fetchTicker = useCallback(async () => {
    try {
      const data = await mexcApi.getTicker24h(symbol)
      if (!data.error) {
        setTicker(data)
      }
    } catch {}
  }, [symbol])

  const fetchKlines = useCallback(async () => {
    try {
      const data = await mexcApi.getKlines(symbol, timeframe, '30')
      if (Array.isArray(data)) {
        setKlines(data)
      }
    } catch {}
  }, [symbol, timeframe])

  useEffect(() => {
    fetchPrice()
    fetchTicker()
    fetchKlines()
    const interval = setInterval(fetchPrice, 3000)
    const tickerInterval = setInterval(fetchTicker, 10000)
    return () => {
      clearInterval(interval)
      clearInterval(tickerInterval)
    }
  }, [fetchPrice, fetchTicker, fetchKlines])

  const selectSymbol = (s: string) => {
    onSettingsUpdate({ selected_symbol: s })
    db.saveSettings({ selected_symbol: s })
  }

  const selectTimeframe = (tf: string) => {
    setTimeframe(tf)
  }

  const placeOrder = async (side: 'BUY' | 'SELL') => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const result = await mexcApi.placeOrder(symbol, side, amount)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`تم تنفيذ أمر ${side === 'BUY' ? 'شراء' : 'بيع'} ${symbol} بنجاح!`)
        fetchPrice()
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const priceChange = ticker
    ? parseFloat(ticker.priceChangePercent || '0')
    : 0

  const chartMin = klines.length > 0
    ? Math.min(...klines.map((k) => parseFloat(k[3])))
    : 0
  const chartMax = klines.length > 0
    ? Math.max(...klines.map((k) => parseFloat(k[2])))
    : 0
  const chartRange = chartMax - chartMin || 1

  return (
    <div className="animate-in">
      <div className="screen-title">التداول المباشر</div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="success-banner">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {!hasApiKey && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <span className="text-sm text-secondary">
            يجب إضافة مفاتيح API من الإعدادات أولاً للتداول الحقيقي.
          </span>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="font-semibold">اختر العملة</span>
          <RefreshCw size={16} className="text-secondary" style={{ cursor: 'pointer' }} onClick={fetchPrice} />
        </div>
        <div className="symbol-grid">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              className={`symbol-btn ${symbol === s ? 'active' : ''}`}
              onClick={() => selectSymbol(s)}
            >
              {s.replace('USDT', '')}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="text-sm text-secondary">{symbol}</span>
          <span className={`text-sm font-bold ${priceChange >= 0 ? 'text-green' : 'text-red'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="price-display" style={{ color: priceChange >= 0 ? 'var(--green)' : 'var(--red)' }}>
          ${price > 0 ? price.toFixed(price < 1 ? 4 : 2) : '...'}
        </div>
        {ticker && (
          <div className="row" style={{ marginTop: 8 }}>
            <span className="text-xs text-muted">أعلى 24h: ${parseFloat(ticker.highPrice || '0').toFixed(2)}</span>
            <span className="text-xs text-muted">أدنى 24h: ${parseFloat(ticker.lowPrice || '0').toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="text-sm text-secondary">الإطار الزمني</span>
        </div>
        <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              className={`symbol-btn ${timeframe === tf ? 'active' : ''}`}
              style={{ width: 'auto', padding: '6px 14px' }}
              onClick={() => selectTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {klines.length > 0 && (
        <div className="card">
          <span className="text-sm text-secondary" style={{ display: 'block', marginBottom: 8 }}>
            الرسم البياني
          </span>
          <div className="chart-container">
            <svg width="100%" height="100%" viewBox={`0 0 300 200`} preserveAspectRatio="none">
              {klines.map((k, i) => {
                const open = parseFloat(k[1])
                const close = parseFloat(k[4])
                const high = parseFloat(k[2])
                const low = parseFloat(k[3])
                const x = (i / klines.length) * 300
                const w = (300 / klines.length) * 0.7
                const yHigh = 200 - ((high - chartMin) / chartRange) * 180 - 10
                const yLow = 200 - ((low - chartMin) / chartRange) * 180 - 10
                const yOpen = 200 - ((open - chartMin) / chartRange) * 180 - 10
                const yClose = 200 - ((close - chartMin) / chartRange) * 180 - 10
                const isGreen = close >= open
                const color = isGreen ? '#00C087' : '#FF4D4F'
                return (
                  <g key={i}>
                    <line x1={x + w / 2} y1={yHigh} x2={x + w / 2} y2={yLow} stroke={color} strokeWidth="1" />
                    <rect
                      x={x}
                      y={Math.min(yOpen, yClose)}
                      width={w}
                      height={Math.abs(yClose - yOpen) || 1}
                      fill={color}
                      opacity="0.9"
                    />
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: 16 }}>
          <span className="text-sm text-secondary">مبلغ الصفقة</span>
          <span className="font-bold text-accent">${amount.toFixed(2)}</span>
        </div>
        <div className="row gap-12">
          <button
            className="btn btn-green"
            style={{ flex: 1 }}
            onClick={() => placeOrder('BUY')}
            disabled={loading || !hasApiKey}
          >
            <ArrowUp size={20} />
            شراء
          </button>
          <button
            className="btn btn-red"
            style={{ flex: 1 }}
            onClick={() => placeOrder('SELL')}
            disabled={loading || !hasApiKey}
          >
            <ArrowDown size={20} />
            بيع
          </button>
        </div>
        <div className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
          الحد الأقصى للصفقة ${MAX_TRADE_AMOUNT} — تداول حقيقي على MEXC
        </div>
      </div>
    </div>
  )
}
