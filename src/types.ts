export type Language = 'en' | 'ar'

export type TradeDuration = '10m' | '30m'
export type AnalysisCandle = '1m' | '5m' | '15m'
export type PayoutFilter = 75 | 80 | 85

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
  status: 'OPEN' | 'WON' | 'LOST'
  pnl?: number
  engine?: string
}

export interface NewsItem {
  id: string
  title: string
  titleAr: string
  source: string
  sentiment: string
  score: number
  time: string
  category: string
}

export interface AISentimentState {
  score: number
  confidence: string
  confidenceAr: string
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  summary?: string
  summaryAr?: string
  riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK'
}

export interface EventContractState {
  symbol: string
  pairAr: string
  indexPrice: number
  upPayout: number
  downPayout: number
  availableExpirations: TradeDuration[]
  availableCandles: AnalysisCandle[]
  allowedPayoutFilters: PayoutFilter[]
  serverStatus: string
  accountType: string
}
