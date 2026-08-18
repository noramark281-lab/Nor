export const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'BNBUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'SUIUSDT',
  'PEPEUSDT',
  'MXUSDT',
]

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d']

export const STRATEGIES: Record<string, { label: string; desc: string; icon: string }> = {
  ai_news_sentiment: {
    label: 'الذكاء الاصطناعي الإخباري (AI News Sentiment)',
    desc: 'مسح آلي للأخبار وتحليل المشاعر الفوري للدخول مع زخم الأخبار الإيجابية القوية',
    icon: 'Sparkles',
  },
  liquidity_scanner: {
    label: 'فلتر السيولة والنشاط (Volume & Liquidity Filter)',
    desc: 'تداول تلقائي في العملات ذات الحجم > 1M$ والتذبذب العالي لمنع التجميد',
    icon: 'Flame',
  },
  scalping_trailing: {
    label: 'المضاربة السريعة + الوقف المتحرك (Trailing Stop)',
    desc: 'دخول سريع وخروج بربح أو تفعيل وقف متحرك بنسبة 1.5% لحماية رأس المال',
    icon: 'TrendingUp',
  },
  multi_layer_pro: {
    label: 'النظام المتكامل متعدد الطبقات (Multi-Layer Pro)',
    desc: 'دمج التحليل الإخباري + فحص السيولة + إدارة الوقف المتحرك وفك التجميد',
    icon: 'Bot',
  },
  rsi_reversal: {
    label: 'مؤشر القوة النسبية (RSI Oversold/Overbought)',
    desc: 'اقتناص ارتدادات القيعان والبيع عند التشبع الشرائي',
    icon: 'Activity',
  },
}

export const MIN_TRADE_AMOUNT = 1.0
export const DEFAULT_TRADE_AMOUNT = 1.0
export const MAX_TRADE_AMOUNT = 500.0
export const MAX_DAILY_TRADES = 50
export const DEFAULT_TRAILING_STOP_PERCENT = 1.8
export const MIN_VOLUME_FILTER = 1000000 // $1,000,000

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
  blue: '#2B6CB0',
}
