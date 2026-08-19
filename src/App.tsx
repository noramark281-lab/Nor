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
import { Sparkles, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function App() {
  // Localization state: Arabic by default, with one-tap toggle to English
  const [language, setLanguage] = useState<Language>('ar')
  const t = getT(language)

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'futures' | 'wallets'>('futures')

  // Auto-Trade Configuration Parameters
  const [duration, setDuration] = useState<TradeDuration>('10m')
  const [candle, setCandle] = useState<AnalysisCandle>('1m')
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>(80)
  const [amount, setAmount] = useState<number>(100)
  const [availBalance, setAvailBalance] = useState<number>(1250.0005)
  const [currentPrice, setCurrentPrice] = useState<number>(68023.5)
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false)

  // Payout Ratios
  const [upPayout, setUpPayout] = useState<number>(80)
  const [downPayout, setDownPayout] = useState<number>(80)

  // AI Sentiment & News States
  const [sentiment, setSentiment] = useState<AISentimentState>({
    score: 84,
    confidence: 'HIGH EVENT PROBABILITY [75% CONFIDENCE]',
    confidenceAr: 'تفاؤل عالي: احتمال حدث صعودي قوي [تأكيد ٨٤%]',
    direction: 'BULLISH',
    riskLevel: 'LOW_RISK',
  })
  const [newsList, setNewsList] = useState<NewsItem[]>([
    {
      id: 'news-1',
      title: 'FED Rate Decision Live: Macro Liquidity Inflow Accelerates Crypto Surge',
      titleAr: 'قرار الفيدرالي بث مباشر: تدفق السيولة النقدية يعزز صعود أسواق الكريبتو',
      source: 'CoinDesk / Bloomberg',
      sentiment: 'BULLISH',
      score: 84,
      time: '2m ago',
      category: 'Macro / FED',
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
  ])

  // Positions
  const [openPositions, setOpenPositions] = useState<EventPosition[]>([])
  const [closedPositions, setClosedPositions] = useState<EventPosition[]>([
    {
      id: 'pos-hist-1',
      symbol: 'BTC/USDT',
      direction: 'LONG',
      amount: 100,
      entryPrice: 67850.0,
      settlementPrice: 68120.0,
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
      engine: 'AI Sentiment + Technical Indicator Engine',
    },
    {
      id: 'pos-hist-2',
      symbol: 'BTC/USDT',
      direction: 'SHORT',
      amount: 50,
      entryPrice: 68400.0,
      settlementPrice: 68250.0,
      payoutRatio: 85,
      minRequiredPayout: 80,
      duration: '30m',
      analysisCandle: '15m',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expiryMinutes: 30,
      isAuto: true,
      status: 'WON',
      pnl: 42.5,
      engine: 'AI Sentiment + Technical Indicator Engine',
    },
  ])

  // Banner Notification
  const [notification, setNotification] = useState<string | null>(null)

  // Toggle Language Handler
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))
  }

  // Fetch initial contract & news data
  const fetchData = useCallback(async () => {
    try {
      // 1. Contract & Price
      const cRes = await fetch('/api/mexc/events/contract?symbol=BTCUSDT')
      if (cRes.ok) {
        const cData = await cRes.json()
        if (cData.indexPrice) setCurrentPrice(cData.indexPrice)
        if (cData.upPayout) setUpPayout(cData.upPayout)
        if (cData.downPayout) setDownPayout(cData.downPayout)
      }

      // 2. News & Sentiment
      const nRes = await fetch('/api/mexc/news')
      if (nRes.ok) {
        const nData = await nRes.json()
        if (nData.data) setNewsList(nData.data)
        if (nData.overallSentiment) {
          setSentiment((prev) => ({ ...prev, ...nData.overallSentiment }))
        }
      }

      // 3. Positions
      const pRes = await fetch('/api/mexc/events/positions')
      if (pRes.ok) {
        const pData = await pRes.json()
        if (pData.openPositions) setOpenPositions(pData.openPositions)
        if (pData.closedPositions && pData.closedPositions.length > 0) {
          setClosedPositions(pData.closedPositions)
        }
      }
    } catch (e) {
      console.warn('Network sync notice:', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Live Price Ticker simulation between polls
  useEffect(() => {
    const pInterval = setInterval(() => {
      setCurrentPrice((prev) => {
        const delta = (Math.random() - 0.49) * 4.5
        return Math.max(64000, Math.min(72000, prev + delta))
      })
    }, 1500)
    return () => clearInterval(pInterval)
  }, [])

  // Order Execution Function
  const executeOrder = async (direction: 'LONG' | 'SHORT', isAuto: boolean = false) => {
    const currentPayoutVal = direction === 'LONG' ? upPayout : downPayout

    // Payout Ratio Gatekeeper Check
    if (currentPayoutVal < payoutFilter) {
      const msg =
        language === 'ar'
          ? `تم استبعاد الصفقة بواسطة الفلتر: نسبة العائد (${currentPayoutVal}%) أقل من الشرط المطلوب (${payoutFilter}%).`
          : `Trade Dropped by Gatekeeper: Current Payout (${currentPayoutVal}%) is lower than threshold (${payoutFilter}%).`
      setNotification(msg)
      setTimeout(() => setNotification(null), 4000)
      return
    }

    if (availBalance < amount) {
      const msg = language === 'ar' ? 'الرصيد المتاح غير كافٍ لتنفيذ الصفقة' : 'Insufficient available balance'
      setNotification(msg)
      setTimeout(() => setNotification(null), 4000)
      return
    }

    try {
      const res = await fetch('/api/mexc/events/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTC/USDT',
          direction,
          amount,
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
        setAvailBalance((prev) => Math.max(0, prev - amount))
        const msg =
          language === 'ar'
            ? `✓ تم فتح مركز ${direction === 'LONG' ? 'صعود (LONG)' : 'هبوط (SHORT)'} بقيمة $${amount} بنجاح!`
            : `✓ Opened ${direction} position for $${amount} successfully!`
        setNotification(msg)
        setTimeout(() => setNotification(null), 4000)
      } else {
        setNotification(data.error || 'Failed to place order')
        setTimeout(() => setNotification(null), 4000)
      }
    } catch (e: any) {
      setNotification(e.message || 'Execution error')
      setTimeout(() => setNotification(null), 4000)
    }
  }

  // Auto-Trading background loop simulation
  const autoTradeRef = useRef<boolean>(isAutoRunning)
  autoTradeRef.current = isAutoRunning

  useEffect(() => {
    if (!isAutoRunning) return

    const loop = setInterval(() => {
      if (!autoTradeRef.current) return

      // AI Trading Logic:
      // Executes only if Payout >= filter AND Sentiment matches
      const isBullish = sentiment.score >= 70
      const direction: 'LONG' | 'SHORT' = isBullish ? 'LONG' : 'SHORT'
      const payoutVal = direction === 'LONG' ? upPayout : downPayout

      if (payoutVal >= payoutFilter) {
        executeOrder(direction, true)
      }
    }, 18000)

    return () => clearInterval(loop)
  }, [isAutoRunning, sentiment, upPayout, downPayout, payoutFilter, amount, availBalance, duration, candle])

  const toggleAutoTrading = () => {
    setIsAutoRunning((prev) => {
      const next = !prev
      const msg = next
        ? language === 'ar'
          ? '▶ تم تشغيل نظام التداول التلقائي السحابي على مدار الساعة'
          : '▶ Automated 24/7 Cloud Trading Engine Activated'
        : language === 'ar'
        ? '⏹ تم إيقاف التداول التلقائي'
        : '⏹ Automated Trading Paused'
      setNotification(msg)
      setTimeout(() => setNotification(null), 3500)
      return next
    })
  }

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#07090e] text-[#eaecef] font-sans antialiased flex justify-center selection:bg-[#00c087] selection:text-black"
    >
      <div className="w-full max-w-[480px] min-h-screen bg-[#090c12] flex flex-col border-x border-[#1a202c] shadow-2xl relative">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto">
          {/* Top Status & Language Bar */}
          <TopHeader
            language={language}
            onToggleLanguage={toggleLanguage}
            currentNews={newsList[0]}
            sentiment={sentiment}
          />

          {/* Toast Notification Banner */}
          {notification && (
            <div className="w-full bg-[#182520] border border-[#00c087]/70 text-[#00c087] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between shadow-[0_0_12px_rgba(0,192,135,0.25)] animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{notification}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white text-xs">
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
              {/* Pair Title & AI Auto-Trader Toggle Sub-header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 cursor-pointer">
                  <span className="text-base font-bold text-white tracking-wide">
                    {language === 'ar' ? 'BTCUSDT ▾' : 'BTCUSDT ▾'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ({language === 'ar' ? 'بيتكوين-تيدر' : 'Bitcoin'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    onClick={toggleAutoTrading}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer border transition-all text-xs font-bold ${
                      isAutoRunning
                        ? 'bg-[#00c087]/20 border-[#00c087] text-[#00c087] shadow-[0_0_10px_rgba(0,192,135,0.3)]'
                        : 'bg-[#18202c] border-[#2c3748] text-gray-400'
                    }`}
                  >
                    <Sparkles size={13} className={isAutoRunning ? 'animate-spin' : ''} />
                    <span className="text-[11px]">{t.aiAutoTrader}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isAutoRunning ? 'bg-[#00c087] text-black' : 'bg-[#2b3544] text-gray-300'
                      }`}
                    >
                      {isAutoRunning ? t.on : t.off}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Sentiment Banner */}
              <div className="w-full bg-[#101923] border border-[#1b2b3a] rounded-lg px-3 py-1.5 flex items-center justify-between text-xs shadow-inner">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#00c087] animate-pulse" />
                  <span className="text-[#00c087] font-semibold text-[11px]">
                    {language === 'ar' ? sentiment.confidenceAr : sentiment.confidence}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {language === 'ar' ? 'تأكيد ٨٤%' : '84% Match'}
                </span>
              </div>

              {/* Candlestick & Indicator Chart */}
              <EventFuturesChart
                language={language}
                timeframe={candle}
                currentPrice={currentPrice}
                upPayout={upPayout}
                downPayout={downPayout}
              />

              {/* Auto-Trade Configuration & Action Panel */}
              <AutoTradePanel
                language={language}
                duration={duration}
                setDuration={setDuration}
                candle={candle}
                setCandle={setCandle}
                payoutFilter={payoutFilter}
                setPayoutFilter={setPayoutFilter}
                amount={amount}
                setAmount={setAmount}
                availBalance={availBalance}
                isAutoRunning={isAutoRunning}
                onToggleAutoTrading={toggleAutoTrading}
                onManualTrade={(dir) => executeOrder(dir, false)}
                currentPayout={upPayout}
              />

              {/* Positions & News Feeds */}
              <PositionsPanel
                language={language}
                openPositions={openPositions}
                closedPositions={closedPositions}
                newsList={newsList}
              />
            </>
          )}
        </main>

        {/* Persistent Bottom Bar */}
        <BottomNav
          language={language}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />
      </div>
    </div>
  )
}
