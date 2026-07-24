export const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT',
  'LTCUSDT', 'AVAXUSDT',
]

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']

export const STRATEGIES: Record<string, string> = {
  scalping: 'المضاربة السريعة',
  mean_reversion: 'الارتداد المتوسط',
  rsi: 'مؤشر القوة النسبية (RSI)',
  trend_following: 'اتباع الاتجاه',
  random: 'عشوائي (للاختبار)',
}

export const MAX_TRADE_AMOUNT = 1.0
export const MIN_TRADE_AMOUNT = 1.0
export const MAX_DAILY_TRADES = 50

export const COLORS = {
  bg: '#0B0E11',
  bgCard: '#161A1E',
  bgCardHover: '#1E2329',
  green: '#00C087',
  greenDark: '#009966',
  red: '#FF4D4F',
  redDark: '#CC3D3F',
  textPrimary: '#EAECEF',
  textSecondary: '#848E9C',
  textMuted: '#5E6673',
  border: '#2B3139',
  accent: '#F0B90B',
}
