import React, { useState, useEffect, useCallback } from 'react'
import { Sparkles, Flame, RefreshCw, ExternalLink, ArrowUpRight, ArrowDownRight, ShieldCheck, Newspaper } from 'lucide-react'
import { marketScanner, ScannedMarketPair } from '../lib/scanner'
import { newsSentimentEngine, NewsItem } from '../lib/news_sentiment'
import { mexcApi } from '../lib/supabase'

export default function ScannerScreen({
  onSelectPair,
}: {
  onSelectPair?: (symbol: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'scanner' | 'news'>('scanner')
  const [pairs, setPairs] = useState<ScannedMarketPair[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [sentimentSummary, setSentimentSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [quickTradeSuccess, setQuickTradeSuccess] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [scannedPairs, latestNews] = await Promise.all([
        marketScanner.scanMarket(1000000, 3.0),
        newsSentimentEngine.fetchLatestNews(),
      ])
      setPairs(scannedPairs)
      setNews(latestNews)
      setSentimentSummary(newsSentimentEngine.getOverallMarketSentiment())
    } catch (e) {
      console.error('Error loading scanner/news data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 20000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleQuickBuy = async (symbol: string) => {
    setQuickTradeSuccess('')
    try {
      await mexcApi.placeSpotOrder({
        symbol,
        side: 'BUY',
        amountUsdt: 1.0,
        orderType: 'MARKET',
      })
      setQuickTradeSuccess(`✅ تم تنفيذ أمر شراء فوري بقيمة $1.00 على ${symbol}`)
      setTimeout(() => setQuickTradeSuccess(''), 4000)
    } catch (e: any) {
      alert(`خطأ: ${e.message}`)
    }
  }

  return (
    <div className="animate-in space-y-4 pb-20">
      <div className="row justify-between items-center" style={{ marginBottom: 12 }}>
        <div className="screen-title" style={{ margin: 0 }}>
          رادار السوق & الأخبار الذكية
        </div>
        <button
          className="symbol-btn"
          style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>تحديث</span>
        </button>
      </div>

      {quickTradeSuccess && (
        <div className="success-banner">
          <span>{quickTradeSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="row gap-8">
        <button
          className={`symbol-btn ${activeTab === 'scanner' ? 'active' : ''}`}
          style={{ flex: 1, padding: '10px 8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => setActiveTab('scanner')}
        >
          <Flame size={16} className="text-accent" />
          <span>فلتر السيولة النشطة (&gt;$1M)</span>
        </button>
        <button
          className={`symbol-btn ${activeTab === 'news' ? 'active' : ''}`}
          style={{ flex: 1, padding: '10px 8px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => setActiveTab('news')}
        >
          <Sparkles size={16} className="text-green" />
          <span>تحليل الأخبار والمشاعر (AI)</span>
        </button>
      </div>

      {/* Sentiment Overview Box */}
      {sentimentSummary && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(22, 26, 30, 0.95), rgba(11, 14, 17, 0.95))' }}>
          <div className="row justify-between items-center" style={{ marginBottom: 8 }}>
            <div className="row gap-6">
              <Sparkles size={18} className="text-green" />
              <span className="font-bold text-sm">مؤشر المشاعر العام للسوق</span>
            </div>
            <span
              className={`badge ${
                sentimentSummary.sentiment === 'POSITIVE'
                  ? 'badge-green'
                  : sentimentSummary.sentiment === 'NEGATIVE'
                  ? 'badge-red'
                  : ''
              }`}
            >
              {sentimentSummary.sentiment === 'POSITIVE'
                ? 'إيجابي متفائل (+)'
                : sentimentSummary.sentiment === 'NEGATIVE'
                ? 'سلبي حذر (-)'
                : 'محايد مستقر'}
            </span>
          </div>

          <div className="row justify-between" style={{ marginTop: 8 }}>
            <div className="col gap-2">
              <span className="text-xs text-muted">درجة الزخم الإخباري</span>
              <span className="font-bold text-lg text-green">+{sentimentSummary.averageScore}%</span>
            </div>
            <div className="col gap-2" style={{ textAlign: 'center' }}>
              <span className="text-xs text-muted">أخبار صاعدة / هابطة</span>
              <span className="font-bold text-sm">
                🟢 {sentimentSummary.bullishCount} / 🔴 {sentimentSummary.bearishCount}
              </span>
            </div>
            <div className="col gap-2" style={{ textAlign: 'left' }}>
              <span className="text-xs text-muted">العملات الأكثر زخماً</span>
              <span className="font-bold text-xs text-accent">
                {sentimentSummary.topBullishCoins.slice(0, 2).join(', ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Scanner */}
      {activeTab === 'scanner' && (
        <div className="space-y-3">
          <div className="card">
            <div className="row justify-between items-center" style={{ marginBottom: 10 }}>
              <span className="font-semibold text-sm">العملات المطابقة لمعايير السيولة والتذبذب</span>
              <span className="text-xs text-secondary">{pairs.length} عملة مؤهلة</span>
            </div>
            <div className="row gap-4 text-xs text-muted" style={{ padding: '6px 8px', background: '#0B0E11', borderRadius: '6px' }}>
              <ShieldCheck size={14} className="text-green" />
              <span>حجم 24h &gt; 1M$ | فارق سبريد &lt; 0.5% | تذبذب سريع</span>
            </div>
          </div>

          <div className="space-y-2">
            {pairs.map((p) => (
              <div key={p.symbol} className="card" style={{ padding: '12px 14px' }}>
                <div className="row justify-between items-center">
                  <div>
                    <div className="row gap-6 items-center">
                      <span className="font-bold text-base text-white">{p.symbol.replace('USDT', '')}</span>
                      <span className="text-xs text-secondary">/USDT</span>
                      <span
                        className="badge"
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          background: p.tag === 'HOT' ? 'rgba(240,185,11,0.15)' : 'rgba(0,192,135,0.15)',
                          color: p.tag === 'HOT' ? 'var(--accent)' : 'var(--green)',
                        }}
                      >
                        {p.tag === 'HOT' ? '🔥 سيولة عالية' : p.tag === 'GAIN' ? '🚀 صعود قوي' : '⚡ متذبذب نشط'}
                      </span>
                    </div>
                    <div className="row gap-8" style={{ marginTop: 4 }}>
                      <span className="text-xs text-muted">
                        الحجم: ${(p.volume24hUsdt / 1e6).toFixed(1)}M
                      </span>
                      <span className="text-xs text-muted">التذبذب: {p.volatility}%</span>
                      <span className="text-xs text-green">جودة السيولة: {p.liquidityScore}/100</span>
                    </div>
                  </div>

                  <div className="col items-end gap-4">
                    <span className="font-bold text-sm text-white">${p.lastPrice.toLocaleString()}</span>
                    <span
                      className={`text-xs font-bold ${
                        p.priceChangePercent >= 0 ? 'text-green' : 'text-red'
                      }`}
                    >
                      {p.priceChangePercent >= 0 ? '+' : ''}
                      {p.priceChangePercent.toFixed(2)}%
                    </span>
                    <button
                      className="btn btn-green"
                      style={{ padding: '4px 10px', fontSize: '11px', height: '28px', marginTop: 2 }}
                      onClick={() => {
                        if (onSelectPair) onSelectPair(p.symbol)
                        handleQuickBuy(p.symbol)
                      }}
                    >
                      شراء فوري $1
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: News */}
      {activeTab === 'news' && (
        <div className="space-y-3">
          <div className="card">
            <div className="row gap-6 items-center">
              <Newspaper size={16} className="text-accent" />
              <span className="font-semibold text-sm">موجز الأخبار اللحظي مع التصنيف الذكي</span>
            </div>
            <span className="text-xs text-muted" style={{ display: 'block', marginTop: 4 }}>
              يتم تصنيف كل خبر فورياً إلى (إيجابي / سلبي / محايد) لحساب الزخم وتنفيذ أوامر التداول التلقائية
            </span>
          </div>

          <div className="space-y-2">
            {news.map((item) => {
              const isPos = item.sentiment === 'POSITIVE'
              const isNeg = item.sentiment === 'NEGATIVE'

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${
                      isPos ? 'var(--green)' : isNeg ? 'var(--red)' : 'var(--border)'
                    }`,
                  }}
                >
                  <div className="row justify-between items-center" style={{ marginBottom: 6 }}>
                    <div className="row gap-6">
                      <span className="text-xs font-bold text-accent">{item.source}</span>
                      <span className="text-xs text-muted">
                        {new Date(item.publishedAt).toLocaleTimeString('ar')}
                      </span>
                    </div>
                    <span
                      className={`badge ${
                        isPos ? 'badge-green' : isNeg ? 'badge-red' : ''
                      }`}
                      style={{ fontSize: '10px' }}
                    >
                      {isPos ? `🟢 إيجابي (+${item.score}%)` : isNeg ? `🔴 سلبي (${item.score}%)` : '⚪ محايد'}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-white" style={{ lineHeight: 1.4 }}>
                    {item.title}
                  </div>

                  <div className="row justify-between items-center" style={{ marginTop: 8 }}>
                    <div className="row gap-4">
                      {item.symbols.map((s) => (
                        <span
                          key={s}
                          className="badge"
                          style={{ fontSize: '10px', background: '#0B0E11' }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {isPos && (
                      <button
                        className="btn btn-green"
                        style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
                        onClick={() => handleQuickBuy(`${item.symbols[0] || 'BTC'}USDT`)}
                      >
                        دخول مع الزخم ($1)
                      </button>
                    )}
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
