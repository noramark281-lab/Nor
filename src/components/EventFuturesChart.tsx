import React, { useEffect, useState, useMemo } from 'react'
import { Language } from '../types'
import { getT } from '../lib/translations'

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

interface EventFuturesChartProps {
  language: Language
  timeframe: string
  currentPrice: number
  upPayout: number
  downPayout: number
}

export const EventFuturesChart: React.FC<EventFuturesChartProps> = ({
  language,
  timeframe,
  currentPrice,
  upPayout,
  downPayout,
}) => {
  const t = getT(language)
  const [candles, setCandles] = useState<Candle[]>([])

  // Generate or fetch realistic live candlesticks for BTC/USDT
  useEffect(() => {
    let base = currentPrice || 68023.5
    const initialCandles: Candle[] = []
    const now = Date.now()
    const intervalMs = timeframe === '1m' ? 60000 : timeframe === '15m' ? 900000 : 300000

    let p = base - 350
    for (let i = 24; i >= 0; i--) {
      const delta = (Math.random() - 0.47) * 80
      const open = p
      const close = open + delta
      const high = Math.max(open, close) + Math.random() * 45
      const low = Math.min(open, close) - Math.random() * 45
      p = close
      initialCandles.push({
        time: now - i * intervalMs,
        open,
        high,
        low,
        close,
      })
    }
    setCandles(initialCandles)
  }, [timeframe])

  // Periodic candle tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev
        const last = prev[prev.length - 1]
        const delta = (Math.random() - 0.48) * 15
        const newClose = last.close + delta
        const updatedLast: Candle = {
          ...last,
          close: newClose,
          high: Math.max(last.high, newClose),
          low: Math.min(last.low, newClose),
        }
        return [...prev.slice(0, prev.length - 1), updatedLast]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Calculate SVG bounds
  const { minPrice, maxPrice, highMark, lowMark, svgWidth, svgHeight } = useMemo(() => {
    if (!candles.length) {
      return { minPrice: 64000, maxPrice: 70000, highMark: 69508.1, lowMark: 64253.7, svgWidth: 380, svgHeight: 180 }
    }
    const highs = candles.map((c) => c.high)
    const lows = candles.map((c) => c.low)
    const minP = Math.min(...lows) * 0.998
    const maxP = Math.max(...highs) * 1.002
    return {
      minPrice: minP,
      maxPrice: maxP,
      highMark: Math.max(69508.1, maxP),
      lowMark: Math.min(64253.7, minP),
      svgWidth: 380,
      svgHeight: 180,
    }
  }, [candles])

  const getY = (price: number) => {
    const range = maxPrice - minPrice || 1
    return svgHeight - ((price - minPrice) / range) * (svgHeight - 30) - 15
  }

  // Calculate moving average / Bollinger bands
  const bollingerPoints = useMemo(() => {
    if (candles.length < 5) return []
    return candles.map((c, idx) => {
      const x = (idx / (candles.length - 1)) * (svgWidth - 60) + 10
      const y = getY(c.close)
      return { x, y }
    })
  }, [candles, maxPrice, minPrice])

  const polylineStr = bollingerPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="relative w-full bg-[#0b0e14] rounded-lg border border-[#1e2329] overflow-hidden p-2">
      {/* Chart Top stats overlay */}
      <div className="flex items-center justify-between text-xs px-2 py-1 text-gray-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-bold">BTC/USDT</span>
          <span className="text-[#00c087] font-semibold">{currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400">
            {t.upPayout}: <span className="font-bold">{upPayout}%</span>
          </span>
          <span className="text-rose-400">
            {t.downPayout}: <span className="font-bold">{downPayout}%</span>
          </span>
          <span className="text-gray-400 text-[10px]">MEXC Index</span>
        </div>
      </div>

      {/* Candlestick SVG Container */}
      <div className="relative w-full h-[180px] select-none">
        {/* Top/Bottom Price Labels */}
        <div className="absolute top-1 left-2 text-[10px] text-gray-500 font-mono">
          {highMark.toFixed(1)} ↑
        </div>
        <div className="absolute bottom-1 left-2 text-[10px] text-gray-500 font-mono">
          {lowMark.toFixed(1)} ↓
        </div>

        {/* Current price badge line */}
        <div
          className="absolute right-1 px-1.5 py-0.5 bg-[#00c087]/20 border border-[#00c087] rounded text-[10px] text-[#00c087] font-mono font-bold z-10 flex items-center gap-1 shadow-[0_0_8px_rgba(0,192,135,0.4)]"
          style={{ top: `${Math.max(15, Math.min(145, getY(currentPrice) - 10))}px` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c087] animate-pulse"></span>
          {currentPrice.toFixed(1)}
        </div>

        {/* Background Grid & Watermark */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Subtle horizontal gridlines */}
          <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="#171c24" strokeDasharray="3 3" />
          <line x1="0" y1={svgHeight * 0.5} x2={svgWidth} y2={svgHeight * 0.5} stroke="#1e2329" strokeDasharray="3 3" />
          <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="#171c24" strokeDasharray="3 3" />

          {/* Watermark text */}
          <text x="50%" y="55%" textAnchor="middle" fill="#ffffff" fillOpacity="0.04" fontSize="26" fontWeight="bold" fontFamily="sans-serif">
            MEXC EVENT FUTURES
          </text>

          {/* Bollinger / Trend Line Overlay */}
          {polylineStr && (
            <polyline
              fill="none"
              stroke="#00c087"
              strokeWidth="1.2"
              strokeOpacity="0.7"
              points={polylineStr}
            />
          )}

          {/* Candlestick Bars */}
          {candles.map((candle, idx) => {
            const isGreen = candle.close >= candle.open
            const x = (idx / (candles.length - 1)) * (svgWidth - 65) + 12
            const yHigh = getY(candle.high)
            const yLow = getY(candle.low)
            const yOpen = getY(candle.open)
            const yClose = getY(candle.close)
            const bodyTop = Math.min(yOpen, yClose)
            const bodyHeight = Math.max(2.5, Math.abs(yOpen - yClose))
            const color = isGreen ? '#00c087' : '#f6465d'

            return (
              <g key={idx} className="transition-all duration-300">
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1"
                  strokeOpacity="0.8"
                />
                {/* Candle Body */}
                <rect
                  x={x - 4}
                  y={bodyTop}
                  width="8"
                  height={bodyHeight}
                  fill={color}
                  rx="1"
                />
              </g>
            )
          })}
        </svg>

        {/* Up / Down event indicators inside chart */}
        <div className="absolute top-8 right-14 flex items-center gap-1 text-[10px] text-[#00c087] bg-[#00c087]/10 px-1.5 py-0.5 rounded border border-[#00c087]/30">
          <span>▲</span>
          <span>{language === 'ar' ? 'صعود' : 'Up'}</span>
        </div>
        <div className="absolute bottom-6 right-14 flex items-center gap-1 text-[10px] text-[#f6465d] bg-[#f6465d]/10 px-1.5 py-0.5 rounded border border-[#f6465d]/30">
          <span>▼</span>
          <span>{language === 'ar' ? 'هبوط' : 'Down'}</span>
        </div>
      </div>
    </div>
  )
}
