import React from 'react'
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, Sparkles, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { Language, TradeDuration, AnalysisCandle, PayoutFilter } from '../types'

interface AutoTradePanelProps {
  language: Language
  duration: TradeDuration
  setDuration: (d: TradeDuration) => void
  amount: number | string
  setAmount: (a: any) => void
  availBalance: number
  isAutoRunning: boolean
  onToggleAutoTrading: () => void
  onTrade: (direction: 'LONG' | 'SHORT') => void
  upPayout: number
  downPayout: number
  payoutFilter: PayoutFilter
  setPayoutFilter: (p: PayoutFilter) => void
  candle: AnalysisCandle
  setCandle: (c: AnalysisCandle) => void
}

export const AutoTradePanel: React.FC<AutoTradePanelProps> = ({
  language,
  duration,
  setDuration,
  amount,
  setAmount,
  availBalance,
  isAutoRunning,
  onToggleAutoTrading,
  onTrade,
  upPayout,
  downPayout,
  payoutFilter,
  setPayoutFilter,
  candle,
  setCandle,
}) => {
  const [showAutoSettings, setShowAutoSettings] = React.useState(false)

  const timeUnits: { id: TradeDuration | string; label: string }[] = [
    { id: '10m', label: '10m' },
    { id: '30m', label: '30m' },
    { id: '1H', label: '1H' },
    { id: '1D', label: '1D' },
  ]

  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0

  const upSettlement = numAmount > 0 ? (numAmount + (numAmount * upPayout) / 100).toFixed(2) : '--'
  const downSettlement = numAmount > 0 ? (numAmount + (numAmount * downPayout) / 100).toFixed(2) : '--'

  const handleStepAmount = (delta: number) => {
    const next = Math.max(1, Math.min(250, (numAmount || 0) + delta))
    setAmount(next)
  }

  return (
    <div className="flex flex-col gap-3 w-full bg-black text-white px-2 select-none">
      {/* 1. Time Unit Selection */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-gray-300">
          {language === 'ar' ? 'وحدة الوقت (Time Unit)' : 'Time Unit'}
        </span>
        <div className="grid grid-cols-4 gap-2">
          {timeUnits.map((u) => {
            const isActive = duration === u.id
            return (
              <button
                key={u.id}
                onClick={() => setDuration(u.id as any)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#15233d] border border-[#2962ff] text-white shadow-[0_0_8px_rgba(41,98,255,0.4)]'
                    : 'bg-[#161a22] border border-[#212630] text-gray-300 hover:bg-[#1f2532]'
                }`}
              >
                {u.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Amount (USDT) & Avail Balance */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-300">
            {language === 'ar' ? 'المبلغ (Amount USDT)' : 'Amount (USDT)'}
          </span>
          <div className="flex items-center gap-1 text-gray-400 font-mono text-[11px]">
            <span>
              {language === 'ar' ? 'المتاح:' : 'Avail:'} {availBalance.toLocaleString('en-US', { minimumFractionDigits: 4 })} USDT
            </span>
            <button className="text-[#2962ff] hover:text-[#5384ff] p-0.5" title="Transfer / Deposit">
              <ArrowLeftRight size={12} />
            </button>
          </div>
        </div>

        {/* Input pill with - | + controls */}
        <div className="flex items-center justify-between bg-[#12161f] border border-[#232936] rounded-xl px-3 py-1.5">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1-250 USDT"
            className="w-full bg-transparent text-gray-200 placeholder-gray-500 text-sm font-semibold focus:outline-none"
          />
          <div className="flex items-center gap-2 text-gray-400 text-lg font-bold shrink-0 ml-2">
            <button
              onClick={() => handleStepAmount(-10)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 active:scale-95 cursor-pointer"
            >
              −
            </button>
            <span className="text-gray-600 font-light">|</span>
            <button
              onClick={() => handleStepAmount(10)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-300 active:scale-95 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* 3. Payout and Settlement Preview */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex flex-col">
          <span className="text-gray-400">
            Up Payout <span className="text-[#00c087] font-semibold">{upPayout}%</span>
          </span>
          <span className="text-gray-400 text-[11px]">
            Settlement Amount <span className="text-gray-200 font-mono font-medium">{upSettlement} USDT</span>
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-gray-400">
            Down Payout <span className="text-[#00c087] font-semibold">{downPayout}%</span>
          </span>
          <span className="text-gray-400 text-[11px]">
            Settlement Amount <span className="text-gray-200 font-mono font-medium">{downSettlement} USDT</span>
          </span>
        </div>
      </div>

      {/* 4. Action Buttons: ↗ Up & ↘ Down */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        {/* Up (Green) */}
        <button
          onClick={() => onTrade('LONG')}
          className="w-full py-3 px-4 rounded-full bg-[#00c087] hover:bg-[#00d696] text-black font-extrabold text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(0,192,135,0.4)] cursor-pointer"
        >
          <span className="text-base font-bold">↗</span>
          <span>{language === 'ar' ? 'صعود (Up)' : 'Up'}</span>
        </button>

        {/* Down (Red) */}
        <button
          onClick={() => onTrade('SHORT')}
          className="w-full py-3 px-4 rounded-full bg-[#f6465d] hover:bg-[#ff5a70] text-white font-extrabold text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] shadow-[0_0_15px_rgba(246,70,93,0.4)] cursor-pointer"
        >
          <span className="text-base font-bold">↘</span>
          <span>{language === 'ar' ? 'هبوط (Down)' : 'Down'}</span>
        </button>
      </div>

      {/* 5. Cloud 24/7 AI Auto-Trading Bar & Controller */}
      <div className="mt-1 bg-[#10141d] border border-[#1e2634] rounded-xl p-2.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c087] animate-pulse"></span>
            <span className="text-xs font-bold text-gray-200">
              {language === 'ar' ? 'المتداول الآلي بالذكاء الاصطناعي (24/7)' : 'AI Auto-Trading Engine (24/7)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoTrading}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isAutoRunning
                  ? 'bg-[#00c087] text-black shadow-[0_0_10px_rgba(0,192,135,0.6)] animate-pulse'
                  : 'bg-[#1b2230] text-gray-400 hover:text-white border border-[#2b3648]'
              }`}
            >
              {isAutoRunning
                ? language === 'ar' ? 'قيد التشغيل ●' : 'ACTIVE ●'
                : language === 'ar' ? 'تشغيل الآن' : 'START AUTO'}
            </button>

            <button
              onClick={() => setShowAutoSettings(!showAutoSettings)}
              className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
            >
              {showAutoSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Collapsible Auto-Trade Filter Settings */}
        {showAutoSettings && (
          <div className="pt-2 border-t border-[#1b212d] grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-400">
                {language === 'ar' ? 'أدنى نسبة عائد مقبولة' : 'Min Payout Gate'}
              </span>
              <div className="flex gap-1">
                {[75, 80, 85].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPayoutFilter(p as any)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold ${
                      payoutFilter === p
                        ? 'bg-[#2962ff] text-white'
                        : 'bg-[#161a22] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-400">
                {language === 'ar' ? 'شمعة التحليل الفني' : 'Analysis Candle'}
              </span>
              <div className="flex gap-1">
                {['1m', '5m', '15m'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCandle(c as any)}
                    className={`flex-1 py-1 rounded text-[10px] font-bold ${
                      candle === c
                        ? 'bg-[#2962ff] text-white'
                        : 'bg-[#161a22] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
