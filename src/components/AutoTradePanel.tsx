import React, { useState } from 'react'
import {
  Language,
  TradeDuration,
  AnalysisCandle,
  PayoutFilter,
  AISentimentState,
} from '../types'
import { getT } from '../lib/translations'
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Minus,
  Plus,
  Bot,
  Zap,
  ShieldCheck,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react'

interface AutoTradePanelProps {
  language: Language
  duration: TradeDuration
  setDuration: (d: TradeDuration) => void
  analysisCandle: AnalysisCandle
  setAnalysisCandle: (c: AnalysisCandle) => void
  payoutFilter: PayoutFilter
  setPayoutFilter: (p: PayoutFilter) => void
  amount: string
  setAmount: (a: string) => void
  availBalance: number
  upPayout: number
  downPayout: number
  isAutoTrading: boolean
  onToggleAutoTrading: () => void
  onManualTrade: (direction: 'LONG' | 'SHORT') => void
  sentimentState: AISentimentState
  onRefreshBalance: () => void
}

export const AutoTradePanel: React.FC<AutoTradePanelProps> = ({
  language,
  duration,
  setDuration,
  analysisCandle,
  setAnalysisCandle,
  payoutFilter,
  setPayoutFilter,
  amount,
  setAmount,
  availBalance,
  upPayout,
  downPayout,
  isAutoTrading,
  onToggleAutoTrading,
  onManualTrade,
  sentimentState,
  onRefreshBalance,
}) => {
  const t = getT(language)
  const [showAdvancedEngine, setShowAdvancedEngine] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const upSettlement = numAmount > 0 ? (numAmount * (1 + upPayout / 100)).toFixed(2) : '--'
  const downSettlement = numAmount > 0 ? (numAmount * (1 + downPayout / 100)).toFixed(2) : '--'

  const durations: TradeDuration[] = ['10m', '30m', '1H', '1D']

  const handleStep = (step: number) => {
    const current = parseFloat(amount) || 10
    const next = Math.max(1, Math.min(250, current + step))
    setAmount(next.toString())
  }

  return (
    <div className="w-full bg-black flex flex-col px-3 py-3 gap-3 border-b border-[#181d26] select-none">
      {/* 1. Time Unit Selection */}
      <div className="flex flex-col gap-1.5">
        <div className="text-xs text-gray-400 font-medium">
          {language === 'ar' ? 'وحدة الوقت (Time Unit)' : 'Time Unit'}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {durations.map((d) => {
            const isActive = duration === d
            return (
              <button
                key={d}
                id={`duration-${d}`}
                onClick={() => setDuration(d)}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#121a2b] border-2 border-[#2962ff] text-white shadow-[0_0_12px_rgba(41,98,255,0.3)]'
                    : 'bg-[#141822] border border-[#202735] text-gray-400 hover:text-gray-200'
                }`}
              >
                {d}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Amount Input & Available Balance */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">{t.amount}</span>
          <div className="flex items-center gap-1 text-gray-300 font-mono">
            <span>{t.avail}:</span>
            <span className="text-white font-bold">{availBalance.toFixed(2)} USDT</span>
            <button
              id="btn-refresh-balance"
              onClick={onRefreshBalance}
              className="text-gray-400 hover:text-[#2962ff] transition-colors p-0.5"
              title="Refresh MEXC Balance"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Input Box matching screenshot with - | + buttons */}
        <div className="w-full bg-[#141822] border border-[#202735] focus-within:border-[#2962ff] rounded-xl flex items-center px-3 py-2 transition-all">
          <input
            id="input-trade-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1-250 USDT"
            min="1"
            max="250"
            className="w-full bg-transparent text-white font-mono text-sm placeholder:text-gray-500 focus:outline-none"
          />
          <div className="flex items-center gap-2 text-gray-400">
            <button
              onClick={() => handleStep(-5)}
              className="p-1 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Minus size={14} />
            </button>
            <span className="text-gray-600 font-mono">|</span>
            <button
              onClick={() => handleStep(5)}
              className="p-1 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Up / Down Payouts & Settlement Amount Preview */}
      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
        {/* Left: Up Payout */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Up Payout</span>
            <span className="text-[#00c087] font-bold">{upPayout}%</span>
          </div>
          <div className="text-gray-400 text-[11px]">
            <span>Settlement Amount </span>
            <span className="text-white font-mono font-bold">
              {upSettlement === '--' ? '== USDT' : `${upSettlement} USDT`}
            </span>
          </div>
        </div>

        {/* Right: Down Payout */}
        <div className="flex flex-col gap-0.5 text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-gray-400">Down Payout</span>
            <span className="text-[#00c087] font-bold">{downPayout}%</span>
          </div>
          <div className="text-gray-400 text-[11px]">
            <span>Settlement Amount </span>
            <span className="text-white font-mono font-bold">
              {downSettlement === '--' ? '== USDT' : `${downSettlement} USDT`}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Action Buttons (Big Green Up and Big Red Down) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Up Button */}
        <button
          id="btn-trade-up"
          onClick={() => onManualTrade('LONG')}
          className="w-full bg-[#00c087] hover:bg-[#00a875] active:scale-[0.98] text-white py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(0,192,135,0.25)] transition-all cursor-pointer"
        >
          <ArrowUpRight size={20} className="stroke-[3]" />
          <span>{t.up}</span>
        </button>

        {/* Down Button */}
        <button
          id="btn-trade-down"
          onClick={() => onManualTrade('SHORT')}
          className="w-full bg-[#f6465d] hover:bg-[#e03a50] active:scale-[0.98] text-white py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(246,70,93,0.25)] transition-all cursor-pointer"
        >
          <ArrowDownRight size={20} className="stroke-[3]" />
          <span>{t.down}</span>
        </button>
      </div>

      {/* 5. AI Auto-Trading 24/7 Engine & Payout Gatekeeper Section */}
      <div className="w-full bg-[#0c1017] border border-[#1b2230] rounded-2xl p-3 flex flex-col gap-2.5 mt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2962ff]/10 border border-[#2962ff]/30 flex items-center justify-center text-[#2962ff]">
              <Bot size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>AI Cloud Engine 24/7</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  GCP FREE TIER
                </span>
              </div>
              <div className="text-[10px] text-gray-400">
                {language === 'ar'
                  ? 'تحليل الأخبار بذكاء اصطناعي + حارس نسبة العائد'
                  : 'Gemini News NLP + Payout Filter Gatekeeper'}
              </div>
            </div>
          </div>

          <button
            id="btn-toggle-advanced"
            onClick={() => setShowAdvancedEngine(!showAdvancedEngine)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-[#151a24] border border-[#222b3d] cursor-pointer"
          >
            <Sliders size={12} />
            <span>{showAdvancedEngine ? (language === 'ar' ? 'إخفاء' : 'Hide') : (language === 'ar' ? 'إعدادات' : 'Rules')}</span>
          </button>
        </div>

        {/* AI Live Sentiment Banner */}
        <div className="w-full bg-[#121824] border border-[#1d273a] rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#00c087]" />
            <span className="text-gray-300 font-medium">
              {language === 'ar' ? 'تأكيد الذكاء الاصطناعي:' : 'AI Sentiment:'}
            </span>
            <span className="text-[#00c087] font-bold">
              {sentimentState.score}% {sentimentState.direction}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {language === 'ar' ? sentimentState.confidenceAr : sentimentState.confidence}
          </span>
        </div>

        {/* Expandable Gatekeeper & Strategy Filters */}
        {showAdvancedEngine && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-[#1b2230] text-xs">
            {/* Payout Gatekeeper Filter (75%, 80%, 85%) */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">
                {language === 'ar' ? 'شرط الحد الأدنى للعائد:' : 'Payout Gatekeeper:'}
              </span>
              <div className="flex gap-1.5">
                {([75, 80, 85] as PayoutFilter[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPayoutFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      payoutFilter === p
                        ? 'bg-[#2962ff] text-white'
                        : 'bg-[#151a24] text-gray-400 hover:text-white border border-[#222b3d]'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Candle Indicator (1m, 5m, 15m) */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-medium">
                {language === 'ar' ? 'شمعة التحليل الفني:' : 'Analysis Candle:'}
              </span>
              <div className="flex gap-1.5">
                {(['1m', '5m', '15m'] as AnalysisCandle[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setAnalysisCandle(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      analysisCandle === c
                        ? 'bg-[#00c087] text-black font-extrabold'
                        : 'bg-[#151a24] text-gray-400 hover:text-white border border-[#222b3d]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Primary Glowing Action Button: START AUTO-TRADING */}
        <button
          id="btn-toggle-auto-trading"
          onClick={onToggleAutoTrading}
          className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isAutoTrading
              ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse'
              : 'bg-gradient-to-r from-[#00c087] to-[#00b07a] text-black font-extrabold shadow-[0_0_20px_rgba(0,192,135,0.3)] hover:shadow-[0_0_25px_rgba(0,192,135,0.5)] active:scale-[0.99]'
          }`}
        >
          <Zap size={16} className={isAutoTrading ? 'animate-spin' : ''} />
          <span>{isAutoTrading ? t.pauseAutoTrading : t.startAutoTrading}</span>
        </button>
      </div>
    </div>
  )
}
