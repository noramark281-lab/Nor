import { mexcApi } from './supabase'

export type Signal = 'BUY' | 'SELL' | null

export async function executeStrategy(
  strategy: string,
  symbol: string,
): Promise<Signal> {
  try {
    const klines = await mexcApi.getKlines(symbol, '1m', '50')
    if (!Array.isArray(klines) || klines.length < 3) return null

    switch (strategy) {
      case 'scalping':
        return strategyScalping(klines)
      case 'mean_reversion':
        return strategyMeanReversion(klines)
      case 'rsi':
        return strategyRSI(klines)
      case 'trend_following':
        return strategyTrendFollowing(klines)
      case 'random':
        return Math.random() > 0.5 ? 'BUY' : 'SELL'
      default:
        return strategyScalping(klines)
    }
  } catch (e) {
    console.error('Strategy error:', e)
    return null
  }
}

function strategyScalping(klines: any[]): Signal {
  const c1 = parseFloat(klines[klines.length - 3][4])
  const c2 = parseFloat(klines[klines.length - 2][4])
  const c3 = parseFloat(klines[klines.length - 1][4])
  const o1 = parseFloat(klines[klines.length - 3][1])
  const o2 = parseFloat(klines[klines.length - 2][1])
  const o3 = parseFloat(klines[klines.length - 1][1])

  const ch1 = (c1 - o1) / o1 * 100
  const ch2 = (c2 - o2) / o2 * 100
  const ch3 = (c3 - o3) / o3 * 100

  if (ch1 > 0.05 && ch2 > 0.05 && ch3 > 0.05) return 'BUY'
  if (ch1 < -0.05 && ch2 < -0.05 && ch3 < -0.05) return 'SELL'
  return null
}

function strategyMeanReversion(klines: any[]): Signal {
  if (klines.length < 20) return null
  const closes = klines.slice(-20).map((k) => parseFloat(k[4]))
  const avg = closes.reduce((a, b) => a + b, 0) / closes.length
  const current = closes[closes.length - 1]
  const deviation = ((current - avg) / avg) * 100

  if (deviation < -0.5) return 'BUY'
  if (deviation > 0.5) return 'SELL'
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

  if (rsi < 30) return 'BUY'
  if (rsi > 70) return 'SELL'
  return null
}

function strategyTrendFollowing(klines: any[]): Signal {
  if (klines.length < 21) return null
  const closes = klines.map((k) => parseFloat(k[4]))
  const maShort = closes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const maLong = closes.slice(-20).reduce((a, b) => a + b, 0) / 20
  const prevMaShort = closes.slice(-6, -1).reduce((a, b) => a + b, 0) / 5
  const prevMaLong = closes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20

  if (prevMaShort <= prevMaLong && maShort > maLong) return 'BUY'
  if (prevMaShort >= prevMaLong && maShort < maLong) return 'SELL'
  return null
}
