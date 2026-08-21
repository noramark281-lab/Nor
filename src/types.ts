export type Language = 'ar' | 'en'

export type TradeDuration = '10m' | '30m' | '1H' | '1D'

export type AnalysisCandle = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'

export type PayoutFilter = 75 | 80 | 85

export type TradeDirection = 'LONG' | 'SHORT'

export type CandleTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export type MinPayoutThreshold = 70 | 75 | 80 | 85 | 90

export interface EventPosition {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  amount: number
  entryPrice: number
  settlementPrice?: number
  payoutRatio: number
  minRequiredPayout: number
  duration: TradeDuration
  analysisCandle: AnalysisCandle
  createdAt: string
  expiresAt: string
  expiryMinutes: number
  isAuto: boolean
  status: 'OPEN' | 'WON' | 'LOST' | 'EXPIRED'
  pnl?: number
  engine?: string
}

export interface EventTrade {
  id: string
  symbol: string
  direction: TradeDirection
  amount: number
  entryPrice: number
  targetPayout: number
  minPayoutThreshold: MinPayoutThreshold
  duration: TradeDuration
  candleTimeframe: CandleTimeframe
  timestamp: number
  expiresAt: number
  status: 'ACTIVE' | 'WON' | 'LOST' | 'CANCELLED'
  payoutAmount: number
  pnl: number
  sentimentScoreAtEntry: number
  txHash?: string
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketData {
  symbol: string
  price: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
  longPayoutRatio: number
  shortPayoutRatio: number
  targetSettlementTime: string
  orderbook: {
    bids: [number, number][]
    asks: [number, number][]
  }
}

export interface SentimentSignal {
  score: number // 0 to 100
  direction: TradeDirection
  strength: 'STRONG' | 'MODERATE' | 'WEAK'
  confidence: number
  payoutProbability: number
  recommendedDuration: TradeDuration
  summary: string
  summaryAr: string
  catalysts: {
    title: string
    titleAr: string
    impact: 'HIGH' | 'MEDIUM' | 'LOW'
    source: string
    time: string
    score: number
  }[]
  macroFactors: {
    factor: string
    factorAr: string
    sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    description: string
    descriptionAr: string
    weight: number
  }[]
  technicalConfluence: {
    rsi14: number
    rsiStatus: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'
    macd: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NEUTRAL'
    emaTrend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS'
    volumeFlow: 'ACCUMULATION' | 'DISTRIBUTION' | 'NORMAL'
    orderbookImbalance: number
  }
  keyActionRecommendation: string
  keyActionRecommendationAr: string
  timestamp: number
}

export interface BotConfig {
  isRunning: boolean
  isAutoExecuting: boolean
  minPayoutThreshold: MinPayoutThreshold
  defaultTradeAmount: number
  selectedDuration: TradeDuration
  selectedCandle: CandleTimeframe
  symbol: string
  maxDailyTrades: number
  stopLossMaxDrawdownPercent: number
  consecutiveLossLimit: number
  enableGcpEngine: boolean
  executionEngine: 'GCP_CLOUD_RUN' | 'LOCAL_BROWSER' | 'EDGE_WORKER'
}

export interface BotStatus {
  totalTrades: number
  wonTrades: number
  lostTrades: number
  winRate: number
  totalPnl: number
  currentDailyDrawdown: number
  lastActionTime: number
  statusMessage: string
  statusMessageAr: string
  gcpStatus: 'CONNECTED' | 'DISCONNECTED' | 'STANDBY'
  mexcApiStatus: 'CONNECTED' | 'AUTHENTICATING' | 'KEY_REQUIRED' | 'INVALID_KEY'
}

export interface AccountBalance {
  usdtAvailable: number
  usdtLocked: number
  estimatedTotalUsd: number
  dailyProfitUsd: number
  isRealKeysLoaded: boolean
  keyType: 'FUTURES_TRADING' | 'READ_ONLY_AUDIT' | 'TESTNET_SIMULATED'
}

export interface MexcCredentials {
  apiKey: string
  apiSecret: string
  blockpitApiKey?: string
  blockpitApiSecret?: string
  isEncryptedInStorage: boolean
  lastValidated?: number
}

export interface NewsItem {
  id: string
  title: string
  titleAr: string
  source: string
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL_BULLISH'
  score: number
  time: string
  category: string
}

export interface AISentimentState {
  score: number
  confidence: string
  confidenceAr: string
  direction: 'BULLISH' | 'BEARISH'
  riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK'
}

export interface WalletBalance {
  asset: string
  free: string
  locked: string
  usdValue: number
}

export interface AppSettings {
  api_key?: string | null
  api_secret?: string | null
  trade_amount: number
  selected_symbol: string
  bot_strategy: string
  bot_running: boolean
  trailing_stop_percent: number
  min_volume_usdt: number
  auto_dust_sweep: boolean
  cooldown_seconds: number
}

export type Screen = 'home' | 'trading' | 'bot' | 'scanner' | 'history' | 'settings' | 'futures' | 'wallets'

