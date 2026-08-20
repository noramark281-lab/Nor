import React from 'react'
import { Globe, Radio, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react'
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
    <header className="flex flex-col gap-2 w-full pt-1 pb-1">
      {/* Top Main Status Bar matching Screenshot */}
      <div className="flex items-center justify-between gap-2 px-1">
        {/* Brand & Glowing Golden Tab Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161a22] border border-[#2b313a]">
            <span className="w-2 h-2 rounded-full bg-[#00c087] animate-pulse"></span>
            <span className="font-extrabold text-xs tracking-wider text-white">MEXC</span>
          </div>

          {/* Event Futures Golden Pill Badge */}
          <div className="flex items-center px-3 py-1 rounded-full bg-[#1c1a14] border border-[#d4af37]/60 text-[#f5e6a3] shadow-[0_0_10px_rgba(212,175,55,0.2)]">
            <span className="font-bold text-xs">
              {language === 'ar' ? 'العقود الآجلة' : 'Event Futures'}
            </span>
          </div>
        </div>

        {/* Dynamic Language Switcher Button [ Language (EN | AR) ] with Globe */}
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141a24] hover:bg-[#1a2332] border border-[#00c087]/50 text-[#00c087] text-[11px] font-bold transition-all shadow-[0_0_10px_rgba(0,192,135,0.2)] active:scale-95 cursor-pointer"
          title="Switch Language (EN / AR)"
        >
          <Globe size={13} className="text-[#00c087]" />
          <span>{language === 'ar' ? 'اختيار اللغة (عربي | English)' : 'Language (EN | عربي)'}</span>
        </button>
      </div>

      {/* Mini Live News Box matching Screenshot */}
      <div className="w-full bg-[#0e131d] border border-[#1e2736] rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-1.5 overflow-hidden flex-1">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-[9px] text-emerald-300 font-bold shrink-0">
            <CheckCircle2 size={10} className="text-emerald-400" />
            <span>{language === 'ar' ? 'شاشة مصغرة للأخبار' : 'Live News Radar'}</span>
          </div>
          <p className="text-[11px] text-gray-200 truncate font-medium">
            ⚡ {language === 'ar'
              ? currentNews?.titleAr || 'أخبار عاجلة: قرار الفيدرالي بث مباشر... | قطاع التكنولوجيا يُظهر قوة... صعودي...'
              : currentNews?.title || 'FED Rate Decision Live: Macro liquidity inflow accelerates BTC surge...'}
          </p>
        </div>
        <span className="text-[9px] text-gray-400 font-mono shrink-0">
          [{currentNews?.source || 'CoinDesk, Bloomberg, Reuters'}]
        </span>
      </div>
    </header>
  )
}
