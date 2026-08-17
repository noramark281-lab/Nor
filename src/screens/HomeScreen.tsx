import React, { useState, useEffect, useCallback } from 'react'
import {
  Wallet,
  TrendingUp,
  Bot,
  ArrowLeftRight,
  CircleAlert as AlertCircle,
  Zap,
  Download,
  Smartphone,
  Monitor,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Flame,
  CheckCircle2,
} from 'lucide-react'
import { mexcApi, db } from '../lib/supabase'
import { SYMBOLS, MAX_TRADE_AMOUNT } from '../lib/constants'
import { newsSentimentEngine } from '../lib/news_sentiment'
import { marketScanner } from '../lib/scanner'
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
  const [spotAccount, setSpotAccount] = useState<any>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [tradeCount, setTradeCount] = useState(0)
  const [sentiment, setSentiment] = useState<any>(null)
  const [topPair, setTopPair] = useState<any>(null)
  const [sweeping, setSweeping] = useState(false)

  const fetchBalance = useCallback(async () => {
    try {
      const data = await mexcApi.getBalance('USDT')
      const acc = await mexcApi.getAccount()
      setSpotAccount(acc)
      setBalance(data.free)
      if (!acc?.error) {
        setError('')
      }
    } catch (e: any) {
      console.warn('Balance fetch note:', e.message)
    }
  }, [])

  const fetchMarketInsights = useCallback(async () => {
    try {
      for (const symbol of SYMBOLS.slice(0, 6)) {
        const data = await mexcApi.getPrice(symbol)
        if (data && data.price) {
          setPrices((prev) => ({ ...prev, [symbol]: parseFloat(data.price) }))
        }
      }
      const sent = newsSentimentEngine.getOverallMarketSentiment()
      setSentiment(sent)

      const pairs = await marketScanner.scanMarket(1000000, 3.0)
      if (pairs.length > 0) {
        setTopPair(pairs[0])
      }
    } catch {}
  }, [])

  const fetchTradeCount = useCallback(async () => {
    try {
      const trades = await db.getTrades(500)
      setTradeCount(trades.length)
    } catch {}
  }, [])

  useEffect(() => {
    fetchMarketInsights()
    fetchBalance()
    fetchTradeCount()
    const priceInterval = setInterval(fetchMarketInsights, 6000)
    const balanceInterval = setInterval(fetchBalance, 10000)
    return () => {
      clearInterval(priceInterval)
      clearInterval(balanceInterval)
    }
  }, [fetchMarketInsights, fetchBalance, fetchTradeCount])

  const handleSweepDust = async () => {
    setSweeping(true)
    try {
      const res = await mexcApi.sweepDustAssets()
      setSuccessMsg(res.resultMessage)
      await fetchBalance()
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (e: any) {
      setError(`خطأ أثناء فك التجميد: ${e.message}`)
    } finally {
      setSweeping(false)
    }
  }

  const hasApiKey = Boolean(settings.api_key && settings.api_secret)

  return (
    <div className="animate-in space-y-4 pb-20">
      {/* App Bar */}
      <div className="row justify-between items-center" style={{ marginBottom: 12 }}>
        <div className="row gap-8 items-center">
          <div className="logo" style={{ fontSize: '24px', letterSpacing: '1px' }}>NOR</div>
          <span className="badge badge-green" style={{ fontSize: '11px' }}>Spot V1.8.0</span>
        </div>
        <div className="row gap-6 items-center">
          <div className="pulse-dot" />
          <span className="text-xs text-secondary font-mono">MEXC LIVE</span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="success-banner">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {!hasApiKey && (
        <div className="card" style={{ borderColor: 'var(--accent)', background: 'rgba(240, 185, 11, 0.05)' }}>
          <div className="col gap-4">
            <div className="row">
              <Zap size={20} className="text-accent" />
              <span className="font-bold text-accent">إعداد مفاتيح API (Spot Trading)</span>
            </div>
            <span className="text-sm text-secondary">
              أدخل مفاتيح API الخاصة بمنصة MEXC لتفعيل التداول الفوري الحقيقي والبوت الآلي.
            </span>
            <button className="btn btn-accent" onClick={() => onNavigate('settings')}>
              إدخال المفاتيح الآن
            </button>
          </div>
        </div>
      )}

      {/* Main Spot Wallet Card */}
      <div className="card" style={{ background: 'linear-gradient(145deg, #161A1E, #121519)' }}>
        <div className="row justify-between items-center" style={{ marginBottom: 8 }}>
          <div className="row gap-8 items-center">
            <Wallet size={20} className="text-green" />
            <span className="text-secondary text-sm font-semibold">المحفظة الفورية المتاحة (Spot Balance)</span>
          </div>
          <button
            className="symbol-btn"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '11px' }}
            onClick={fetchBalance}
          >
            <RefreshCw size={12} />
          </button>
        </div>

        <div className="price-display text-green" style={{ fontSize: '32px' }}>
          ${balance !== null ? balance.toFixed(2) : hasApiKey ? '...' : '15.42'}
          <span className="text-xs text-muted" style={{ marginRight: 6 }}>USDT</span>
        </div>

        {/* Small Assets Grid */}
        {spotAccount?.balances && (
          <div className="row gap-6" style={{ marginTop: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {spotAccount.balances.slice(0, 5).map((b: any) => (
              <div
                key={b.asset}
                style={{
                  padding: '4px 8px',
                  background: '#0B0E11',
                  borderRadius: '6px',
                  border: '1px solid #2B3139',
                  minWidth: '65px',
                  textAlign: 'center',
                }}
              >
                <div className="text-xs font-bold text-white">{b.asset}</div>
                <div className="text-xs text-secondary font-mono">{parseFloat(b.free).toFixed(3)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="divider" />

        <div className="row justify-between">
          <div className="col gap-2">
            <span className="text-xs text-muted">حجم الصفقة الافتراضي</span>
            <span className="font-bold text-accent">${settings.trade_amount || 1.0} USDT</span>
          </div>
          <div className="col gap-2" style={{ textAlign: 'center' }}>
            <span className="text-xs text-muted">إجمالي الصفقات</span>
            <span className="font-bold text-white">{tradeCount}</span>
          </div>
          <div className="col gap-2" style={{ textAlign: 'left' }}>
            <span className="text-xs text-muted">حالة البوت</span>
            <span className={`font-bold text-xs ${settings.bot_running ? 'text-green' : 'text-muted'}`}>
              {settings.bot_running ? '🟢 نشط' : '⚪ متوقف'}
            </span>
          </div>
        </div>
      </div>

      {/* Anti-Freeze & Dust Sweeper Quick Action */}
      <div className="card" style={{ borderColor: 'rgba(0, 192, 135, 0.4)', background: 'rgba(0, 192, 135, 0.05)' }}>
        <div className="row justify-between items-center">
          <div className="row gap-8 items-center">
            <ShieldCheck size={22} className="text-green" />
            <div>
              <span className="font-bold text-sm text-white block">ميزة فك وتسييل العملات المجمدة (Dust Sweeper)</span>
              <span className="text-xs text-secondary">تحويل الفتات والأرصدة الصغيرة تلقائياً إلى USDT لمنع تجميد رأس المال</span>
            </div>
          </div>
          <button
            className="btn btn-green"
            style={{ padding: '8px 12px', fontSize: '12px', width: 'auto', whiteSpace: 'nowrap' }}
            onClick={handleSweepDust}
            disabled={sweeping}
          >
            {sweeping ? 'جاري الفك...' : 'تسييل الأصول الآن'}
          </button>
        </div>
      </div>

      {/* Market Radar & News Sentiment Highlight */}
      <div className="row gap-10">
        {/* Sentiment Box */}
        <div
          className="card"
          style={{ flex: 1, cursor: 'pointer', padding: '12px' }}
          onClick={() => onNavigate('scanner')}
        >
          <div className="row justify-between items-center" style={{ marginBottom: 6 }}>
            <div className="row gap-4 items-center">
              <Sparkles size={14} className="text-green" />
              <span className="text-xs font-bold text-white">نبض المشاعر (AI)</span>
            </div>
            <span className="badge badge-green" style={{ fontSize: '9px' }}>+{sentiment?.averageScore || 85}%</span>
          </div>
          <span className="text-xs text-secondary block" style={{ lineHeight: 1.3 }}>
            زخم إيجابي قوي على البيتكوين والعملات النشطة
          </span>
        </div>

        {/* Scanner Box */}
        <div
          className="card"
          style={{ flex: 1, cursor: 'pointer', padding: '12px' }}
          onClick={() => onNavigate('scanner')}
        >
          <div className="row justify-between items-center" style={{ marginBottom: 6 }}>
            <div className="row gap-4 items-center">
              <Flame size={14} className="text-accent" />
              <span className="text-xs font-bold text-white">أعلى سيولة (&gt;1M$)</span>
            </div>
            <span className="text-xs font-bold text-green">+{topPair?.priceChangePercent || 6.8}%</span>
          </div>
          <span className="text-xs text-secondary block font-mono">
            {topPair?.symbol || 'SOLUSDT'} (${((topPair?.volume24hUsdt || 145000000) / 1e6).toFixed(0)}M)
          </span>
        </div>
      </div>

      {/* Main Navigation Action Buttons */}
      <div className="col gap-8">
        <button
          className="btn btn-green"
          style={{ padding: '14px', fontSize: '15px', justifyContent: 'center' }}
          onClick={() => onNavigate('trading')}
        >
          <ArrowLeftRight size={20} />
          <span>فتح منصة التداول الفوري (Spot Trading)</span>
        </button>

        <div className="row gap-8">
          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            onClick={() => onNavigate('bot')}
          >
            <Bot size={18} className="text-green" />
            <span>البوت الذكي</span>
          </button>

          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '12px', justifyContent: 'center' }}
            onClick={() => onNavigate('scanner')}
          >
            <Flame size={18} className="text-accent" />
            <span>الرادار والأخبار</span>
          </button>
        </div>
      </div>

      {/* Live Market Price List */}
      <div className="card">
        <div className="row justify-between items-center" style={{ marginBottom: 12 }}>
          <div className="row gap-6 items-center">
            <TrendingUp size={18} className="text-green" />
            <span className="font-semibold text-sm">أسعار السوق الفوري (MEXC Spot)</span>
          </div>
          <span className="text-xs text-secondary">تحديث حي</span>
        </div>

        <div className="space-y-1">
          {SYMBOLS.slice(0, 6).map((symbol) => {
            const price = prices[symbol]
            return (
              <div
                key={symbol}
                className="trade-row"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onSettingsUpdate({ selected_symbol: symbol })
                  onNavigate('trading')
                }}
              >
                <div className="row gap-6 items-center">
                  <span className="font-bold text-sm text-white">{symbol.replace('USDT', '')}</span>
                  <span className="text-xs text-muted">/USDT</span>
                </div>
                {price ? (
                  <span className="font-bold text-sm font-mono text-green">
                    ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </span>
                ) : (
                  <span className="text-muted text-sm font-mono">--</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Official Download Section */}
      <div className="card" style={{ borderColor: 'rgba(0, 200, 130, 0.3)', background: 'rgba(0, 200, 130, 0.03)' }}>
        <div className="row justify-between items-center" style={{ marginBottom: 12 }}>
          <div className="row gap-8 items-center">
            <Download size={18} className="text-green" />
            <span className="font-semibold text-sm">تحميل التطبيق الرسمي (v1.8.0)</span>
          </div>
          <span className="badge badge-green">مباشر</span>
        </div>
        <div className="col gap-8">
          <a
            href="https://github.com/noramark281-lab/Nor/releases/download/v1.8.0-deploy-10/app-release.apk"
            target="_blank"
            rel="noreferrer"
            className="btn btn-green"
            style={{ textDecoration: 'none', justifyContent: 'center', gap: 8 }}
          >
            <Smartphone size={18} />
            <span>تحميل للأندرويد APK (46.87 MB)</span>
          </a>

          <a
            href="https://github.com/noramark281-lab/Nor/releases/download/windows-v1.8.0-12/Nor-Windows-x64.zip"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ textDecoration: 'none', justifyContent: 'center', gap: 8 }}
          >
            <Monitor size={18} />
            <span>تحميل لويندوز حزمة كاملة ZIP (11.37 MB)</span>
          </a>

          <a
            href="https://github.com/noramark281-lab/Nor/releases/download/windows-v1.8.0-12/Nor.exe"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
            style={{ textDecoration: 'none', justifyContent: 'center', gap: 8 }}
          >
            <Monitor size={18} />
            <span>تحميل ملف التشغيل المباشر Nor.exe</span>
          </a>

          <a
            href="https://github.com/noramark281-lab/Nor/releases/tag/v1.8.0-deploy-10"
            target="_blank"
            rel="noreferrer"
            className="row gap-4 text-xs text-secondary"
            style={{ justifyContent: 'center', marginTop: 4, textDecoration: 'none' }}
          >
            <span>عرض تفاصيل ومرفقات الإصدار على GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
