// ═══════════════════════════════════════════════════════════════════
// MEXC API Compliance & Rate Limiting Manager (WebSocket + Cooldown)
// Prevents high-frequency spamming & IP rate limit bans
// ═══════════════════════════════════════════════════════════════════

export class RateLimiter {
  private lastRequestTime = 0
  private cooldownMs = 1500 // 1.5 seconds cooldown between trading orders
  private requestCountLastMinute = 0
  private minuteResetTimer: any = null

  constructor() {
    this.startMinuteReset()
  }

  private startMinuteReset() {
    if (typeof window !== 'undefined') {
      this.minuteResetTimer = setInterval(() => {
        this.requestCountLastMinute = 0
      }, 60000)
    }
  }

  public async acquireOrderSlot(): Promise<boolean> {
    const now = Date.now()
    const elapsed = now - this.lastRequestTime

    if (elapsed < this.cooldownMs) {
      const waitTime = this.cooldownMs - elapsed
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
    this.requestCountLastMinute++
    return true
  }

  public getStatus() {
    return {
      cooldownMs: this.cooldownMs,
      requestsThisMinute: this.requestCountLastMinute,
      maxAllowedPerMinute: 60,
      isCompliant: true,
      lastRequestAgoMs: Date.now() - this.lastRequestTime,
    }
  }

  public setCooldown(ms: number) {
    this.cooldownMs = Math.max(500, ms)
  }
}

export const rateLimiter = new RateLimiter()

/**
 * WebSocket Streaming Manager for MEXC Spot Tickers
 */
export class MexcWebSocketManager {
  private ws: WebSocket | null = null
  private subscribers: Map<string, (price: number) => void> = new Map()
  private isConnected = false

  public connect() {
    if (typeof window === 'undefined') return
    try {
      this.ws = new WebSocket('wss://wbs.mexc.com/ws')

      this.ws.onopen = () => {
        this.isConnected = true
        // Subscribe to public miniTicker or specific tickers
        const subMsg = {
          method: 'SUBSCRIPTION',
          params: ['spot@public.deals.v3.api@BTCUSDT', 'spot@public.deals.v3.api@ETHUSDT', 'spot@public.deals.v3.api@SOLUSDT'],
        }
        this.ws?.send(JSON.stringify(subMsg))
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.s && data.d?.deals?.[0]?.p) {
            const sym = data.s
            const p = parseFloat(data.d.deals[0].p)
            const cb = this.subscribers.get(sym)
            if (cb) cb(p)
          }
        } catch {}
      }

      this.ws.onclose = () => {
        this.isConnected = false
      }

      this.ws.onerror = () => {
        this.isConnected = false
      }
    } catch {}
  }

  public subscribe(symbol: string, callback: (price: number) => void) {
    this.subscribers.set(symbol, callback)
    if (!this.isConnected) {
      this.connect()
    }
  }

  public unsubscribe(symbol: string) {
    this.subscribers.delete(symbol)
  }
}

export const mexcWs = new MexcWebSocketManager()
