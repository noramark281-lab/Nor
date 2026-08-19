import React from 'react'
import { Globe, Radio, TrendingUp, Sparkles } from 'lucide-react'
import { Language, NewsItem, AISentimentState } from '../types'
import { getT } from '../lib/translations'

interface TopHeaderProps {
  language: Language
  onToggleLanguage: () => void
  currentNews?: NewsItem
  sentiment: AISentimentState
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  language,
  onToggleLanguage,
  currentNews,
  sentiment,
}) => {
  const t = getT(language)

  return (
    <header className="flex flex-col gap-2 w-full pt-1 pb-2 border-b border-[#1f2630]">
      {/* Top Main Status Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        {/* Brand & Market Type */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#161a22] border border-[#2b313a]">
            <span className="w-2 h-2 rounded-full bg-[#00c087] animate-ping"></span>
            <span className="font-bold text-xs tracking-wider text-white">MEXC</span>
            <span className="text-gray-500 text-xs">|</span>
            <span className="text-xs text-gray-300 font-medium">{t.eventFutures}</span>
          </div>
        </div>

        {/* Dynamic Language Switcher Button [ Language (EN | AR) ] replacing static Crude Oil */}
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18202c] hover:bg-[#202b3b] border border-[#00c087]/40 text-emerald-400 text-[11px] font-semibold transition-all shadow-[0_0_8px_rgba(0,192,135,0.15)] active:scale-95"
          title="Switch Language (EN/AR)"
        >
          <Globe size={13} className="text-[#00c087]" />
          <span>{t.languageSwitch}</span>
        </button>
      </div>

      {/* Mini Live News Box on Top Left / Center */}
      <div className="w-full bg-[#111620] border border-[#1e2735] rounded-md px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-[9px] text-emerald-300 font-bold shrink-0">
            <Radio size={10} className="animate-pulse text-emerald-400" />
            <span>{t.hotBadge}</span>
          </div>
          <p className="text-[11px] text-gray-200 truncate font-medium">
            {language === 'ar'
              ? currentNews?.titleAr || 'قرار الفيدرالي بث مباشر: تدفق السيولة المؤسسية يدعم موجة صعود البيتكوين'
              : currentNews?.title || 'FED Rate Decision Live: Macro liquidity inflow accelerates BTC surge...'}
          </p>
        </div>
        <span className="text-[9px] text-gray-400 font-mono shrink-0">
          [{currentNews?.source || 'CoinDesk, Bloomberg'}]
        </span>
      </div>
    </header>
  )
}
