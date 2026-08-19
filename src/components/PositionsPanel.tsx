import React, { useState, useEffect } from 'react'
import { FileText, Clock, TrendingUp, TrendingDown, Radio, ExternalLink } from 'lucide-react'
import { Language, EventPosition, NewsItem } from '../types'
import { getT } from '../lib/translations'

interface PositionsPanelProps {
  language: Language
  openPositions: EventPosition[]
  closedPositions: EventPosition[]
  newsList: NewsItem[]
}

export const PositionsPanel: React.FC<PositionsPanelProps> = ({
  language,
  openPositions,
  closedPositions,
  newsList,
}) => {
  const t = getT(language)
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'news'>('open')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatRemainingTime = (expiresAt: string) => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - now)
    const mins = Math.floor(diff / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col w-full bg-[#12161f] border border-[#1f2632] rounded-xl overflow-hidden mt-1 mb-16 shadow-md">
      {/* Tabs Bar */}
      <div className="flex items-center border-b border-[#1f2632] bg-[#0d1017]">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'open'
              ? 'border-[#00c087] text-[#00c087] bg-[#141a24]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>{t.openPositions}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            {openPositions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('closed')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'closed'
              ? 'border-[#00c087] text-[#00c087] bg-[#141a24]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>{t.closedPositions}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            +{closedPositions.length > 99 ? '99' : closedPositions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'news'
              ? 'border-[#00c087] text-[#00c087] bg-[#141a24]'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Radio size={12} className={activeTab === 'news' ? 'text-[#00c087] animate-pulse' : 'text-gray-500'} />
          <span>{t.newsFeedTab}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-3 min-h-[160px] flex flex-col justify-center">
        {/* 1. Open Positions */}
        {activeTab === 'open' && (
          openPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500 gap-2">
              <div className="w-12 h-12 rounded-xl bg-[#171c26] flex items-center justify-center text-gray-600">
                <FileText size={24} />
              </div>
              <span className="text-xs">{t.noDataFound}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {openPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-[#0b0e14] border border-[#1f2736] rounded-lg p-2.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          pos.direction === 'LONG'
                            ? 'bg-[#00c087]/20 text-[#00c087] border border-[#00c087]/40'
                            : 'bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/40'
                        }`}
                      >
                        {pos.direction === 'LONG' ? '▲ LONG' : '▼ SHORT'}
                      </span>
                      <span className="text-xs font-bold text-gray-200">{pos.symbol}</span>
                      <span className="text-[10px] text-gray-500">[{pos.duration}]</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      <Clock size={11} className="animate-spin" />
                      <span>{formatRemainingTime(pos.expiresAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] pt-1 border-t border-[#171e2b] text-gray-400">
                    <div>
                      <span className="text-[9px] block text-gray-500">{t.amount}:</span>
                      <span className="text-white font-mono font-semibold">${pos.amount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block text-gray-500">{t.entryPriceLabel}:</span>
                      <span className="text-gray-300 font-mono">${pos.entryPrice.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] block text-gray-500">{t.payoutRatio}:</span>
                      <span className="text-emerald-400 font-mono font-bold">{pos.payoutRatio}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 2. Closed Positions */}
        {activeTab === 'closed' && (
          closedPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500 gap-2">
              <div className="w-12 h-12 rounded-xl bg-[#171c26] flex items-center justify-center text-gray-600">
                <FileText size={24} />
              </div>
              <span className="text-xs">{t.noDataFound}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {closedPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-[#0b0e14] border border-[#1f2736] rounded-lg p-2 flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1 rounded ${
                          pos.direction === 'LONG' ? 'text-[#00c087]' : 'text-[#f6465d]'
                        }`}
                      >
                        {pos.direction}
                      </span>
                      <span className="font-bold text-gray-200">{pos.symbol}</span>
                      <span className="text-[10px] text-gray-500">(${pos.amount})</span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(pos.settledAt || pos.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span
                      className={`font-mono font-bold text-xs ${
                        pos.status === 'WON' ? 'text-[#00c087]' : 'text-[#f6465d]'
                      }`}
                    >
                      {pos.status === 'WON' ? `+$${pos.pnl?.toFixed(2)}` : `-$${pos.amount.toFixed(2)}`}
                    </span>
                    <span
                      className={`text-[9px] px-1 rounded ${
                        pos.status === 'WON' ? 'bg-[#00c087]/20 text-[#00c087]' : 'bg-[#f6465d]/20 text-[#f6465d]'
                      }`}
                    >
                      {pos.status === 'WON' ? t.statusWon : t.statusLost}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 3. News & AI Radar */}
        {activeTab === 'news' && (
          <div className="flex flex-col gap-2">
            {newsList.map((item) => (
              <div
                key={item.id}
                className="bg-[#0b0e14] border border-[#1e2634] rounded-lg p-2.5 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {item.source}
                  </span>
                  <span className="text-gray-500 font-mono">{item.time}</span>
                </div>
                <p className="text-xs text-gray-200 font-medium leading-relaxed">
                  {language === 'ar' ? item.titleAr : item.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#171d27]">
                  <span>{item.category}</span>
                  <span className="text-[#00c087] font-mono font-bold">
                    Bullish Sentiment: {item.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
