import { useState, useEffect, useCallback } from 'react'
import { Wallet, TrendingUp, Bot, ArrowLeftRight, CircleAlert as AlertCircle, Zap } from 'lucide-react'
import { mexcApi, db } from '../lib/supabase'
import { SYMBOLS, COLORS, MAX_TRADE_AMOUNT } from '../lib/constants'
import type { AppSettings, Screen } from '../App'

export default function HomeScreen({
  settings,
  onNavigate,
  onSettingsUpdate,
}: {
  settings: AppSettings
  onNavigate: (s: Screen) => void
  onSettingsUpdate: (p: Partial<AppSettings>) => void
}) {
  const [balance, setBalance] = useState<number | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [tradeCount, setTradeCount] = useState(0)

  const fetchBalance = useCallback(async () => {
    if (!settings.api_key) return
    try {
      const data = await mexcApi.getBalance('USDT')
      if (data.error) {
        setError(data.error)
      } else {
        setBalance(data.free)
        setError('')
      }
    } catch (e: any) {
      setError(e.message)
    }
  }, [settings.api_key])

  const fetchPrices = useCallback(async () => {
    for (const symbol of SYMBOLS.slice(0, 6)) {
      try {
        const data = await mexcApi.getPrice(symbol)
        if (!data.error && data.price) {
          setPrices((prev) => ({ ...prev, [symbol]: parseFloat(data.price) }))
        }
      } catch {}
    }
  }, [])

  const fetchTradeCount = useCallback(async () => {
    try {
      const trades = await db.getTrades(500)
      setTradeCount(trades.length)
    } catch {}
  }, [])

  useEffect(() => {
    fetchPrices()
    fetchBalance()
    fetchTradeCount()
    const priceInterval = setInterval(fetchPrices, 5000)
    const balanceInterval = setInterval(fetchBalance, 15000)
    return () => {
      clearInterval(priceInterval)
      clearInterval(balanceInterval)
    }
  }, [fetchPrices, fetchBalance, fetchTradeCount])

  const hasApiKey = settings.api_key && settings.api_secret

  return (
    <div className="animate-in">
      <div className="row" style={{ marginBottom: 20 }}>
        <div className="logo">Nor</div>
        <div className="row gap-8">
          <div className="pulse-dot" />
          <span className="text-xs text-secondary">مباشر</span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!hasApiKey && (
        <div className="card" style={{ borderColor: 'var(--accent)', background: 'rgba(240, 185, 11, 0.05)' }}>
          <div className="col gap-4">
            <div className="row">
              <Zap size={20} className="text-accent" />
              <span className="font-bold text-accent">إعداد مطلوب</span>
            </div>
            <span className="text-sm text-secondary">
              لم يتم إعداد مفاتيح API بعد. اذهب إلى الإعدادات لإضافة مفاتيح MEXC والبدء بالتداول الحقيقي.
            </span>
            <button className="btn btn-accent" onClick={() => onNavigate('settings')}>
              الذهاب إلى الإعدادات
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="row gap-8">
            <Wallet size={18} className="text-secondary" />
            <span className="text-secondary text-sm">رصيد USDT</span>
          </div>
          {hasApiKey && (
            <span className="badge badge-green">متصل</span>
          )}
        </div>
        <div className="price-display text-green">
          {balance !== null ? `$${balance.toFixed(2)}` : hasApiKey ? '...' : '--'}
        </div>
        <div className="divider" />
        <div className="row">
          <div className="col gap-4">
            <span className="text-xs text-muted">عدد الصفقات</span>
            <span className="font-bold">{tradeCount}</span>
          </div>
          <div className="col gap-4">
            <span className="text-xs text-muted">حد الصفقة</span>
            <span className="font-bold text-accent">${MAX_TRADE_AMOUNT}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="font-semibold">أسعار العملات</span>
          <TrendingUp size={18} className="text-green" />
        </div>
        {Object.keys(prices).length === 0 ? (
          <div className="text-center text-muted text-sm" style={{ padding: 16 }}>جاري التحميل...</div>
        ) : (
          SYMBOLS.slice(0, 6).map((symbol) => {
            const price = prices[symbol]
            return (
              <div key={symbol} className="trade-row">
                <span className="font-semibold text-sm">{symbol.replace('USDT', '')}</span>
                {price ? (
                  <span className="font-bold text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ${price.toFixed(price < 1 ? 4 : 2)}
                  </span>
                ) : (
                  <span className="text-muted text-sm">--</span>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="col gap-12">
        <button
          className="btn btn-green"
          onClick={() => onNavigate('trading')}
          disabled={!hasApiKey}
        >
          <ArrowLeftRight size={20} />
          تداول الآن
        </button>
        <button
          className="btn btn-outline"
          onClick={() => onNavigate('bot')}
          disabled={!hasApiKey}
        >
          <Bot size={20} />
          تشغيل البوت الآلي
        </button>
      </div>
    </div>
  )
}
