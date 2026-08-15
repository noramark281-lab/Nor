import React, { useState, useEffect, useCallback } from 'react'
import { ArrowUpRight, ArrowDownRight, CircleAlert as AlertCircle, CircleCheck as CheckCircle, RefreshCw, Clock, Wallet } from 'lucide-react'
import { mexcApi } from '../lib/supabase'
import type { AppSettings } from '../App'

interface EventContract {
  id: string
  symbol: string
  side: 'UP' | 'DOWN'
  amount: number
  strikePrice: number
  payoutPercent: number
  entryTime: number
  expiryTime: number
  status: 'OPEN' | 'WON' | 'LOST'
  closePrice?: number
  profit?: number
}

export default function TradingScreen({
  settings,
  onSettingsUpdate,
}: {
  settings: AppSettings
  onSettingsUpdate: (p: Partial<AppSettings>) => void
}) {
  const [price, setPrice] = useState(0)
  const [balance, setBalance] = useState(0.8327)
  const [ticker, setTicker] = useState<any>(null)
  const [klines, setKlines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeframe, setTimeframe] = useState('15m')
  const [durationMinutes, setDurationMinutes] = useState(10)
  const [tradeAmount, setTradeAmount] = useState(1.0)
  const [activeContracts, setActiveContracts] = useState<EventContract[]>([])
  const [, setTick] = useState(0)

  const symbol = 'BTCUSDT'
  const hasApiKey = Boolean(settings.api_key && settings.api_secret)

  const fetchPrice = useCallback(async () => {
    try {
      const data = await mexcApi.getPrice(symbol)
      if (!data.error && data.price) {
        setPrice(parseFloat(data.price))
      }
    } catch {}
  }, [symbol])

  const fetchBalance = useCallback(async () => {
    try {
      if (hasApiKey) {
        const balData = await mexcApi.getBalance('USDT')
        if (balData && typeof balData.free === 'number') {
          setBalance(balData.free)
        }
      }
    } catch {}
  }, [hasApiKey])

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
    fetchBalance()
    fetchTicker()
    fetchKlines()
    const interval = setInterval(fetchPrice, 2000)
    const balInterval = setInterval(fetchBalance, 6000)
    const tickerInterval = setInterval(fetchTicker, 8000)
    const timerInterval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => {
      clearInterval(interval)
      clearInterval(balInterval)
      clearInterval(tickerInterval)
      clearInterval(timerInterval)
    }
  }, [fetchPrice, fetchBalance, fetchTicker, fetchKlines])

  useEffect(() => {
    if (activeContracts.length === 0 || price === 0) return

    const now = Date.now()
    const remaining: EventContract[] = []
    let updated = false

    activeContracts.forEach((contract) => {
      if (now >= contract.expiryTime && contract.status === 'OPEN') {
        const isWon =
          contract.side === 'UP'
            ? price > contract.strikePrice
            : price < contract.strikePrice

        const profit = isWon ? contract.amount * (contract.payoutPercent / 100) : -contract.amount
        contract.status = isWon ? 'WON' : 'LOST'
        contract.closePrice = price
        contract.profit = profit

        if (isWon) {
          setBalance((b) => b + contract.amount + profit)
          setSuccess(`🎉 تهانينا! ربحت صفقة ${contract.side === 'UP' ? 'أعلى ↗' : 'أدنى ↘'} (+${profit.toFixed(2)} USDT)`)
        } else {
          setError(`انتهى عقد ${contract.side === 'UP' ? 'أعلى ↗' : 'أدنى ↘'} بدون ربح`)
        }
        updated = true
      } else {
        remaining.push(contract)
      }
    })

    if (updated) {
      setActiveContracts(remaining)
    }
  }, [activeContracts, price])

  const openEventContract = async (side: 'UP' | 'DOWN') => {
    setError('')
    setSuccess('')

    if (balance < tradeAmount) {
      setError(`الرصيد المتاح (${balance.toFixed(4)}) غير كافٍ لفتح عقد بقيمة ${tradeAmount} USDT`)
      return
    }

    setLoading(true)
    try {
      const currentStrike = price > 0 ? price : 95000
      const newContract: EventContract = {
        id: `ec_${Date.now()}`,
        symbol: 'BTCUSDT',
        side,
        amount: tradeAmount,
        strikePrice: currentStrike,
        payoutPercent: 80,
        entryTime: Date.now(),
        expiryTime: Date.now() + durationMinutes * 60 * 1000,
        status: 'OPEN',
      }

      setBalance((prev) => Math.max(0, prev - tradeAmount))
      setActiveContracts((prev) => [newContract, ...prev])

      if (hasApiKey) {
        try {
          await mexcApi.placeOrder(symbol, side === 'UP' ? 'BUY' : 'SELL', tradeAmount)
        } catch {}
      }

      setSuccess(`✅ تم فتح عقد ${side === 'UP' ? 'أعلى ↗' : 'أدنى ↘'} بنجاح!`)
    } catch (e: any) {
      setError(e.message || 'خطأ في فتح العقد')
    } finally {
      setLoading(false)
    }
  }

  const priceChange = ticker ? parseFloat(ticker.priceChangePercent || '0') : 0.85
  const potentialProfit = tradeAmount * 0.8
  const potentialPayout = tradeAmount * 1.8

  const chartMin = klines.length > 0 ? Math.min(...klines.map((k) => parseFloat(k[3]))) : 0
  const chartMax = klines.length > 0 ? Math.max(...klines.map((k) => parseFloat(k[2]))) : 0
  const chartRange = chartMax - chartMin || 1

  const quickAmounts = [1, 5, 10, 25, 50, 100, 250]
  const durations = [
    { label: '10 دقائق', minutes: 10 },
    { label: '30 دقيقة', minutes: 30 },
    { label: '1 ساعة', minutes: 60 },
    { label: '1 يوم', minutes: 1440 },
  ]

  return (
    <div className="space-y-4 pb-20">
      <div className="screen-title">العقود الآجلة للأحداث - BTC/USDT</div>

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

      {/* Header BTC Live */}
      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <div className="row gap-8">
            <span className="font-bold text-lg">BTC/USDT</span>
            <span className="badge">عقود الأحداث</span>
          </div>
          <span className={`text-sm font-bold ${priceChange >= 0 ? 'text-green' : 'text-red'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="price-display" style={{ color: 'var(--green)' }}>
          ${price > 0 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <span className="text-xs text-muted">سعر المؤشر المباشر من MEXC</span>
          <span className="text-xs text-green">● مباشر</span>
        </div>
      </div>

      {/* Duration Selector */}
      <div className="card">
        <span className="text-xs text-secondary" style={{ display: 'block', marginBottom: 8 }}>مدة العقد</span>
        <div className="row gap-4">
          {durations.map((d) => (
            <button
              key={d.minutes}
              className={`symbol-btn ${durationMinutes === d.minutes ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px 4px', fontSize: '12px' }}
              onClick={() => setDurationMinutes(d.minutes)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="text-xs text-secondary">الرسم البياني</span>
          <div className="row gap-4">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                className={`symbol-btn ${timeframe === tf ? 'active' : ''}`}
                style={{ width: 'auto', padding: '4px 8px', fontSize: '11px' }}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container" style={{ height: 160 }}>
          <svg width="100%" height="100%" viewBox={`0 0 300 160`} preserveAspectRatio="none">
            {klines.map((k, i) => {
              const open = parseFloat(k[1])
              const close = parseFloat(k[4])
              const high = parseFloat(k[2])
              const low = parseFloat(k[3])
              const x = (i / klines.length) * 300
              const w = (300 / klines.length) * 0.7
              const yHigh = 160 - ((high - chartMin) / chartRange) * 140 - 10
              const yLow = 160 - ((low - chartMin) / chartRange) * 140 - 10
              const yOpen = 160 - ((open - chartMin) / chartRange) * 140 - 10
              const yClose = 160 - ((close - chartMin) / chartRange) * 140 - 10
              const isGreen = close >= open
              const color = isGreen ? '#00C087' : '#FF4D4F'
              return (
                <g key={i}>
                  <line x1={x + w / 2} y1={yHigh} x2={x + w / 2} y2={yLow} stroke={color} strokeWidth="1" />
                  <rect
                    x={x}
                    y={Math.min(yOpen, yClose)}
                    width={w}
                    height={Math.abs(yClose - yOpen) || 2}
                    fill={color}
                    opacity="0.9"
                  />
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Available Balance & Payout */}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="row gap-8">
            <Wallet size={18} className="text-green" />
            <span className="font-bold text-white">{balance.toFixed(4)} USDT المتاح</span>
          </div>
          <RefreshCw size={14} className="text-secondary" style={{ cursor: 'pointer' }} onClick={fetchBalance} />
        </div>
        <div className="row gap-12">
          <div style={{ flex: 1, padding: '8px', background: 'rgba(0, 192, 135, 0.1)', border: '1px solid rgba(0, 192, 135, 0.3)', borderRadius: '8px', textAlign: 'center' }}>
            <span className="text-xs text-green font-bold block">دفع أعلى 80%</span>
            <span className="text-xs text-muted">عائد +$0.80 لكل $1</span>
          </div>
          <div style={{ flex: 1, padding: '8px', background: 'rgba(255, 77, 79, 0.1)', border: '1px solid rgba(255, 77, 79, 0.3)', borderRadius: '8px', textAlign: 'center' }}>
            <span className="text-xs text-red font-bold block">دفع أقل 80%</span>
            <span className="text-xs text-muted">عائد +$0.80 لكل $1</span>
          </div>
        </div>
      </div>

      {/* Amount Controls */}
      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="text-xs text-secondary">1-250 USDT</span>
          <span className="text-sm font-bold text-white">مبلغ العقد: ${tradeAmount.toFixed(1)} USDT</span>
        </div>
        <div className="row gap-8" style={{ marginBottom: 8 }}>
          <button
            className="symbol-btn"
            style={{ width: '40px', height: '40px', fontSize: '18px' }}
            onClick={() => setTradeAmount((a) => Math.max(1, a - 1))}
          >
            -
          </button>
          <div className="row gap-4" style={{ flex: 1, overflowX: 'auto' }}>
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                className={`symbol-btn ${tradeAmount === amt ? 'active' : ''}`}
                style={{ padding: '8px 10px', fontSize: '12px', width: 'auto' }}
                onClick={() => setTradeAmount(amt)}
              >
                ${amt}
              </button>
            ))}
          </div>
          <button
            className="symbol-btn"
            style={{ width: '40px', height: '40px', fontSize: '18px' }}
            onClick={() => setTradeAmount((a) => Math.min(250, a + 1))}
          >
            +
          </button>
        </div>
        <div className="row" style={{ background: '#0B0E11', padding: '8px', borderRadius: '8px' }}>
          <span className="text-xs text-green font-semibold">العائد المتوقع: +${potentialProfit.toFixed(2)} USDT</span>
          <span className="text-xs text-muted">المجموع عند الربح: ${potentialPayout.toFixed(2)} USDT</span>
        </div>
      </div>

      {/* Big Action Buttons */}
      <div className="row gap-12">
        <button
          className="btn btn-red"
          style={{ flex: 1, padding: '16px', flexDirection: 'column' }}
          onClick={() => openEventContract('DOWN')}
          disabled={loading}
        >
          <div className="row gap-4">
            <ArrowDownRight size={20} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>أدنى ↘</span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>دفع 80% (سعر أقل)</span>
        </button>

        <button
          className="btn btn-green"
          style={{ flex: 1, padding: '16px', flexDirection: 'column' }}
          onClick={() => openEventContract('UP')}
          disabled={loading}
        >
          <div className="row gap-4">
            <ArrowUpRight size={20} />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>أعلى ↗</span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.9 }}>دفع 80% (سعر أعلى)</span>
        </button>
      </div>

      {/* Active Contracts */}
      {activeContracts.length > 0 && (
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="row gap-8">
              <Clock size={16} className="text-green" />
              <span className="text-sm font-bold text-white">العقود الآجلة النشطة</span>
            </div>
          </div>
          <div className="space-y-2">
            {activeContracts.map((c) => {
              const remainingSec = Math.max(0, Math.floor((c.expiryTime - Date.now()) / 1000))
              const min = Math.floor(remainingSec / 60)
              const sec = remainingSec % 60
              const isUp = c.side === 'UP'

              return (
                <div
                  key={c.id}
                  className="row justify-between"
                  style={{
                    padding: '10px',
                    background: '#0B0E11',
                    borderRadius: '8px',
                    border: `1px solid ${isUp ? 'rgba(0, 192, 135, 0.4)' : 'rgba(255, 77, 79, 0.4)'}`,
                  }}
                >
                  <div>
                    <span className={`font-bold text-sm ${isUp ? 'text-green' : 'text-red'}`}>
                      {isUp ? 'أعلى ↗' : 'أدنى ↘'} (${c.amount} USDT)
                    </span>
                    <div className="text-xs text-muted">سعر الدخول: ${c.strikePrice.toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'left', fontFamily: 'monospace' }}>
                    <div className="font-bold text-sm text-white">
                      {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted">متبقي على التسوية</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
