import { mexcApi } from './supabase'
import { newsSentimentEngine } from './news_sentiment'
import { marketScanner } from './scanner'

export type Signal = 'BUY' | 'SELL' | null

export interface StrategyEvaluationResult {
  signal: Signal
  recommendedSymbol: string
  reason: string
  confidence: number
  metadata?: Record<string, any>
}

export async function evaluateAdvancedStrategy(
  strategyName: string,
  selectedSymbol = 'BTCUSDT',
): Promise<StrategyEvaluationResult> {
  try {
    // 1. Multi-Layer Pro Strategy
    if (strategyName === 'multi_layer_pro' || strategyName === 'ai_news_sentiment') {
      const news = await newsSentimentEngine.fetchLatestNews()
      const overall = newsSentimentEngine.getOverallMarketSentiment()

      // Find if any specific high positive news exists for hot pairs
      const topBullishNews = news.find((n) => n.sentiment === 'POSITIVE' && n.score >= 60)
      if (topBullishNews && topBullishNews.symbols.length > 0) {
        const targetSymbol = `${topBullishNews.symbols[0]}USDT`
        return {
          signal: 'BUY',
          recommendedSymbol: targetSymbol,
          reason: `زخم إخباري إيجابي قوي: ${topBullishNews.title.slice(0, 60)}... (ثقة ${topBullishNews.confidence}%)`,
          confidence: topBullishNews.confidence,
          metadata: { newsId: topBullishNews.id, score: topBullishNews.score },
        }
      }

      if (overall.sentiment === 'POSITIVE' && overall.topBullishCoins.length > 0) {
        return {
          signal: 'BUY',
          recommendedSymbol: overall.topBullishCoins[0],
          reason: `تحليل المشاعر العام إيجابي (+${overall.averageScore}%) للعملة القيادية`,
          confidence: 85,
        }
      }
    }

    // 2. Volume & Liquidity Scanner Strategy
    if (strategyName === 'liquidity_scanner' || strategyName === 'multi_layer_pro') {
      const pairs = await marketScanner.scanMarket(1000000, 3.0)
      const topPair = pairs.find((p) => p.priceChangePercent > 2.0 && p.spreadPercent < 0.1)
      if (topPair) {
        return {
          signal: 'BUY',
          recommendedSymbol: topPair.symbol,
          reason: `سيولة مرتفعة ($${(topPair.volume24hUsdt / 1e6).toFixed(1)}M) وتذبذب رابح (+${topPair.priceChangePercent}%)`,
          confidence: 90,
          metadata: { volume: topPair.volume24hUsdt, spread: topPair.spreadPercent },
        }
      }
    }

    // 3. Technical Strategy on Selected Symbol (Klines-based)
    const klines = await mexcApi.getKlines(selectedSymbol, '1m', '40')
    if (Array.isArray(klines) && klines.length >= 10) {
      if (strategyName === 'rsi_reversal' || strategyName === 'rsi') {
        const rsiSignal = strategyRSI(klines)
        if (rsiSignal) {
          return {
            signal: rsiSignal,
            recommendedSymbol: selectedSymbol,
            reason: rsiSignal === 'BUY' ? 'مؤشر RSI في منطقة تشبع بيعي (فرصة ارتداد صاعد)' : 'مؤشر RSI في منطقة تشبع شرائي (جني أرباح)',
            confidence: 78,
          }
        }
      }

      const scalpingSig = strategyScalping(klines)
      if (scalpingSig) {
        return {
          signal: scalpingSig,
          recommendedSymbol: selectedSymbol,
          reason: `مضاربة سريعة مبنية على حركة الشموع اللحظية`,
          confidence: 75,
        }
      }
    }

    return {
      signal: null,
      recommendedSymbol: selectedSymbol,
      reason: 'السوق في حالة ترقب، لا توجد إشارة مطابقة لشروط الدخول الآمن',
      confidence: 50,
    }
  } catch (e: any) {
    return {
      signal: null,
      recommendedSymbol: selectedSymbol,
      reason: `خطأ في محرك الاستراتيجية: ${e?.message || 'غير معروف'}`,
      confidence: 0,
    }
  }
}

export async function executeStrategy(strategy: string, symbol: string): Promise<Signal> {
  const res = await evaluateAdvancedStrategy(strategy, symbol)
  return res.signal
}

function strategyScalping(klines: any[]): Signal {
  if (klines.length < 3) return null
  const c1 = parseFloat(klines[klines.length - 3][4])
  const c2 = parseFloat(klines[klines.length - 2][4])
  const c3 = parseFloat(klines[klines.length - 1][4])
  const o1 = parseFloat(klines[klines.length - 3][1])
  const o2 = parseFloat(klines[klines.length - 2][1])
  const o3 = parseFloat(klines[klines.length - 1][1])

  const ch1 = ((c1 - o1) / o1) * 100
  const ch2 = ((c2 - o2) / o2) * 100
  const ch3 = ((c3 - o3) / o3) * 100

  if (ch1 > 0.05 && ch2 > 0.05 && ch3 > 0.05) return 'BUY'
  if (ch1 < -0.05 && ch2 < -0.05 && ch3 < -0.05) return 'SELL'
  return null
}

function strategyRSI(klines: any[]): Signal {
  if (klines.length < 15) return null
  const closes = klines.slice(-15).map((k) => parseFloat(k[4]))
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) {
      gains.push(change)
      losses.push(0)
    } else {
      gains.push(0)
      losses.push(Math.abs(change))
    }
  }

  const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length
  const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length

  if (avgLoss === 0) return null
  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)

  if (rsi < 32) return 'BUY'
  if (rsi > 68) return 'SELL'
  return null
}
