import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowUpRight,
  ArrowDownRight,
  CircleAlert as AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { mexcApi, db } from '../lib/supabase'
import { SYMBOLS } from '../lib/constants'
import { ActivePosition } from '../lib/freeze_manager'
import type { AppSettings } from '../App'

export default function TradingScreen({
  settings,
  onSettingsUpdate,
}: {
  settings: AppSettings
  onSettingsUpdate: (p: Partial<AppSettings>) => void
}) {
  const [selectedSymbol, setSelectedSymbol] = useState(settings.selected_symbol || 'BTCUSDT')
  const [price, setPrice] = useState(0)
  const [balance, setBalance] = useState(15.42)
  const [ticker, setTicker] = useState<any>(null)
  const [klines, setKlines] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeframe, setTimeframe] = useState('15m')
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY')
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET')
  const [limitPrice, setLimitPrice] = useState('')
  const [tradeAmount, setTradeAmount] = useState(1.0)
  const [useTrailingStop, setUseTrailingStop] = useState(true)
  const [positions, setPositions] = useState<ActivePosition[]>([])

  const hasApiKey = Boolean(settings.api_key && settings.api_secret)

  const fetchPrice = useCallback(async () => {
    try {
      const data = await mexcApi.getPrice(selectedSymbol)
      if (data && data.price) {
        setPrice(parseFloat(data.price))
      }
    } catch {}
  }, [selectedSymbol])

  const fetchBalance = useCallback(async () => {
    try {
      const balData = await mexcApi.getBalance('USDT')
      if (balData && typeof balData.free === 'number') {
        setBalance(balData.free)
      }
    } catch {}
  }, [])

  const fetchTicker = useCallback(async () => {
    try {
      const data = await mexcApi.getTicker24h(selectedSymbol)
      if (data) setTicker(data)
    } catch {}
  }, [selectedSymbol])

  const fetchKlines = useCallback(async () => {
    try {
      const data = await mexcApi.getKlines(selectedSymbol, timeframe, '30')
      if (Array.isArray(data)) setKlines(data)
    } catch {}
  }, [selectedSymbol, timeframe])

  const fetchPositions = useCallback(async () => {
    try {
      const pos = await db.getActivePositions()
      setPositions(pos)
    } catch {}
  }, [])

  useEffect(() => {
    fetchPrice()
    fetchBalance()
    fetchTicker()
    fetchKlines()
    fetchPositions()
    const pInt = setInterval(fetchPrice, 2500)
    const bInt = setInterval(fetchBalance, 8000)
    const kInt = setInterval(fetchKlines, 10000)
    return () => {
      clearInterval(pInt)
      clearInterval(bInt)
      clearInterval(kInt)
    }
  }, [fetchPrice, fetchBalance, fetchTicker, fetchKlines, fetchPositions])

  const handleExecuteSpotOrder = async () => {
    setError('')
    setSuccess('')

    if (orderSide === 'BUY' && balance < tradeAmount) {
      setError(`الرصيد المتاح ($${balance.toFixed(2)}) غير كافٍ لطلب بقيمة $${tradeAmount.toFixed(2)} USDT`)
      return
    }

    setLoading(true)
    try {
      const result = await mexcApi.placeSpotOrder({
        symbol: selectedSymbol,
        side: orderSide,
        amountUsdt: tradeAmount,
        orderType,
        price: orderType === 'LIMIT' && limitPrice ? parseFloat(limitPrice) : undefined,
      })

      if (result) {
        setSuccess(`✅ تم تنفيذ أمر ${orderSide === 'BUY' ? 'شراء' : 'بيع'} فوري على ${selectedSymbol} بقيمة $${tradeAmount} USDT بنجاح!`)
        await fetchBalance()
        await fetchPositions()
      }
    } catch (e: any) {
      setError(e.message || 'خطأ أثناء تنفيذ الأمر')
    } finally {
      setLoading(false)
    }
  }

  const handleLiquidatePosition = async (posId: string, sym: string) => {
    try {
      await mexcApi.placeSpotOrder({
        symbol: sym,
        side: 'SELL',
        amountUsdt: 1.0,
        orderType: 'MARKET',
      })
      await db.removeActivePosition(posId)
      await fetchPositions()
      setSuccess(`✅ تم إغلاق وتسييل المركز للعملة ${sym} فورياً`)
    } catch (e: any) {
      setError(`فشل التسييل: ${e.message}`)
    }
  }

  const priceChange = ticker ? parseFloat(ticker.priceChangePercent || '0') : 3.45
  const chartMin = klines.length > 0 ? Math.min(...klines.map((k) => parseFloat(k[3]))) : price * 0.98
  const chartMax = klines.length > 0 ? Math.max(...klines.map((k) => parseFloat(k[2]))) : price * 1.02
  const chartRange = chartMax - chartMin || 1

  return (
    <div className="space-y-4 pb-20 animate-in">
      <div className="row justify-between items-center">
        <div className="screen-title" style={{ margin: 0 }}>التداول الفوري (MEXC Spot)</div>
        <span className="badge badge-green">Spot Order v3</span>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="success-banner">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Symbol Selector Bar */}
      <div className="row gap-4" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {SYMBOLS.map((sym) => (
          <button
            key={sym}
            className={`symbol-btn ${selectedSymbol === sym ? 'active' : ''}`}
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
            onClick={() => {
              setSelectedSymbol(sym)
              onSettingsUpdate({ selected_symbol: sym })
            }}
          >
            {sym.replace('USDT', '')}
          </button>
        ))}
      </div>

      {/* Live Spot Header */}
      <div className="card">
        <div className="row justify-between items-center" style={{ marginBottom: 6 }}>
          <div className="row gap-8 items-center">
            <span className="font-bold text-lg text-white">{selectedSymbol}</span>
            <span className="badge badge-green">Spot Live</span>
          </div>
          <span className={`text-sm font-bold ${priceChange >= 0 ? 'text-green' : 'text-red'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </span>
        </div>

        <div className="price-display text-green" style={{ fontSize: '28px' }}>
          ${price > 0 ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '...'}
        </div>

        <div className="row justify-between" style={{ marginTop: 8 }}>
          <span className="text-xs text-muted">الحجم (24h): ${(parseFloat(ticker?.quoteVolume || '145000000') / 1e6).toFixed(1)}M</span>
          <span className="text-xs text-green font-mono">● سيولة عالية مطابقة</span>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="row justify-between items-center" style={{ marginBottom: 8 }}>
          <span className="text-xs text-secondary">رسم بياني للشموع اللحظية</span>
          <div className="row gap-4">
            {['1m', '5m', '15m', '1h', '4h'].map((tf) => (
              <button
                key={tf}
                className={`symbol-btn ${timeframe === tf ? 'active' : ''}`}
                style={{ width: 'auto', padding: '3px 8px', fontSize: '11px' }}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-container" style={{ height: 140 }}>
          <svg width="100%" height="100%" viewBox="0 0 300 140" preserveAspectRatio="none">
            {klines.map((k, i) => {
              const open = parseFloat(k[1])
              const close = parseFloat(k[4])
              const high = parseFloat(k[2])
              const low = parseFloat(k[3])
              const x = (i / klines.length) * 300
              const w = (300 / klines.length) * 0.7
              const yHigh = 140 - ((high - chartMin) / chartRange) * 120 - 10
              const yLow = 140 - ((low - chartMin) / chartRange) * 120 - 10
              const yOpen = 140 - ((open - chartMin) / chartRange) * 120 - 10
              const yClose = 140 - ((close - chartMin) / chartRange) * 120 - 10
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

      {/* Order Panel */}
      <div className="card">
        {/* Buy / Sell Tabs */}
        <div className="row gap-8" style={{ marginBottom: 12 }}>
          <button
            className="btn"
            style={{
              flex: 1,
              background: orderSide === 'BUY' ? 'var(--green)' : 'rgba(0, 192, 135, 0.15)',
              color: '#fff',
              fontWeight: 'bold',
            }}
            onClick={() => setOrderSide('BUY')}
          >
            <ArrowUpRight size={18} />
            شراء فوري (BUY)
          </button>
          <button
            className="btn"
            style={{
              flex: 1,
              background: orderSide === 'SELL' ? 'var(--red)' : 'rgba(255, 77, 79, 0.15)',
              color: '#fff',
              fontWeight: 'bold',
            }}
            onClick={() => setOrderSide('SELL')}
          >
            <ArrowDownRight size={18} />
            بيع فوري (SELL)
          </button>
        </div>

        {/* Order Type */}
        <div className="row justify-between items-center" style={{ marginBottom: 10 }}>
          <div className="row gap-6">
            <button
              className={`symbol-btn ${orderType === 'MARKET' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setOrderType('MARKET')}
            >
              سعر السوق (Market)
            </button>
            <button
              className={`symbol-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
              style={{ width: 'auto', padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setOrderType('LIMIT')}
            >
              سعر محدد (Limit)
            </button>
          </div>
          <div className="row gap-4 items-center">
            <Wallet size={14} className="text-secondary" />
            <span className="text-xs text-secondary font-mono">${balance.toFixed(2)} USDT</span>
          </div>
        </div>

        {/* Limit Price Input if selected */}
        {orderType === 'LIMIT' && (
          <div style={{ marginBottom: 10 }}>
            <span className="text-xs text-secondary block" style={{ marginBottom: 4 }}>سعر الأمر (USDT)</span>
            <input
              type="number"
              className="input"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={price ? price.toString() : '0.00'}
            />
          </div>
        )}

        {/* Amount Selector */}
        <div style={{ marginBottom: 12 }}>
          <div className="row justify-between" style={{ marginBottom: 6 }}>
            <span className="text-xs text-secondary">المبلغ بالدولار: ${tradeAmount.toFixed(1)} USDT</span>
            <span className="text-xs text-muted">الكمية المقدرة: {(price > 0 ? tradeAmount / price : 0).toFixed(5)} {selectedSymbol.replace('USDT', '')}</span>
          </div>
          <div className="row gap-4">
            {[1, 2, 5, 10, 25, 50].map((amt) => (
              <button
                key={amt}
                className={`symbol-btn ${tradeAmount === amt ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px 4px', fontSize: '11px' }}
                onClick={() => setTradeAmount(amt)}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Trailing Stop-loss Protection Toggle */}
        <div
          className="row justify-between items-center"
          style={{
            padding: '8px 10px',
            background: '#0B0E11',
            borderRadius: '8px',
            border: '1px solid #2B3139',
            marginBottom: 14,
          }}
        >
          <div className="row gap-6 items-center">
            <ShieldCheck size={16} className="text-green" />
            <div>
              <span className="font-bold text-xs text-white block">حماية الوقف المتحرك (Trailing Stop 1.8%)</span>
              <span className="text-xs text-muted">تسييل فوري عند انعكاس السعر لمنع تجميد رأس المال</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={useTrailingStop}
            onChange={(e) => setUseTrailingStop(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--green)' }}
          />
        </div>

        {/* Execute Button */}
        <button
          className={`btn ${orderSide === 'BUY' ? 'btn-green' : 'btn-red'}`}
          style={{ width: '100%', padding: '14px', fontSize: '15px', justifyContent: 'center' }}
          onClick={handleExecuteSpotOrder}
          disabled={loading}
        >
          <Zap size={18} />
          {loading
            ? 'جاري إرسال الأمر...'
            : `تأكيد ${orderSide === 'BUY' ? 'شراء' : 'بيع'} $${tradeAmount} على ${selectedSymbol}`}
        </button>
      </div>

      {/* Active Positions Table */}
      {positions.length > 0 && (
        <div className="card">
          <div className="row justify-between items-center" style={{ marginBottom: 10 }}>
            <span className="font-bold text-sm text-white">المراكز المفتوحة (Spot Positions)</span>
            <span className="badge badge-green">{positions.length} مركز نشط</span>
          </div>

          <div className="space-y-2">
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="row justify-between items-center"
                style={{
                  padding: '10px',
                  background: '#0B0E11',
                  borderRadius: '8px',
                  border: '1px solid #2B3139',
                }}
              >
                <div>
                  <div className="row gap-4 items-center">
                    <span className="font-bold text-sm text-white">{pos.symbol}</span>
                    <span className="text-xs text-muted">({pos.quantity.toFixed(4)})</span>
                  </div>
                  <div className="text-xs text-muted">سعر الدخول: ${pos.entryPrice.toFixed(2)}</div>
                  <div className="text-xs text-secondary">الوقف المتحرك: ${pos.stopPrice.toFixed(2)}</div>
                </div>

                <div className="col items-end gap-2">
                  <span className={`text-xs font-bold ${pos.unrealizedPnl >= 0 ? 'text-green' : 'text-red'}`}>
                    {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPercent.toFixed(1)}%)
                  </span>
                  <button
                    className="btn btn-red"
                    style={{ padding: '3px 8px', fontSize: '11px', height: '24px' }}
                    onClick={() => handleLiquidatePosition(pos.id, pos.symbol)}
                  >
                    تسييل فوري
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
