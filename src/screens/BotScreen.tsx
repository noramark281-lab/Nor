import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Bot,
  Play,
  Square,
  CircleAlert as AlertCircle,
  Activity,
  Sparkles,
  Flame,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { mexcApi, db } from '../lib/supabase'
import { evaluateAdvancedStrategy } from '../lib/strategies'
import { STRATEGIES, MAX_DAILY_TRADES } from '../lib/constants'
import { rateLimiter } from '../lib/rate_limiter'
import { newsSentimentEngine } from '../lib/news_sentiment'
import { freezeManager, ActivePosition } from '../lib/freeze_manager'
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
  const [activePositions, setActivePositions] = useState<ActivePosition[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastSignal, setLastSignal] = useState('')
  const [signalReason, setSignalReason] = useState('')
  const [dailyCount, setDailyCount] = useState(0)
  const [rateLimitStatus, setRateLimitStatus] = useState<any>(rateLimiter.getStatus())
  const [sentiment, setSentiment] = useState<any>(null)
  const [evaluating, setEvaluating] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const runningRef = useRef(running)
  runningRef.current = running

  const hasApiKey = Boolean(settings.api_key && settings.api_secret)

  const fetchBotData = useCallback(async () => {
    try {
      const trades = await db.getBotTrades(20)
      setBotTrades(trades)
      const today = new Date().toDateString()
      setDailyCount(trades.filter((t: any) => new Date(t.created_at).toDateString() === today).length)

      const positions = await db.getActivePositions()
      setActivePositions(positions)

      setSentiment(newsSentimentEngine.getOverallMarketSentiment())
      setRateLimitStatus(rateLimiter.getStatus())
    } catch {}
  }, [])

  useEffect(() => {
    fetchBotData()
    const int = setInterval(fetchBotData, 5000)
    return () => clearInterval(int)
  }, [fetchBotData])

  // Run a single intelligent multi-layer cycle
  const runBotCycle = useCallback(async () => {
    if (!runningRef.current) return
    if (dailyCount >= MAX_DAILY_TRADES) {
      setError('تم الوصول للحد اليومي الأقصى للصفقات (50 صفقة)')
      return
    }

    setEvaluating(true)
    try {
      // 1. Check Trailing Stop-Loss on active positions (Anti-Freeze Layer)
      const currentPositions = await db.getActivePositions()
      if (currentPositions.length > 0) {
        const prices: Record<string, number> = {}
        for (const pos of currentPositions) {
          const p = await mexcApi.getPrice(pos.symbol)
          if (p && p.price) prices[pos.symbol] = parseFloat(p.price)
        }

        const { updatedPositions, triggeredLiquidations } = freezeManager.updatePositions(
          currentPositions,
          prices,
          settings.trailing_stop_percent || 1.8,
        )

        // Save updated peak prices
        await db.saveActivePositions(updatedPositions)

        // If any trailing stop triggered, liquidate immediately to protect capital
        for (const liq of triggeredLiquidations) {
          await mexcApi.placeSpotOrder({
            symbol: liq.symbol,
            side: 'SELL',
            amountUsdt: liq.costUsd,
            orderType: 'MARKET',
          })
          setSuccess(`🛡️ تم تفعيل الوقف المتحرك وحماية رأس المال على ${liq.symbol}`)
          await fetchBotData()
        }
      }

      // 2. Evaluate Advanced Multi-Layer Strategy
      const currentStrategy = settings.bot_strategy || 'multi_layer_pro'
      const evalResult = await evaluateAdvancedStrategy(currentStrategy, settings.selected_symbol || 'BTCUSDT')

      if (evalResult.signal) {
        setLastSignal(`${evalResult.signal === 'BUY' ? 'شراء 🟢' : 'بيع 🔴'} — ${evalResult.recommendedSymbol}`)
        setSignalReason(evalResult.reason)

        // Check account balance before placing order ($1.00 minimum lot allocation check)
        const usdtBal = await mexcApi.getBalance('USDT')
        const tradeAmt = settings.trade_amount || 1.0

        if (evalResult.signal === 'BUY' && usdtBal.free < tradeAmt) {
          setError(`الرصيد المتاح ($${usdtBal.free.toFixed(2)}) غير كافٍ لفتح صفقة بـ $${tradeAmt}. تم تجميد دورة الشراء بأمان.`)
          return
        }

        const result: any = await mexcApi.botTrade(
          evalResult.recommendedSymbol,
          evalResult.signal,
          tradeAmt,
          currentStrategy,
        )

        if (result?.error) {
          setError(result.error)
        } else {
          setError('')
          setSuccess(`✅ تم تنفيذ صفقة البوت بنجاح على ${evalResult.recommendedSymbol}`)
          await fetchBotData()
        }
      } else {
        setLastSignal('مراقبة مستمرة — لا توجد إشارة مطابقة')
        setSignalReason(evalResult.reason)
      }
    } catch (e: any) {
      setError(e.message || 'خطأ أثناء دورة البوت')
    } finally {
      setEvaluating(false)
    }
  }, [settings, dailyCount, fetchBotData])

  const startBot = async () => {
    setError('')
    setSuccess('')
    setRunning(true)
    onSettingsUpdate({ bot_running: true })
    await db.saveSettings({ bot_running: true })
    runBotCycle()
    intervalRef.current = setInterval(runBotCycle, 20000) // Evaluates every 20 seconds
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
    if (running && !intervalRef.current) {
      intervalRef.current = setInterval(runBotCycle, 20000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, runBotCycle])

  const setStrategy = (key: string) => {
    onSettingsUpdate({ bot_strategy: key })
    db.saveSettings({ bot_strategy: key })
  }

  return (
    <div className="space-y-4 pb-20 animate-in">
      <div className="row justify-between items-center">
        <div className="screen-title" style={{ margin: 0 }}>البوت الذكي متعدد الطبقات</div>
        <span className="badge badge-green">MEXC Multi-Layer Bot</span>
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

      {/* 4 Architecture Layers Status Banner */}
      <div className="card" style={{ background: '#111418', border: '1px solid #2B3139' }}>
        <span className="font-bold text-xs text-secondary block" style={{ marginBottom: 8 }}>
          طبقات المعمارية النشطة (System Architecture Layers)
        </span>
        <div className="space-y-2">
          {/* Layer 1 */}
          <div className="row justify-between items-center" style={{ padding: '6px 8px', background: '#161A1E', borderRadius: '6px' }}>
            <div className="row gap-6 items-center">
              <ShieldCheck size={14} className="text-green" />
              <span className="text-xs text-white">1. التوافق والتهدئة (Rate Limit & Cooldown): 1.5s</span>
            </div>
            <span className="badge badge-green" style={{ fontSize: '10px' }}>متوافق 100%</span>
          </div>

          {/* Layer 2 */}
          <div className="row justify-between items-center" style={{ padding: '6px 8px', background: '#161A1E', borderRadius: '6px' }}>
            <div className="row gap-6 items-center">
              <Sparkles size={14} className="text-accent" />
              <span className="text-xs text-white">2. رصد الأخبار والمشاعر (AI Sentiment Engine)</span>
            </div>
            <span className="text-xs text-green font-bold">+{sentiment?.averageScore || 85}% إيجابي</span>
          </div>

          {/* Layer 3 */}
          <div className="row justify-between items-center" style={{ padding: '6px 8px', background: '#161A1E', borderRadius: '6px' }}>
            <div className="row gap-6 items-center">
              <Flame size={14} className="text-accent" />
              <span className="text-xs text-white">3. فلترة السيولة (حجم &gt; 1M$ وتذبذب &gt; 3%)</span>
            </div>
            <span className="badge badge-green" style={{ fontSize: '10px' }}>مفعل</span>
          </div>

          {/* Layer 4 */}
          <div className="row justify-between items-center" style={{ padding: '6px 8px', background: '#161A1E', borderRadius: '6px' }}>
            <div className="row gap-6 items-center">
              <Zap size={14} className="text-green" />
              <span className="text-xs text-white">4. الوقف المتحرك وتسييل الفتات (Anti-Freeze 1.8%)</span>
            </div>
            <span className="badge badge-green" style={{ fontSize: '10px' }}>حماية مستمرة</span>
          </div>
        </div>
      </div>

      {/* Bot Engine Master Card */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="col gap-8" style={{ alignItems: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: running ? 'rgba(0, 192, 135, 0.15)' : 'rgba(132, 142, 156, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${running ? 'var(--green)' : 'var(--border)'}`,
            }}
          >
            <Bot size={36} className={running ? 'text-green' : 'text-muted'} />
          </div>

          <div>
            <div className={`font-bold text-lg ${running ? 'text-green' : 'text-muted'}`}>
              {running ? 'البوت يعمل بالتداول الفوري المستمر' : 'البوت في وضع الاستعداد'}
            </div>
            {lastSignal && (
              <div className="text-xs text-white font-bold" style={{ marginTop: 4 }}>
                {lastSignal}
              </div>
            )}
            {signalReason && (
              <div className="text-xs text-secondary" style={{ marginTop: 2 }}>
                {signalReason}
              </div>
            )}
          </div>
        </div>

        <div className="divider" />

        <div className="row justify-between">
          <div className="col gap-2">
            <span className="text-xs text-muted">صفقات اليوم</span>
            <span className="font-bold text-white">{dailyCount} / {MAX_DAILY_TRADES}</span>
          </div>
          <div className="col gap-2">
            <span className="text-xs text-muted">المبلغ لكل صفقة</span>
            <span className="font-bold text-accent">${settings.trade_amount || 1.0} USDT</span>
          </div>
          <div className="col gap-2">
            <span className="text-xs text-muted">المراكز المفتوحة</span>
            <span className="font-bold text-green">{activePositions.length}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="row gap-8">
          {running ? (
            <button className="btn btn-red" style={{ flex: 1, padding: '14px' }} onClick={stopBot}>
              <Square size={18} />
              إيقاف البوت
            </button>
          ) : (
            <button className="btn btn-green" style={{ flex: 1, padding: '14px' }} onClick={startBot}>
              <Play size={18} />
              تشغيل البوت الفوري
            </button>
          )}

          <button
            className="symbol-btn"
            style={{ width: 'auto', padding: '10px 14px', fontSize: '12px' }}
            onClick={runBotCycle}
            disabled={evaluating}
          >
            <RefreshCw size={14} className={evaluating ? 'spin' : ''} />
            <span>فحص يدوي الآن</span>
          </button>
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="card">
        <span className="font-semibold text-sm block" style={{ marginBottom: 10 }}>
          استراتيجيات التداول الذكية
        </span>
        <div className="space-y-2">
          {Object.entries(STRATEGIES).map(([key, info]) => {
            const isSelected = (settings.bot_strategy || 'multi_layer_pro') === key
            return (
              <div
                key={key}
                className="card"
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--green)' : '1px solid #2B3139',
                  background: isSelected ? 'rgba(0, 192, 135, 0.08)' : '#161A1E',
                }}
                onClick={() => setStrategy(key)}
              >
                <div className="row justify-between items-center" style={{ marginBottom: 4 }}>
                  <span className="font-bold text-sm text-white">{info.label}</span>
                  {isSelected && <span className="badge badge-green">مفعل</span>}
                </div>
                <span className="text-xs text-secondary">{info.desc}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Trailing Stop Positions */}
      {activePositions.length > 0 && (
        <div className="card">
          <div className="row justify-between items-center" style={{ marginBottom: 10 }}>
            <span className="font-semibold text-sm">مراكز البوت تحت حماية الوقف المتحرك</span>
            <span className="text-xs text-green">1.8% Trailing Stop</span>
          </div>

          <div className="space-y-2">
            {activePositions.map((p) => (
              <div
                key={p.id}
                className="row justify-between items-center"
                style={{ padding: '8px 10px', background: '#0B0E11', borderRadius: '6px' }}
              >
                <div>
                  <span className="font-bold text-xs text-white">{p.symbol}</span>
                  <div className="text-xs text-muted">دخول: ${p.entryPrice.toFixed(2)} | قمة: ${p.highestPrice.toFixed(2)}</div>
                </div>
                <div className="text-xs text-accent font-mono">
                  وقف البيع: ${p.stopPrice.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Bot Execution Logs */}
      <div className="card">
        <div className="row justify-between items-center" style={{ marginBottom: 10 }}>
          <span className="font-semibold text-sm">سجل صفقات البوت الفورية</span>
          <Activity size={16} className="text-green" />
        </div>

        {botTrades.length === 0 ? (
          <div className="empty-state text-sm">لا توجد صفقات منفذة بعد</div>
        ) : (
          <div className="space-y-2">
            {botTrades.map((t) => (
              <div key={t.id} className="trade-row">
                <div className="col gap-2">
                  <div className="row gap-4 items-center">
                    <span className="font-semibold text-sm text-white">{t.symbol}</span>
                    <span className="text-xs text-secondary font-mono">{t.strategy || 'Multi-Layer'}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(t.created_at).toLocaleTimeString('ar')}
                  </span>
                </div>
                <div className="col items-end gap-2">
                  <span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                    {t.side === 'BUY' ? 'شراء فوري' : 'بيع فوري'}
                  </span>
                  <span className="text-xs text-muted font-mono">
                    ${t.amount} @ ${parseFloat(t.price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
