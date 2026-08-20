export type Language = 'ar' | 'en'

export type TradeDuration = '10m' | '30m' | '1H' | '1D'

export type AnalysisCandle = '1m' | '5m' | '15m' | '1h' | '4h' | '1D'

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
  status: 'OPEN' | 'WON' | 'LOST' | 'EXPIRED'
  pnl?: number
  engine?: string
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
