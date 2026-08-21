import React from 'react'
import { Language } from '../types'
import { Sparkles } from 'lucide-react'

interface TopHeaderProps {
  language: Language
  onToggleLanguage: () => void
  onOpenNews: () => void
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  language,
  onToggleLanguage,
  onOpenNews,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-3 py-2.5 bg-black border-b border-[#181d26] select-none">
      {/* Top Left: Trading News Widget Button */}
      <button
        id="btn-trading-news"
        onClick={onOpenNews}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#12161f] border border-[#202735] hover:border-[#2d384c] text-gray-300 hover:text-white transition-all text-xs font-medium cursor-pointer shadow-sm active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-[#00c087] animate-pulse"></span>
        <Sparkles size={13} className="text-[#00c087]" />
        <span className="font-semibold">
          {language === 'ar' ? 'أخبار التداول' : 'Trading News'}
        </span>
      </button>

      {/* Center: Event Futures Active Tab matching screenshot */}
      <div className="flex flex-col items-center justify-center relative cursor-default">
        <span className="text-sm font-bold text-white tracking-wide">
          Event Futures
        </span>
        <div className="w-8 h-[2.5px] bg-[#2962ff] rounded-full mt-0.5"></div>
      </div>

      {/* Top Right: Language Switcher Button matching screenshot (اللغة 🔷) */}
      <button
        id="btn-language-toggle"
        onClick={onToggleLanguage}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#12161f] border border-[#202735] hover:border-[#2962ff] text-gray-300 hover:text-white transition-all text-xs font-semibold cursor-pointer active:scale-95"
      >
        <span>{language === 'ar' ? 'اللغة' : 'Language'}</span>
        {/* MEXC Blue Diamond Icon */}
        <span className="text-[#2962ff] font-bold text-sm">🔷</span>
        <span className="text-[10px] uppercase font-mono text-[#2962ff] ml-0.5">
          {language === 'ar' ? 'AR' : 'EN'}
        </span>
      </button>
    </header>
  )
}
