import React from 'react'
import { Play, Square, ArrowUpRight, ArrowDownRight, ShieldCheck, Zap, Edit3 } from 'lucide-react'
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

  const durations: { id: TradeDuration; labelEn: string; labelAr: string }[] = [
    { id: '10m', labelEn: '10m', labelAr: '١٠ دقائق' },
    { id: '30m', labelEn: '30m', labelAr: '٣٠ دقيقة' },
  ]

  const candles: { id: AnalysisCandle; labelEn: string; labelAr: string }[] = [
    { id: '1m', labelEn: '1m', labelAr: '١ دقيقة' },
    { id: '5m', labelEn: '5m', labelAr: '٥ دقائق' },
    { id: '15m', labelEn: '15m', labelAr: '١٥ دقيقة' },
  ]

  const payouts: PayoutFilter[] = [75, 80, 85]

  const settlementReturn = amount + (amount * currentPayout) / 100

  return (
    <div className="relative flex flex-col gap-3 w-full bg-[#10141d] border border-[#1e2634] rounded-2xl p-3 shadow-xl overflow-hidden">
      {/* Subtle Background Watermark 'AI' */}
      <div className="absolute right-4 top-2 text-[64px] font-black text-white/[0.02] pointer-events-none select-none font-mono">
        AI
      </div>
      <div className="absolute left-4 bottom-2 text-[64px] font-black text-white/[0.02] pointer-events-none select-none font-mono">
        AI
      </div>

      {/* Header Banner: AUTO-TRADE CONFIGURATION */}
      <div className="flex items-center justify-between border-b border-[#1a212d] pb-2 z-10">
        <span className="text-[11px] font-bold tracking-wider text-[#d4af37]">
          {language === 'ar' ? 'إعدادات التداول التلقائي (AUTO-TRADE CONFIGURATION)' : 'AUTO-TRADE CONFIGURATION'}
        </span>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
          <ShieldCheck size={11} />
          <span>{language === 'ar' ? 'مخاطرة منخفضة' : 'Low Risk Gate'}</span>
        </div>
      </div>

      {/* Grid: Trade Expiration, Analysis Candle, Payout Ratio */}
      <div className="grid grid-cols-3 gap-2 z-10">
        {/* 1. Trade Expiration */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-semibold truncate">
            {language === 'ar' ? 'مدة الصفقة' : 'Trade Expiration'}
          </label>
          <div className="flex bg-[#0a0d13] p-0.5 rounded-lg border border-[#1f2838]">
            {durations.map((d) => (
              <button
                key={d.id}
                onClick={() => setDuration(d.id)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  duration === d.id
                    ? 'bg-[#d4af37]/20 border border-[#d4af37] text-[#f5e6a3] shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {language === 'ar' ? d.labelAr : d.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Analysis Candle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-semibold truncate">
            {language === 'ar' ? 'شمعة التحليل' : 'Analysis Candle'}
          </label>
          <div className="flex bg-[#0a0d13] p-0.5 rounded-lg border border-[#1f2838]">
            {candles.map((c) => (
              <button
                key={c.id}
                onClick={() => setCandle(c.id)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  candle === c.id
                    ? 'bg-[#d4af37]/20 border border-[#d4af37] text-[#f5e6a3] shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {language === 'ar' ? c.labelAr : c.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Payout Ratio */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-gray-400 font-semibold truncate">
            {language === 'ar' ? 'نسبة العائد' : 'Payout Ratio'}
          </label>
          <div className="flex bg-[#0a0d13] p-0.5 rounded-lg border border-[#1f2838]">
            {payouts.map((p) => (
              <button
                key={p}
                onClick={() => setPayoutFilter(p)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  payoutFilter === p
                    ? 'bg-[#d4af37]/25 border border-[#d4af37] text-[#f5e6a3] shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {language === 'ar' ? `%${p}` : `${p}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Amount & Available Balance Box */}
      <div className="flex flex-col gap-1.5 bg-[#090c12] p-2.5 rounded-xl border border-[#1e2636] z-10">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-300 font-medium flex items-center gap-1">
            {language === 'ar' ? 'المبلغ (USDT)' : 'Amount (USDT)'}
          </span>
          <span className="text-gray-400 font-mono text-[10px]">
            {language === 'ar'
              ? `المتاح: ${availBalance.toLocaleString('en-US', { minimumFractionDigits: 4 })} USDT`
              : `Avail: ${availBalance.toLocaleString('en-US', { minimumFractionDigits: 4 })} USDT`}
          </span>
        </div>

        {/* Input with Quick +/- and Edit icon */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAmount(Math.max(10, amount - 25))}
            className="w-9 h-9 rounded-lg bg-[#141b26] hover:bg-[#1e2736] border border-[#2b374a] text-gray-200 font-bold text-base flex items-center justify-center active:scale-95 cursor-pointer"
          >
            -
          </button>

          <div className="relative flex-1">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              placeholder="100.00"
              className="w-full bg-[#101520] border border-[#2b374a] rounded-lg px-3 py-2 text-center text-white font-mono text-sm font-bold focus:outline-none focus:border-[#00c087]"
            />
            <span className="absolute left-2.5 top-2.5 text-gray-500 pointer-events-none">
              <Edit3 size={13} />
            </span>
            <span className="absolute right-2.5 top-2.5 text-[10px] text-gray-500 font-mono pointer-events-none">
              USDT
            </span>
          </div>

          <button
            onClick={() => setAmount(amount + 25)}
            className="w-9 h-9 rounded-lg bg-[#141b26] hover:bg-[#1e2736] border border-[#2b374a] text-gray-200 font-bold text-base flex items-center justify-center active:scale-95 cursor-pointer"
          >
            +
          </button>
        </div>

        {/* Settlement Estimates */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#171e2b]">
          <span>
            {language === 'ar' ? 'مبلغ التسوية المقدر:' : 'Settlement Amount:'}
          </span>
          <span className="text-[#00c087] font-mono font-bold">
            {settlementReturn.toFixed(2)} USDT ({language === 'ar' ? `عوائد الصعود: %${currentPayout}` : `Payout: ${currentPayout}%`})
          </span>
        </div>
      </div>

      {/* Main Action Button: Glowing START AUTO-TRADING */}
      <button
        onClick={onToggleAutoTrading}
        className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer z-10 ${
          isAutoRunning
            ? 'bg-[#f6465d] text-white shadow-[0_0_25px_rgba(246,70,93,0.7)] animate-pulse border border-[#ff6677]'
            : 'bg-[#00c087] hover:bg-[#00d696] text-black shadow-[0_0_24px_rgba(0,192,135,0.7)] border border-[#44ffbb]'
        }`}
      >
        {isAutoRunning ? (
          <>
            <Square size={16} fill="currentColor" />
            <span>{language === 'ar' ? 'إيقاف التداول التلقائي' : 'STOP AUTO-TRADING'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-white font-mono ml-2">
              RUNNING 24/7
            </span>
          </>
        ) : (
          <>
            <Play size={17} fill="currentColor" />
            <span>{language === 'ar' ? 'بدء التداول التلقائي' : 'START AUTO-TRADING'}</span>
            <Zap size={15} className="text-black ml-1 animate-bounce" />
          </>
        )}
      </button>

      {/* Manual Overrides: LONG (Green) & SHORT (Red) matching Screenshot */}
      <div className="grid grid-cols-2 gap-2 z-10">
        <button
          onClick={() => onManualTrade('LONG')}
          className="py-2.5 px-2 rounded-xl bg-[#0f2e22] hover:bg-[#143c2c] border border-[#00c087]/60 text-[#00c087] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(0,192,135,0.2)] cursor-pointer"
        >
          <ArrowUpRight size={16} />
          <span>{language === 'ar' ? 'تجاوز يدوي (شراء / صعود)' : 'MANUAL OVERRIDE (LONG)'}</span>
        </button>

        <button
          onClick={() => onManualTrade('SHORT')}
          className="py-2.5 px-2 rounded-xl bg-[#2e1419] hover:bg-[#3d1a21] border border-[#f6465d]/60 text-[#f6465d] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(246,70,93,0.2)] cursor-pointer"
        >
          <ArrowDownRight size={16} />
          <span>{language === 'ar' ? 'تجاوز يدوي (بيع / هبوط)' : 'MANUAL OVERRIDE (SHORT)'}</span>
        </button>
      </div>
    </div>
  )
}
