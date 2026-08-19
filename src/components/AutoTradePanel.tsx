import React from 'react'
import { Play, Square, ArrowUpRight, ArrowDownRight, ShieldCheck, Zap } from 'lucide-react'
import { Language, TradeDuration, AnalysisCandle, PayoutFilter } from '../types'
import { getT } from '../lib/translations'

interface AutoTradePanelProps {
  language: Language
  duration: TradeDuration
  setDuration: (d: TradeDuration) => void
  candle: AnalysisCandle
  setCandle: (c: AnalysisCandle) => void
  payoutFilter: PayoutFilter
  setPayoutFilter: (p: PayoutFilter) => void
  amount: number
  setAmount: (a: number) => void
  availBalance: number
  isAutoRunning: boolean
  onToggleAutoTrading: () => void
  onManualTrade: (direction: 'LONG' | 'SHORT') => void
  currentPayout: number
}

export const AutoTradePanel: React.FC<AutoTradePanelProps> = ({
  language,
  duration,
  setDuration,
  candle,
  setCandle,
  payoutFilter,
  setPayoutFilter,
  amount,
  setAmount,
  availBalance,
  isAutoRunning,
  onToggleAutoTrading,
  onManualTrade,
  currentPayout,
}) => {
  const t = getT(language)

  const durations: { id: TradeDuration; label: string }[] = [
    { id: '10m', label: t.duration10 },
    { id: '30m', label: t.duration30 },
  ]

  const candles: { id: AnalysisCandle; label: string }[] = [
    { id: '1m', label: t.candle1 },
    { id: '5m', label: t.candle5 },
    { id: '15m', label: t.candle15 },
  ]

  const payouts: PayoutFilter[] = [75, 80, 85]

  const settlementReturn = amount + (amount * currentPayout) / 100

  return (
    <div className="flex flex-col gap-3 w-full bg-[#12161f] border border-[#1f2632] rounded-xl p-3 shadow-md">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-[#1b222d] pb-2">
        <span className="text-[11px] font-bold text-gray-400 tracking-wider">
          {t.autoTradeConfig}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
          <ShieldCheck size={11} />
          <span>{t.riskLevel}</span>
        </div>
      </div>

      {/* Row 1: Duration, Candle, Payout Filter */}
      <div className="grid grid-cols-3 gap-2">
        {/* Trade Duration */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-medium truncate">
            {t.tradeDuration}
          </label>
          <div className="flex bg-[#0b0e14] p-0.5 rounded-lg border border-[#1f2633]">
            {durations.map((d) => (
              <button
                key={d.id}
                onClick={() => setDuration(d.id)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  duration === d.id
                    ? 'bg-[#00c087] text-black shadow-[0_0_8px_rgba(0,192,135,0.4)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Candle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-medium truncate">
            {t.analysisCandle}
          </label>
          <div className="flex bg-[#0b0e14] p-0.5 rounded-lg border border-[#1f2633]">
            {candles.map((c) => (
              <button
                key={c.id}
                onClick={() => setCandle(c.id)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  candle === c.id
                    ? 'bg-[#00c087] text-black shadow-[0_0_8px_rgba(0,192,135,0.4)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payout Ratio Filter */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-medium truncate">
            {t.payoutRatio}
          </label>
          <div className="flex bg-[#0b0e14] p-0.5 rounded-lg border border-[#1f2633]">
            {payouts.map((p) => (
              <button
                key={p}
                onClick={() => setPayoutFilter(p)}
                className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                  payoutFilter === p
                    ? 'bg-[#00c087] text-black shadow-[0_0_8px_rgba(0,192,135,0.4)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Amount & Live Wallet Balance */}
      <div className="flex flex-col gap-1 bg-[#0b0e14] p-2.5 rounded-lg border border-[#1c2330]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400">{t.amount}</span>
          <span className="text-gray-300 font-mono font-medium">
            {language === 'ar' ? `الرصيد المتاح: ${availBalance.toFixed(4)} USDT` : `Avail: ${availBalance.toFixed(4)} USDT`}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => setAmount(Math.max(10, amount - 25))}
            className="w-8 h-8 rounded-lg bg-[#18202c] hover:bg-[#202b3c] border border-[#2b3544] text-gray-300 font-bold text-sm flex items-center justify-center active:scale-95"
          >
            -
          </button>
          <div className="relative flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              placeholder={t.enterAmount}
              className="w-full bg-[#121620] border border-[#2b3544] rounded-lg px-3 py-1.5 text-center text-white font-mono text-sm font-semibold focus:outline-none focus:border-[#00c087]"
            />
            <span className="absolute right-2.5 top-2 text-[10px] text-gray-500 font-mono pointer-events-none">
              USDT
            </span>
          </div>
          <button
            onClick={() => setAmount(amount + 25)}
            className="w-8 h-8 rounded-lg bg-[#18202c] hover:bg-[#202b3c] border border-[#2b3544] text-gray-300 font-bold text-sm flex items-center justify-center active:scale-95"
          >
            +
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 pt-1 border-t border-[#171d27]">
          <span>{t.settlementAmount} (est.):</span>
          <span className="text-[#00c087] font-mono font-bold">
            {settlementReturn.toFixed(2)} USDT ({currentPayout}%)
          </span>
        </div>
      </div>

      {/* Main Glowing Action Button: START / STOP AUTO-TRADING */}
      <button
        onClick={onToggleAutoTrading}
        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${
          isAutoRunning
            ? 'bg-[#f6465d] text-white shadow-[0_0_20px_rgba(246,70,93,0.5)] animate-pulse border border-[#ff6677]'
            : 'bg-[#00c087] hover:bg-[#00d696] text-black shadow-[0_0_18px_rgba(0,192,135,0.6)] border border-[#33ffaa]'
        }`}
      >
        {isAutoRunning ? (
          <>
            <Square size={16} fill="currentColor" />
            <span>{t.stopAutoTrading}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono ml-2">RUNNING 24/7</span>
          </>
        ) : (
          <>
            <Play size={16} fill="currentColor" />
            <span>{t.startAutoTrading}</span>
            <Zap size={14} className="text-black ml-1 animate-bounce" />
          </>
        )}
      </button>

      {/* Secondary Manual Overrides (Long / Short) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onManualTrade('LONG')}
          className="py-2.5 rounded-lg bg-[#00c087]/15 hover:bg-[#00c087]/25 border border-[#00c087]/50 text-[#00c087] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(0,192,135,0.15)]"
        >
          <ArrowUpRight size={15} />
          <span>{t.manualOverrideLong}</span>
        </button>
        <button
          onClick={() => onManualTrade('SHORT')}
          className="py-2.5 rounded-lg bg-[#f6465d]/15 hover:bg-[#f6465d]/25 border border-[#f6465d]/50 text-[#f6465d] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(246,70,93,0.15)]"
        >
          <ArrowDownRight size={15} />
          <span>{t.manualOverrideShort}</span>
        </button>
      </div>
    </div>
  )
}
