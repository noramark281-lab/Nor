import { useState, useEffect, useCallback, useRef } from 'react'
import { Bot, Play, Square, AlertCircle, Activity } from 'lucide-react'
import { mexcApi, db } from '../lib/supabase'
import { executeStrategy } from '../lib/strategies'
import { STRATEGIES, MAX_DAILY_TRADES, MAX_TRADE_AMOUNT } from '../lib/constants'
import type { AppSettings } from '../App'

export default function BotScreen({
  settings,
  onSettingsUpdate,
}: {
  settings: AppSettings
  onSettingsUpdate: (p: Partial<AppSettings>) => void
}) {
  const [running, setRunning] = useState(settings.bot_running || false)
  const [botTrades, setBotTrades] = useState<any[]>([])
  const [error, setError] = useState('')
  const [lastSignal, setLastSignal] = useState('')
  const [dailyCount, setDailyCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(running)
  runningRef.current = running

  const hasApiKey = settings.api_key && settings.api_secret

  const fetchBotTrades = useCallback(async () => {
    try {
      const trades = await db.getBotTrades(20)
      setBotTrades(trades)
      const today = new Date().toDateString()
      setDailyCount(trades.filter((t) => new Date(t.created_at).toDateString() === today).length)
    } catch {}
  }, [])

  useEffect(() => {
    fetchBotTrades()
  }, [fetchBotTrades])

  const runBotCycle = useCallback(async () => {
    if (!runningRef.current || !hasApiKey) return
    if (dailyCount >= MAX_DAILY_TRADES) {
      setError('تم الوصول للحد اليومي للصفقات')
      return
    }

    try {
      const signal = await executeStrategy(settings.bot_strategy, settings.selected_symbol)
      if (signal) {
        setLastSignal(`${signal === 'BUY' ? 'شراء' : 'بيع'} — ${settings.selected_symbol}`)
        const result = await mexcApi.botTrade(
          settings.selected_symbol,
          signal,
          settings.trade_amount,
          settings.bot_strategy,
        )
        if (result.error) {
          setError(result.error)
        } else {
          setError('')
          await fetchBotTrades()
        }
      } else {
        setLastSignal('لا توجد إشارة تداول')
      }
    } catch (e: any) {
      setError(e.message)
    }
  }, [settings, hasApiKey, dailyCount, fetchBotTrades])

  const startBot = async () => {
    setError('')
    setRunning(true)
    onSettingsUpdate({ bot_running: true })
    await db.saveSettings({ bot_running: true })
    runBotCycle()
    intervalRef.current = setInterval(runBotCycle, 60000)
  }

  const stopBot = async () => {
    setRunning(false)
    onSettingsUpdate({ bot_running: false })
    await db.saveSettings({ bot_running: false })
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const setStrategy = (s: string) => {
    onSettingsUpdate({ bot_strategy: s })
    db.saveSettings({ bot_strategy: s })
  }

  return (
    <div className="animate-in">
      <div className="screen-title">البوت الآلي</div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="col gap-8" style={{ alignItems: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: running ? 'rgba(0, 192, 135, 0.1)' : 'rgba(132, 142, 156, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={40} className={running ? 'text-green' : 'text-muted'} />
          </div>
          <div className={`font-bold text-lg ${running ? 'text-green' : 'text-muted'}`}>
            {running ? 'البوت يعمل' : 'البوت متوقف'}
          </div>
          {lastSignal && (
            <span className="text-xs text-secondary">{lastSignal}</span>
          )}
        </div>
        <div className="divider" />
        <div className="row">
          <div className="col gap-4">
            <span className="text-xs text-muted">صفقات اليوم</span>
            <span className="font-bold">{dailyCount} / {MAX_DAILY_TRADES}</span>
          </div>
          <div className="col gap-4">
            <span className="text-xs text-muted">العملة</span>
            <span className="font-bold">{settings.selected_symbol}</span>
          </div>
          <div className="col gap-4">
            <span className="text-xs text-muted">المبلغ</span>
            <span className="font-bold text-accent">${settings.trade_amount}</span>
          </div>
        </div>
        <div className="divider" />
        {running ? (
          <button className="btn btn-red" onClick={stopBot} disabled={!hasApiKey}>
            <Square size={20} />
            إيقاف البوت
          </button>
        ) : (
          <button className="btn btn-green" onClick={startBot} disabled={!hasApiKey}>
            <Play size={20} />
            تشغيل البوت
          </button>
        )}
      </div>

      <div className="card">
        <span className="font-semibold" style={{ display: 'block', marginBottom: 12 }}>
          الاستراتيجية
        </span>
        <div className="col gap-8">
          {Object.entries(STRATEGIES).map(([key, label]) => (
            <button
              key={key}
              className={`symbol-btn ${settings.bot_strategy === key ? 'active' : ''}`}
              style={{ textAlign: 'right', padding: '12px 14px' }}
              onClick={() => setStrategy(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="font-semibold">آخر صفقات البوت</span>
          <Activity size={18} className="text-green" />
        </div>
        {botTrades.length === 0 ? (
          <div className="empty-state text-sm">لا توجد صفقات بعد</div>
        ) : (
          botTrades.map((t) => (
            <div key={t.id} className="trade-row">
              <div className="col gap-4">
                <span className="font-semibold text-sm">{t.symbol}</span>
                <span className="text-xs text-muted">
                  {new Date(t.created_at).toLocaleString('ar')}
                </span>
              </div>
              <div className="col gap-4" style={{ alignItems: 'flex-end' }}>
                <span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                  {t.side === 'BUY' ? 'شراء' : 'بيع'}
                </span>
                <span className="text-xs text-muted">${t.amount} @ ${parseFloat(t.price).toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
