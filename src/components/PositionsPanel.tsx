import React, { useState, useEffect } from 'react'
import { FileText, Clock, ExternalLink } from 'lucide-react'
import { Language, EventPosition } from '../types'

interface PositionsPanelProps {
  language: Language
  openPositions: EventPosition[]
  closedPositions: EventPosition[]
  onOpenHistoryModal?: () => void
}

export const PositionsPanel: React.FC<PositionsPanelProps> = ({
  language,
  openPositions,
  closedPositions,
  onOpenHistoryModal,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
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

  const openCount = openPositions.length
  const closedCountStr = closedPositions.length > 99 ? '99+' : `${closedPositions.length}`

  return (
    <div className="flex flex-col w-full bg-black mt-2 mb-20 select-none">
      {/* 1. Header Tabs: Open Positions (0) & Closed Positions (99+) with 📄 icon */}
      <div className="flex items-center justify-between border-b border-[#1b1e22] px-2">
        <div className="flex items-center gap-6">
          {/* Open Positions Tab */}
          <button
            onClick={() => setActiveTab('open')}
            className={`relative py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'open' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>
              {language === 'ar'
                ? `المراكز المفتوحة (${openCount})`
                : `Open Positions (${openCount})`}
            </span>
            {activeTab === 'open' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"></div>
            )}
          </button>

          {/* Closed Positions Tab */}
          <button
            onClick={() => setActiveTab('closed')}
            className={`relative py-2.5 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'closed' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span>
              {language === 'ar'
                ? `المراكز المغلقة (${closedPositions.length > 0 ? closedCountStr : '99+'})`
                : `Closed Positions (${closedPositions.length > 0 ? closedCountStr : '99+'})`}
            </span>
            {activeTab === 'closed' && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"></div>
            )}
          </button>
        </div>

        {/* Right Document Icon matching screenshot */}
        <button
          onClick={onOpenHistoryModal}
          className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
          title="All History"
        >
          <FileText size={16} />
        </button>
      </div>

      {/* 2. Body / Empty State */}
      <div className="py-6 px-2 flex flex-col justify-center min-h-[140px]">
        {activeTab === 'open' && (
          openPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-3">
              {/* Layered Document Empty State Icon matching screenshot */}
              <div className="relative w-14 h-14 flex items-center justify-center opacity-60">
                <div className="absolute w-10 h-12 bg-[#1c212a] rounded-lg transform -rotate-6 border border-[#2b3342]"></div>
                <div className="relative w-10 h-12 bg-[#252c38] rounded-lg flex flex-col items-center justify-center gap-1 border border-[#374254] shadow-md">
                  <div className="w-5 h-1 bg-gray-500 rounded-full"></div>
                  <div className="w-6 h-1 bg-gray-600 rounded-full"></div>
                  <div className="w-4 h-1 bg-gray-600 rounded-full"></div>
                </div>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {language === 'ar' ? 'لا توجد بيانات' : 'No data found'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {openPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-[#10141d] border border-[#1e2634] rounded-xl p-3 flex flex-col gap-2 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          pos.direction === 'LONG'
                            ? 'bg-[#00c087]/20 text-[#00c087] border border-[#00c087]/40'
                            : 'bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/40'
                        }`}
                      >
                        {pos.direction === 'LONG' ? '↗ UP' : '↘ DOWN'}
                      </span>
                      <span className="text-xs font-bold text-white">{pos.symbol}</span>
                      <span className="text-[10px] text-gray-400 font-mono">[{pos.duration}]</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      <Clock size={11} className="animate-spin" />
                      <span>{formatRemainingTime(pos.expiresAt)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-xs pt-1.5 border-t border-[#171e2b] text-gray-400">
                    <div>
                      <span className="text-[10px] block text-gray-500">
                        {language === 'ar' ? 'المبلغ' : 'Amount'}
                      </span>
                      <span className="text-white font-mono font-semibold">${pos.amount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block text-gray-500">
                        {language === 'ar' ? 'سعر الدخول' : 'Entry'}
                      </span>
                      <span className="text-gray-300 font-mono">${pos.entryPrice?.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] block text-gray-500">
                        {language === 'ar' ? 'العائد' : 'Payout'}
                      </span>
                      <span className="text-[#00c087] font-mono font-bold">{pos.payoutRatio}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'closed' && (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {closedPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-3">
                <div className="relative w-14 h-14 flex items-center justify-center opacity-60">
                  <div className="absolute w-10 h-12 bg-[#1c212a] rounded-lg transform -rotate-6 border border-[#2b3342]"></div>
                  <div className="relative w-10 h-12 bg-[#252c38] rounded-lg flex flex-col items-center justify-center gap-1 border border-[#374254] shadow-md">
                    <div className="w-5 h-1 bg-gray-500 rounded-full"></div>
                    <div className="w-6 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {language === 'ar' ? 'لا توجد صفقات مغلقة حالياً' : 'No closed positions'}
                </span>
              </div>
            ) : (
              closedPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-[#10141d] border border-[#1e2634] rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                          pos.direction === 'LONG'
                            ? 'bg-[#00c087]/20 text-[#00c087]'
                            : 'bg-[#f6465d]/20 text-[#f6465d]'
                        }`}
                      >
                        {pos.direction === 'LONG' ? '↗ UP' : '↘ DOWN'}
                      </span>
                      <span className="font-bold text-white">{pos.symbol}</span>
                      <span className="text-[10px] text-gray-400 font-mono">(${pos.amount})</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(pos.createdAt).toLocaleTimeString()}
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
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        pos.status === 'WON' ? 'bg-[#00c087]/20 text-[#00c087]' : 'bg-[#f6465d]/20 text-[#f6465d]'
                      }`}
                    >
                      {pos.status === 'WON'
                        ? language === 'ar' ? 'ربح (+العائد)' : 'WIN'
                        : language === 'ar' ? 'خسارة' : 'LOSS'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
