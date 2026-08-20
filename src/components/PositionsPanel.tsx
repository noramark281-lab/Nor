import React, { useState } from 'react'
import { Language, EventPosition } from '../types'
import { FileText, ArrowUpRight, ArrowDownRight, Clock, ShieldAlert } from 'lucide-react'

interface PositionsPanelProps {
  language: Language
  positions: EventPosition[]
  closedPositions: EventPosition[]
  onClosePosition?: (id: string) => void
}

export const PositionsPanel: React.FC<PositionsPanelProps> = ({
  language,
  positions,
  closedPositions,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')

  return (
    <div className="w-full bg-black flex flex-col px-3 py-3 select-none pb-20">
      {/* Positions Header Tabs matching screenshot */}
      <div className="flex items-center justify-between pb-2 border-b border-[#181d26]">
        <div className="flex items-center gap-4 text-xs font-bold">
          <button
            id="tab-open-positions"
            onClick={() => setActiveTab('open')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'open' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {language === 'ar' ? 'المراكز المفتوحة' : 'Open Positions'} ({positions.length})
          </button>

          <button
            id="tab-closed-positions"
            onClick={() => setActiveTab('closed')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'closed' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {language === 'ar' ? 'المراكز المغلقة' : 'Closed Positions'} ({closedPositions.length})
          </button>
        </div>

        {/* Document Icon matching screenshot */}
        <button
          className="text-gray-500 hover:text-gray-300 transition-colors p-1"
          title="Export Records"
        >
          <FileText size={16} />
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'open' ? (
        positions.length === 0 ? (
          /* Empty State Graphic matching the screenshot */
          <div className="w-full flex flex-col items-center justify-center py-10 gap-3">
            {/* Custom Layered Document Box */}
            <div className="relative w-14 h-16 bg-[#161a24] border border-[#232938] rounded-xl flex items-center justify-center shadow-inner">
              <div className="w-8 h-1 bg-[#283144] rounded mb-2"></div>
              <div className="w-5 h-1 bg-[#283144] rounded"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#1f2535] rounded-bl-lg border-l border-b border-[#2d374d]"></div>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {language === 'ar' ? 'لا توجد مراكز مفتوحة' : 'No open positions'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pt-2">
            {positions.map((pos) => {
              const isUp = pos.direction === 'LONG'
              return (
                <div
                  key={pos.id}
                  className="w-full bg-[#12161f] border border-[#1e2533] rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">{pos.symbol}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                          isUp
                            ? 'bg-[#00c087]/20 text-[#00c087] border border-[#00c087]/30'
                            : 'bg-[#f6465d]/20 text-[#f6465d] border border-[#f6465d]/30'
                        }`}
                      >
                        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {isUp ? (language === 'ar' ? 'صعود (UP)' : 'UP') : (language === 'ar' ? 'هبوط (DOWN)' : 'DOWN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                      <Clock size={12} />
                      <span>{pos.duration}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#1a202d]">
                    <div>
                      <div className="text-[10px] text-gray-500">
                        {language === 'ar' ? 'المبلغ' : 'Amount'}
                      </div>
                      <div className="text-white font-mono font-bold">{pos.amount} USDT</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-gray-500">
                        {language === 'ar' ? 'سعر الدخول' : 'Entry Price'}
                      </div>
                      <div className="text-white font-mono">{pos.entryPrice.toLocaleString()}</div>
                    </div>

                    <div>
                      <div className="text-[10px] text-gray-500">
                        {language === 'ar' ? 'نسبة العائد' : 'Payout Ratio'}
                      </div>
                      <div className="text-[#00c087] font-mono font-bold">+{pos.payoutRatio}%</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Closed Positions Tab */
        <div className="flex flex-col gap-2.5 pt-2">
          {closedPositions.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-10 gap-3">
              <div className="relative w-14 h-16 bg-[#161a24] border border-[#232938] rounded-xl flex items-center justify-center opacity-60">
                <div className="w-8 h-1 bg-[#283144] rounded mb-2"></div>
                <div className="w-5 h-1 bg-[#283144] rounded"></div>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {language === 'ar' ? 'لا توجد صفقات مغلقة سابقة' : 'No closed positions history'}
              </span>
            </div>
          ) : (
            closedPositions.map((pos) => {
              const isWon = pos.status === 'WON'
              return (
                <div
                  key={pos.id}
                  className="w-full bg-[#10141c] border border-[#1b2230] rounded-xl p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{pos.symbol}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isWon
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isWon ? (language === 'ar' ? 'ربح (+80%)' : 'WON (+80%)') : (language === 'ar' ? 'خسارة' : 'LOST')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{new Date(pos.createdAt).toLocaleTimeString()}</span>
                    <span className="font-mono text-white font-bold">
                      {isWon ? `+${(pos.amount * (pos.payoutRatio / 100)).toFixed(2)} USDT` : `-${pos.amount} USDT`}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
