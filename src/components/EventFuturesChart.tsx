import React, { useEffect, useState, useMemo } from 'react'
import { Language } from '../types'
import { MoreHorizontal } from 'lucide-react'

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
  setTimeframe: (tf: string) => void
  currentPrice: number
  upPayout: number
  downPayout: number
  onOpenSettings?: () => void
}

export const EventFuturesChart: React.FC<EventFuturesChartProps> = ({
  language,
  timeframe,
  setTimeframe,
  currentPrice,
  upPayout,
  downPayout,
  onOpenSettings,
}) => {
  const [candles, setCandles] = useState<Candle[]>([])

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1D', 'Index Price']

  // Generate realistic candles based on current price
  useEffect(() => {
    let base = currentPrice || 69503.5
    const initialCandles: Candle[] = []
    const now = Date.now()

    let p = base - 25
    for (let i = 18; i >= 0; i--) {
      const delta = (Math.random() - 0.49) * 12
      const open = p
      const close = open + delta
      const high = Math.max(open, close) + Math.random() * 8
      const low = Math.min(open, close) - Math.random() * 8
      p = close
      initialCandles.push({
        time: now - i * 60000,
        open,
        high,
        low,
        close,
      })
    }
    // ensure last candle matches currentPrice
    if (initialCandles.length > 0) {
      const last = initialCandles[initialCandles.length - 1]
      last.close = base
      last.high = Math.max(last.high, base + 2.6)
    }
    setCandles(initialCandles)
  }, [timeframe])

  // Periodic subtle tick
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev
        const last = prev[prev.length - 1]
        const delta = (Math.random() - 0.5) * 3
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
  const { minPrice, maxPrice, highMark, svgWidth, svgHeight } = useMemo(() => {
    if (!candles.length) {
      return { minPrice: 69480, maxPrice: 69520, highMark: 69506.1, svgWidth: 380, svgHeight: 150 }
    }
    const highs = candles.map((c) => c.high)
    const lows = candles.map((c) => c.low)
    const minP = Math.min(...lows) - 5
    const maxP = Math.max(...highs) + 5
    return {
      minPrice: minP,
      maxPrice: maxP,
      highMark: Math.max(69506.1, ...highs),
      svgWidth: 380,
      svgHeight: 150,
    }
  }, [candles])

  const getY = (price: number) => {
    const range = maxPrice - minPrice || 1
    return svgHeight - ((price - minPrice) / range) * (svgHeight - 30) - 15
  }

  const currentPriceY = Math.max(15, Math.min(svgHeight - 15, getY(currentPrice)))

  return (
    <div className="flex flex-col w-full bg-black select-none">
      {/* 1. Header: BTCUSDT ▾ and Up: 80% | Down: 80% ••• */}
      <div className="flex items-center justify-between px-2 pt-1 pb-1">
        <div className="flex items-center gap-1 cursor-pointer">
          <span className="text-xl font-bold text-white tracking-tight">BTCUSDT</span>
          <span className="text-gray-400 text-xs">▾</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-300 font-medium">
            <span>Up: <span className="text-[#00c087] font-semibold">{upPayout}%</span></span>
            <span className="text-gray-600">|</span>
            <span>Down: <span className="text-[#00c087] font-semibold">{downPayout}%</span></span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* 2. Candlestick Timeframe Tabs: 1m, 5m, 15m, 1h, 4h, 1D, Index Price */}
      <div className="flex items-center gap-4 px-2 py-1 overflow-x-auto no-scrollbar text-xs font-medium text-gray-400 border-b border-[#1b1e22]/50">
        {timeframes.map((tf) => {
          const isActive = timeframe === tf || (tf === '15m' && timeframe === '15m')
          return (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`relative py-1 whitespace-nowrap transition-colors cursor-pointer ${
                isActive ? 'text-[#2962ff] font-bold' : 'hover:text-gray-200'
              }`}
            >
              <span>{tf}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2962ff] rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>

      {/* 3. Candlestick Chart Area */}
      <div className="relative w-full h-[150px] bg-black overflow-hidden mt-1">
        {/* High price tag peak indicator */}
        <div className="absolute top-1 left-[40%] flex items-center text-[10px] text-gray-400 font-mono pointer-events-none z-10">
          <span>{highMark.toFixed(1)}</span>
          <div className="w-5 h-[1px] bg-gray-500 ml-1"></div>
        </div>

        {/* Real-time horizontal dotted price line */}
        <div
          className="absolute left-0 right-0 border-b border-gray-700/80 border-dashed pointer-events-none z-0"
          style={{ top: `${currentPriceY}px` }}
        ></div>

        {/* Current price badge on the right with white outline */}
        <div
          className="absolute right-0 px-1.5 py-0.5 bg-[#121418] border border-gray-300 rounded text-[11px] text-white font-mono font-medium z-20 shadow-sm"
          style={{ top: `${currentPriceY - 11}px` }}
        >
          {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </div>

        {/* SVG Candlesticks */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Faint watermark MEXC */}
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            fill="#ffffff"
            fillOpacity="0.02"
            fontSize="32"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            MEXC
          </text>

          {/* Candlestick Bars */}
          {candles.map((candle, idx) => {
            const isGreen = candle.close >= candle.open
            const x = (idx / (candles.length - 1)) * (svgWidth - 65) + 20
            const yHigh = getY(candle.high)
            const yLow = getY(candle.low)
            const yOpen = getY(candle.open)
            const yClose = getY(candle.close)
            const bodyTop = Math.min(yOpen, yClose)
            const bodyHeight = Math.max(2, Math.abs(yOpen - yClose))
            const color = isGreen ? '#00c087' : '#f6465d'

            return (
              <g key={idx}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - 3.5}
                  y={bodyTop}
                  width="7"
                  height={bodyHeight}
                  fill={color}
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
