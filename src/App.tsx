import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Language,
  TradeDuration,
  AnalysisCandle,
  PayoutFilter,
  EventPosition,
  NewsItem,
  AISentimentState,
} from './types'
import { getT } from './lib/translations'
import { TopHeader } from './components/TopHeader'
import { EventFuturesChart } from './components/EventFuturesChart'
import { AutoTradePanel } from './components/AutoTradePanel'
import { PositionsPanel } from './components/PositionsPanel'
import { BottomNav } from './components/BottomNav'
import { WalletsView } from './components/WalletsView'
import { NewsModal } from './components/NewsModal'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function App() {
  // Localization state
  const [language, setLanguage] = useState<Language>('ar')
  const t = getT(language)

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'futures' | 'wallets'>('futures')

  // News Modal state
  const [isNewsOpen, setIsNewsOpen] = useState<boolean>(false)

  // Chart & Trade Parameters
  const [timeframe, setTimeframe] = useState<string>('15m')
  const [duration, setDuration] = useState<TradeDuration>('10m')
  const [candle, setCandle] = useState<AnalysisCandle>('1m')
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>(80)
  const [amount, setAmount] = useState<number | string>(100)
  const [availBalance, setAvailBalance] = useState<number>(1250.0005)
  const [currentPrice, setCurrentPrice] = useState<number>(69503.5)
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false)

  // Payout Ratios matching live exchange states
  const [upPayout, setUpPayout] = useState<number>(80)
  const [downPayout, setDownPayout] = useState<number>(80)

  // AI Sentiment State
  const [sentiment, setSentiment] = useState<AISentimentState>({
    score: 84,
    confidence: 'BULLISH EVENT CONFIRMED [84% AI SCORE]',
    confidenceAr: 'تأكيد حدث صعودي قوي [نسبة تطابق الذكاء الاصطناعي ٨٤%]',
    direction: 'BULLISH',
    riskLevel: 'LOW_RISK',
  })

  // Live News Feeds
  const [newsList, setNewsList] = useState<NewsItem[]>([
    {
      id: 'news-1',
      title: 'FED Rate Decision Live: Macro Liquidity Inflow Accelerates Crypto Surge',
      titleAr: 'قرار الفيدرالي بث مباشر: تدفقات السيولة النقدية الكلية تسرع وتيرة صعود البيتكوين',
      source: 'CoinDesk / Bloomberg',
      sentiment: 'BULLISH',
      score: 84,
      time: '2m ago',
      category: 'Macro / Liquidity',
    },
    {
      id: 'news-2',
      title: 'Tech Sector Momentum & Institutional BTC Spot Accumulation Reaches Weekly High',
      titleAr: 'زخم قطاع التكنولوجيا وتراكم البيتكوين المؤسسي يسجل أعلى مستوى أسبوعي',
      source: 'Bloomberg, Reuters',
      sentiment: 'BULLISH',
      score: 79,
      time: '8m ago',
      category: 'Institutional Flows',
    },
    {
      id: 'news-3',
      title: 'MEXC Event Futures Volume Hits Record as Options Settlement Approaches',
      titleAr: 'حجم تداول عقود الأحداث في MEXC يسجل رقماً قياسياً مع اقتراب وقت التسوية',
      source: 'MEXC Market Wire',
      sentiment: 'BULLISH',
      score: 88,
      time: '14m ago',
      category: 'Exchange Vol',
    },
  ])

  // Open & Closed Positions
  const [openPositions, setOpenPositions] = useState<EventPosition[]>([])
  const [closedPositions, setClosedPositions] = useState<EventPosition[]>([
    {
      id: 'pos-hist-1',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      amount: 100,
      entryPrice: 69450.0,
      settlementPrice: 69520.0,
      payoutRatio: 80,
      minRequiredPayout: 75,
      duration: '10m',
      analysisCandle: '5m',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      expiryMinutes: 10,
      isAuto: true,
      status: 'WON',
      pnl: 80.0,
      engine: 'AI Sentiment + Indicator Engine',
    },
    {
      id: 'pos-hist-2',
      symbol: 'BTCUSDT',
      direction: 'SHORT',
      amount: 50,
      entryPrice: 69600.0,
      settlementPrice: 69480.0,
      payoutRatio: 89,
      minRequiredPayout: 80,
      duration: '30m',
      analysisCandle: '15m',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expiryMinutes: 30,
      isAuto: true,
      status: 'WON',
      pnl: 44.5,
      engine: 'AI Sentiment + Indicator Engine',
    },
  ])

  // Toast Notification
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'warn' } | null>(null)

  // Toggle Language Handler
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))
  }

  // Fetch initial contract & news data from backend
  const fetchData = useCallback(async () => {
    try {
      const cRes = await fetch('/api/mexc/events/contract?symbol=BTCUSDT')
      if (cRes.ok) {
        const cData = await cRes.json()
        if (cData.indexPrice) setCurrentPrice(cData.indexPrice)
        if (cData.upPayout) setUpPayout(cData.upPayout)
        if (cData.downPayout) setDownPayout(cData.downPayout)
      }

      const nRes = await fetch('/api/mexc/news')
      if (nRes.ok) {
        const nData = await nRes.json()
        if (nData.data) setNewsList(nData.data)
        if (nData.overallSentiment) {
          setSentiment((prev) => ({ ...prev, ...nData.overallSentiment }))
        }
      }

      const pRes = await fetch('/api/mexc/events/positions')
      if (pRes.ok) {
        const pData = await pRes.json()
        if (pData.openPositions) setOpenPositions(pData.openPositions)
        if (pData.closedPositions && pData.closedPositions.length > 0) {
          setClosedPositions(pData.closedPositions)
        }
      }
    } catch (e) {
      console.warn('Backend sync poll:', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Live Price micro-movements
  useEffect(() => {
    const pInterval = setInterval(() => {
      setCurrentPrice((prev) => {
        const delta = (Math.random() - 0.49) * 2.5
        return Math.max(68000, Math.min(72000, prev + delta))
      })
    }, 1200)
    return () => clearInterval(pInterval)
  }, [])

  // Order Execution Function
  const executeOrder = async (direction: 'LONG' | 'SHORT', isAuto: boolean = false) => {
    const currentPayoutVal = direction === 'LONG' ? upPayout : downPayout
    const tradeAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 100

    if (availBalance < tradeAmount) {
      const msg = language === 'ar' ? 'الرصيد المتاح غير كافٍ لفتح المركز' : 'Insufficient balance'
      setNotification({ msg, type: 'warn' })
      setTimeout(() => setNotification(null), 3500)
      return
    }

    try {
      const res = await fetch('/api/mexc/events/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTCUSDT',
          direction,
          amount: tradeAmount,
          duration,
          analysisCandle: candle,
          payoutRatio: currentPayoutVal,
          minRequiredPayout: payoutFilter,
          isAuto,
        }),
      })

      const data = await res.json()
      if (res.ok && data.position) {
        setOpenPositions((prev) => [data.position, ...prev])
        setAvailBalance((prev) => Math.max(0, prev - tradeAmount))
        const msg =
          language === 'ar'
            ? `✓ تم فتح مركز ${direction === 'LONG' ? 'صعود (Up)' : 'هبوط (Down)'} بقيمة $${tradeAmount} بنجاح!`
            : `✓ Opened ${direction} order for $${tradeAmount} successfully!`
        setNotification({ msg, type: 'success' })
        setTimeout(() => setNotification(null), 4000)
      } else {
        setNotification({ msg: data.error || 'Order placement rejected', type: 'warn' })
        setTimeout(() => setNotification(null), 3500)
      }
    } catch (e: any) {
      setNotification({ msg: e.message || 'Execution failed', type: 'warn' })
      setTimeout(() => setNotification(null), 3500)
    }
  }

  // Auto-Trading background loop
  const autoTradeRef = useRef<boolean>(isAutoRunning)
  autoTradeRef.current = isAutoRunning

  useEffect(() => {
    if (!isAutoRunning) return

    const loop = setInterval(() => {
      if (!autoTradeRef.current) return
      const isBullish = sentiment.score >= 70
      const direction: 'LONG' | 'SHORT' = isBullish ? 'LONG' : 'SHORT'
      const payoutVal = direction === 'LONG' ? upPayout : downPayout

      if (payoutVal >= payoutFilter) {
        executeOrder(direction, true)
      }
    }, 15000)

    return () => clearInterval(loop)
  }, [isAutoRunning, sentiment, upPayout, downPayout, payoutFilter, amount, availBalance, duration, candle])

  const toggleAutoTrading = () => {
    setIsAutoRunning((prev) => {
      const next = !prev
      const msg = next
        ? language === 'ar'
          ? '▶ تم تشغيل المتداول الآلي بالذكاء الاصطناعي على مدار 24 ساعة'
          : '▶ Automated 24/7 Cloud Trading Engine Activated'
        : language === 'ar'
        ? '⏹ تم إيقاف المتداول الآلي'
        : '⏹ Automated Trading Paused'
      setNotification({ msg, type: 'success' })
      setTimeout(() => setNotification(null), 3000)
      return next
    })
  }

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-black text-[#eaecef] font-sans antialiased flex justify-center selection:bg-[#2962ff] selection:text-white"
    >
      <div className="w-full max-w-[480px] min-h-screen bg-black flex flex-col border-x border-[#1a1e26] shadow-2xl relative">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
          {/* Top Status & Language Bar matching screenshot */}
          <TopHeader
            language={language}
            onToggleLanguage={toggleLanguage}
            onOpenNews={() => setIsNewsOpen(true)}
          />

          {/* Toast Notification Banner */}
          {notification && (
            <div
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200 ${
                notification.type === 'success'
                  ? 'bg-[#0f2e22] border border-[#00c087] text-[#00c087]'
                  : 'bg-[#2e1419] border border-[#f6465d] text-[#f6465d]'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{notification.msg}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-white text-xs cursor-pointer ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {currentTab === 'wallets' ? (
            <WalletsView
              language={language}
              availBalance={availBalance}
              onBack={() => setCurrentTab('futures')}
            />
          ) : (
            <>
              {/* Candlestick & Price Chart */}
              <EventFuturesChart
                language={language}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                currentPrice={currentPrice}
                upPayout={upPayout}
                downPayout={downPayout}
                onOpenSettings={() => setIsNewsOpen(true)}
              />

              {/* Time Unit, Amount & Order Action Panel */}
              <AutoTradePanel
                language={language}
                duration={duration}
                setDuration={setDuration}
                amount={amount}
                setAmount={setAmount}
                availBalance={availBalance}
                isAutoRunning={isAutoRunning}
                onToggleAutoTrading={toggleAutoTrading}
                onTrade={(dir) => executeOrder(dir, false)}
                upPayout={upPayout}
                downPayout={downPayout}
                payoutFilter={payoutFilter}
                setPayoutFilter={setPayoutFilter}
                candle={candle}
                setCandle={setCandle}
              />

              {/* Positions Panel matching screenshot tabs */}
              <PositionsPanel
                language={language}
                openPositions={openPositions}
                closedPositions={closedPositions}
                onOpenHistoryModal={() => setIsNewsOpen(true)}
              />
            </>
          )}
        </main>

        {/* Persistent Bottom Bar matching screenshot */}
        <BottomNav
          language={language}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        {/* Trading News & AI Sentiment Radar Modal */}
        <NewsModal
          isOpen={isNewsOpen}
          onClose={() => setIsNewsOpen(false)}
          language={language}
          newsList={newsList}
          sentiment={sentiment}
        />
      </div>
    </div>
  )
}
