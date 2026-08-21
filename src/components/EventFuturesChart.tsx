import React, { useState } from 'react'
import { Language } from '../types'
import { ChevronDown, MoreHorizontal, SlidersHorizontal } from 'lucide-react'

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
  const timeframes = ['1m', '5m', '15m', 'Index Price']

  // Candlestick mock sample bars styled identical to MEXC Event Futures
  const candles = [
    { type: 'bull', top: 52, bottom: 25, high: 58, low: 20 },
    { type: 'bear', top: 50, bottom: 35, high: 54, low: 32 },
    { type: 'bull', top: 62, bottom: 34, high: 66, low: 30 },
    { type: 'bear', top: 48, bottom: 32, high: 52, low: 28 },
    { type: 'bull', top: 88, bottom: 18, high: 95, low: 12 }, // Strong green impulse
    { type: 'bear', top: 78, bottom: 58, high: 82, low: 52 },
    { type: 'bear', top: 68, bottom: 48, high: 72, low: 44 },
    { type: 'bull', top: 72, bottom: 54, high: 75, low: 50 },
    { type: 'bear', top: 62, bottom: 42, high: 65, low: 38 },
    { type: 'bear', top: 52, bottom: 32, high: 56, low: 26 },
    { type: 'bull', top: 60, bottom: 38, high: 64, low: 35 },
    { type: 'bull', top: 74, bottom: 44, high: 79, low: 40 },
  ]

  return (
    <div className="w-full bg-black flex flex-col border-b border-[#181d26] select-none">
      {/* Pair Header & Top Payout Ratios */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
        {/* Pair Name - Strictly BTC/USDT */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-white font-black text-base tracking-tight">
            <span>BTC/USDT</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
              {language === 'ar' ? 'عقود الحدث' : 'Event Futures'}
            </span>
          </div>
        </div>

        {/* Payout Ratios & Options Menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-gray-400">{language === 'ar' ? 'صعود:' : 'Up:'}</span>
            <span className="text-[#00c087] font-bold">{upPayout}%</span>
            <span className="text-gray-600 font-mono">|</span>
            <span className="text-gray-400">{language === 'ar' ? 'هبوط:' : 'Down:'}</span>
            <span className="text-[#00c087] font-bold">{downPayout}%</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
            title="Options"
          >
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Timeframe Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-y border-[#181d26] text-xs font-semibold text-gray-400 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3">
          {timeframes.map((tf) => {
            const isActive = timeframe === tf
            return (
              <button
                key={tf}
                id={`tf-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`relative py-1 transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-white font-bold' : 'hover:text-gray-200'
                }`}
              >
                {tf}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#2962ff] rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Candlestick Graphic Box with Price Indicators */}
      <div className="w-full h-44 bg-black relative overflow-hidden flex items-center justify-center p-2">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 grid grid-rows-4 grid-cols-4 pointer-events-none opacity-20">
          <div className="border-b border-gray-700"></div>
          <div className="border-b border-gray-700"></div>
          <div className="border-b border-gray-700"></div>
          <div className="border-b border-gray-700"></div>
        </div>

        {/* High Point Marker matching screenshot (69,506.1) */}
        <div className="absolute top-2 left-1/2 -translate-x-12 flex items-center gap-1 z-10">
          <span className="text-[11px] font-mono text-gray-400 font-medium">69,506.1</span>
          <div className="w-6 h-[1px] bg-gray-500"></div>
          <div className="w-[1px] h-6 bg-gray-500 -ml-1 mt-3"></div>
        </div>

        {/* Horizontal Dashed Price Line & Current Price Box */}
        <div className="absolute top-[58%] left-0 right-0 border-b border-dashed border-gray-600 flex items-center justify-end z-20">
          <div className="bg-[#12161f] border border-gray-300 text-white font-mono text-xs font-bold px-1.5 py-0.5 rounded shadow-lg mr-2">
            {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
        </div>

        {/* Dynamic Candlesticks Render */}
        <div className="w-full h-full flex items-end justify-center gap-2 pb-6 z-0">
          {candles.map((c, idx) => {
            const isGreen = c.type === 'bull'
            return (
              <div key={idx} className="flex flex-col items-center justify-end h-full relative w-3.5">
                {/* Upper Wick */}
                <div
                  className={`w-[1.5px] ${isGreen ? 'bg-[#00c087]' : 'bg-[#f6465d]'}`}
                  style={{ height: `${c.high - c.top}%` }}
                ></div>
                {/* Candle Body */}
                <div
                  className={`w-full rounded-[1px] ${
                    isGreen ? 'bg-[#00c087]' : 'bg-[#f6465d]'
                  }`}
                  style={{ height: `${Math.max(6, c.top - c.bottom)}%` }}
                ></div>
                {/* Lower Wick */}
                <div
                  className={`w-[1.5px] ${isGreen ? 'bg-[#00c087]' : 'bg-[#f6465d]'}`}
                  style={{ height: `${c.bottom - c.low}%` }}
                ></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
