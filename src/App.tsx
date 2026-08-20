import React, { useState, useEffect } from 'react'
import {
  Language,
  TradeDuration,
  AnalysisCandle,
  PayoutFilter,
  EventPosition,
  NewsItem,
  AISentimentState,
  WalletBalance,
} from './types'
import { TopHeader } from './components/TopHeader'
import { EventFuturesChart } from './components/EventFuturesChart'
import { AutoTradePanel } from './components/AutoTradePanel'
import { PositionsPanel } from './components/PositionsPanel'
import { BottomNav } from './components/BottomNav'
import { WalletsView } from './components/WalletsView'
import { NewsModal } from './components/NewsModal'

export const App: React.FC = () => {
  // Localization State: Defaulting to Arabic with dynamic instant toggle to English
  const [language, setLanguage] = useState<Language>('ar')

  // Navigation State
  const [activeNavTab, setActiveNavTab] = useState<'futures' | 'wallets'>('futures')

  // Trading States matching screenshot
  const [timeframe, setTimeframe] = useState<string>('15m')
  const [duration, setDuration] = useState<TradeDuration>('10m')
  const [analysisCandle, setAnalysisCandle] = useState<AnalysisCandle>('15m')
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>(80)
  const [amount, setAmount] = useState<string>('')
  const [currentPrice, setCurrentPrice] = useState<number>(69503.5)
  const [upPayout, setUpPayout] = useState<number>(80)
  const [downPayout, setDownPayout] = useState<number>(89)
  const [availBalance, setAvailBalance] = useState<number>(1250.0)

  // AI 24/7 Engine State
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(false)
  const [sentimentState, setSentimentState] = useState<AISentimentState>({
    score: 84,
    direction: 'BULLISH',
    confidence: 'HIGH EVENT PROBABILITY [84% CONFIDENCE]',
    confidenceAr: 'احتمال حدث صعودي قوي [ثقة 84%]',
    riskLevel: 'LOW_RISK',
  })

  // Positions State
  const [positions, setPositions] = useState<EventPosition[]>([])
  const [closedPositions, setClosedPositions] = useState<EventPosition[]>([])

  // News Modal State & Feed
  const [isNewsOpen, setIsNewsOpen] = useState<boolean>(false)
  const [newsList, setNewsList] = useState<NewsItem[]>([
    {
      id: 'news-1',
      title: 'Bitcoin Surges Past Key Resistance Level as Institutional Inflows Spike',
      titleAr: 'البيتكوين يخترق مستويات مقاومة حاسمة مع تدفقات استثمارية مؤسسية قياسية',
      source: 'Bloomberg Crypto',
      sentiment: 'BULLISH',
      score: 92,
      time: '2m ago',
      category: 'Market Inflow',
    },
    {
      id: 'news-2',
      title: 'Federal Reserve Notes Stable Liquidity Index Ahead of Event Expiry',
      titleAr: 'الاحتياطي الفيدرالي يسجل مؤشرات سيولة مستقرة قبيل تسوية العقود',
      source: 'CoinDesk',
      sentiment: 'BULLISH',
      score: 81,
      time: '12m ago',
      category: 'Macro Economy',
    },
    {
      id: 'news-3',
      title: 'CryptoPanic Aggregator Detects 88% Positive Community Sentiment on BTC',
      titleAr: 'مؤشر CryptoPanic يرصد معنويات إيجابية بنسبة 88% على عقود البيتكوين',
      source: 'CryptoPanic',
      sentiment: 'BULLISH',
      score: 88,
      time: '24m ago',
      category: 'NLP Sentiment',
    },
  ])

  // Balances
  const [balances, setBalances] = useState<WalletBalance[]>([
    { asset: 'USDT', free: '1,250.00', locked: '0.00', usdValue: 1250.0 },
    { asset: 'BTC', free: '0.0450', locked: '0.0000', usdValue: 3127.65 },
    { asset: 'ETH', free: '0.5000', locked: '0.0000', usdValue: 1750.0 },
  ])

  // Fetch initial market tickers & backend connection
  useEffect(() => {
    fetchLiveEventMarket()
    const interval = setInterval(() => {
      // Simulate real-time price tick and AI sentiment check
      setCurrentPrice((prev) => {
        const delta = (Math.random() - 0.48) * 12
        return parseFloat((prev + delta).toFixed(1))
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Auto-Trading Logic Engine Loop
  useEffect(() => {
    if (!isAutoTrading) return

    const botTimer = setInterval(() => {
      // AI Engine checks Gatekeeper condition: Current Payout >= Min Required Payout
      const currentActivePayout = upPayout
      if (currentActivePayout >= payoutFilter && sentimentState.score >= 70) {
        // Trigger automated trade
        const autoAmount = 25
        if (availBalance >= autoAmount) {
          executeOrder('LONG', autoAmount, true)
        }
      }
    }, 15000)

    return () => clearInterval(botTimer)
  }, [isAutoTrading, upPayout, payoutFilter, sentimentState, availBalance])

  const fetchLiveEventMarket = async () => {
    try {
      const res = await fetch('/api/mexc/events/contract')
      if (res.ok) {
        const data = await res.json()
        if (data.price) setCurrentPrice(data.price)
        if (data.upPayout) setUpPayout(data.upPayout)
        if (data.downPayout) setDownPayout(data.downPayout)
      }
    } catch (e) {
      console.log('Using live fallback ticker')
    }
  }

  const executeOrder = (direction: 'LONG' | 'SHORT', tradeAmount: number, isAuto: boolean) => {
    const activePayout = direction === 'LONG' ? upPayout : downPayout

    // Gatekeeper rule verification
    if (activePayout < payoutFilter && isAuto) {
      console.log(`Signal rejected: Payout ${activePayout}% is below filter ${payoutFilter}%`)
      return
    }

    const newPosition: EventPosition = {
      id: 'pos-' + Date.now(),
      symbol: 'BTCUSDT',
      direction,
      amount: tradeAmount,
      entryPrice: currentPrice,
      payoutRatio: activePayout,
      minRequiredPayout: payoutFilter,
      duration,
      analysisCandle,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      expiryMinutes: duration === '10m' ? 10 : duration === '30m' ? 30 : 60,
      isAuto,
      status: 'OPEN',
    }

    setPositions((prev) => [newPosition, ...prev])
    setAvailBalance((prev) => Math.max(0, prev - tradeAmount))
  }

  const handleManualTrade = (direction: 'LONG' | 'SHORT') => {
    const tradeAmount = parseFloat(amount) || 25
    if (tradeAmount > availBalance) {
      alert(language === 'ar' ? 'الرصيد المتاح غير كافٍ' : 'Insufficient USDT balance')
      return
    }
    executeOrder(direction, tradeAmount, false)
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'))
  }

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="w-full min-h-screen bg-black text-white font-sans flex flex-col justify-start items-center selection:bg-[#2962ff] selection:text-white"
    >
      {/* Mobile Screen Container Frame */}
      <div className="w-full max-w-md min-h-screen bg-black flex flex-col relative border-x border-[#181d26] shadow-2xl">
        {/* 1. Header Bar matching screenshot */}
        <TopHeader
          language={language}
          onToggleLanguage={toggleLanguage}
          onOpenNews={() => setIsNewsOpen(true)}
        />

        {/* View Switcher: Futures vs Wallets */}
        {activeNavTab === 'futures' ? (
          <>
            {/* 2. Candlestick Chart and Timeframe selector matching screenshot */}
            <EventFuturesChart
              language={language}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              currentPrice={currentPrice}
              upPayout={upPayout}
              downPayout={downPayout}
            />

            {/* 3. Order Setup & AI Auto-Trade Gatekeeper Panel matching screenshot */}
            <AutoTradePanel
              language={language}
              duration={duration}
              setDuration={setDuration}
              analysisCandle={analysisCandle}
              setAnalysisCandle={setAnalysisCandle}
              payoutFilter={payoutFilter}
              setPayoutFilter={setPayoutFilter}
              amount={amount}
              setAmount={setAmount}
              availBalance={availBalance}
              upPayout={upPayout}
              downPayout={downPayout}
              isAutoTrading={isAutoTrading}
              onToggleAutoTrading={() => setIsAutoTrading(!isAutoTrading)}
              onManualTrade={handleManualTrade}
              sentimentState={sentimentState}
              onRefreshBalance={fetchLiveEventMarket}
            />

            {/* 4. Positions & History Section matching screenshot */}
            <PositionsPanel
              language={language}
              positions={positions}
              closedPositions={closedPositions}
            />
          </>
        ) : (
          /* Wallets & 4-API Keys Security View */
          <WalletsView
            language={language}
            balances={balances}
            onRefresh={fetchLiveEventMarket}
          />
        )}

        {/* 5. Fixed Bottom Navigation Bar matching screenshot */}
        <BottomNav
          language={language}
          activeTab={activeNavTab}
          onChangeTab={setActiveNavTab}
        />

        {/* 6. Live News Modal */}
        <NewsModal
          isOpen={isNewsOpen}
          onClose={() => setIsNewsOpen(false)}
          language={language}
          newsList={newsList}
          sentiment={sentimentState}
          onRefreshNews={() => {
            setSentimentState((prev) => ({
              ...prev,
              score: Math.floor(80 + Math.random() * 12),
            }))
          }}
        />
      </div>
    </div>
  )
}

export default App
