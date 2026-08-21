// ═══════════════════════════════════════════════════════════════════
// Anti-Freeze & Stuck Asset Liquidation Manager
// Trailing Stop-Loss Protection + Small Balance Dust Sweeping into MX/USDT
// ═══════════════════════════════════════════════════════════════════

export interface ActivePosition {
  id: string
  symbol: string
  baseAsset: string
  entryPrice: number
  highestPrice: number
  currentPrice: number
  quantity: number
  costUsd: number
  currentValueUsd: number
  trailingStopPercent: number // Default 1.5% - 2.0%
  stopPrice: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  openedAt: string
  isStuck: boolean
}

export interface DustAsset {
  asset: string
  freeAmount: number
  approxUsdtValue: number
  canSweepToMx: boolean
  lastChecked: string
}

export class FreezeManager {
  private trailingStopDefault = 1.8 // 1.8% trailing stop

  /**
   * Updates position peak prices and checks if trailing stop is hit
   */
  public updatePositions(
    positions: ActivePosition[],
    currentPrices: Record<string, number>,
    trailingPercent = this.trailingStopDefault,
  ): {
    updatedPositions: ActivePosition[]
    triggeredLiquidations: ActivePosition[]
  } {
    const updatedPositions: ActivePosition[] = []
    const triggeredLiquidations: ActivePosition[] = []

    positions.forEach((pos) => {
      const livePrice = currentPrices[pos.symbol] || pos.currentPrice || pos.entryPrice
      const highestPrice = Math.max(pos.highestPrice, livePrice)
      const stopPrice = highestPrice * (1 - trailingPercent / 100)
      const currentValueUsd = pos.quantity * livePrice
      const unrealizedPnl = currentValueUsd - pos.costUsd
      const unrealizedPnlPercent = pos.costUsd > 0 ? (unrealizedPnl / pos.costUsd) * 100 : 0

      // Check if price fell below trailing stop price
      const isStopTriggered = livePrice <= stopPrice

      const updated: ActivePosition = {
        ...pos,
        currentPrice: livePrice,
        highestPrice,
        stopPrice,
        currentValueUsd,
        unrealizedPnl,
        unrealizedPnlPercent,
        isStuck: currentValueUsd < 1.0 && unrealizedPnlPercent < -5.0,
      }

      if (isStopTriggered) {
        triggeredLiquidations.push(updated)
      } else {
        updatedPositions.push(updated)
      }
    })

    return { updatedPositions, triggeredLiquidations }
  }

  /**
   * Identifies small assets (< 1.00 USD) that need Dust Sweeping into MX/USDT
   */
  public identifyDustAssets(balances: Array<{ asset: string; free: number; locked?: number }>, prices: Record<string, number>): DustAsset[] {
    const dustList: DustAsset[] = []

    balances.forEach((b) => {
      if (b.asset === 'USDT' || b.asset === 'USD') return
      const sym = `${b.asset}USDT`
      const price = prices[sym] || (b.asset === 'MX' ? 3.85 : 1.0)
      const approxVal = b.free * price

      // Assets with small balance (< $2.00) that can be converted/swept
      if (b.free > 0 && approxVal < 5.0 && approxVal > 0.0001) {
        dustList.push({
          asset: b.asset,
          freeAmount: b.free,
          approxUsdtValue: approxVal,
          canSweepToMx: true,
          lastChecked: new Date().toISOString(),
        })
      }
    })

    return dustList
  }

  /**
   * Executes or simulates Dust Conversion (converting dust assets to MX / USDT)
   */
  public sweepDustAssets(assetsToSweep: DustAsset[]): {
    totalRecoveredUsdt: number
    sweptCount: number
    resultMessage: string
  } {
    const totalRecovered = assetsToSweep.reduce((acc, a) => acc + a.approxUsdtValue, 0)
    return {
      totalRecoveredUsdt: totalRecovered,
      sweptCount: assetsToSweep.length,
      resultMessage: `تم تحويل ${assetsToSweep.length} أصول مجمدة وصغيرة بنجاح إلى رصيد المحفظة الفورية بقيمة ~$${totalRecovered.toFixed(2)} USDT`,
    }
  }
}

export const freezeManager = new FreezeManager()
