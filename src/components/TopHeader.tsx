import React from 'react'
import { Language } from '../types'

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
    <header className="flex items-center justify-between w-full pt-1 pb-1.5 px-2 select-none">
      {/* Left: Trading News */}
      <button
        onClick={onOpenNews}
        className="text-[#9ea3ae] hover:text-white text-sm font-medium transition-colors flex items-center gap-1 cursor-pointer"
      >
        <span>{language === 'ar' ? 'أخبار التداول' : 'Trading News'}</span>
      </button>

      {/* Center: Event Futures Active Tab Title */}
      <div className="relative py-1">
        <span className="text-white text-sm font-bold tracking-tight">
          {language === 'ar' ? 'Event Futures' : 'Event Futures'}
        </span>
        {/* Subtle active underline indicator */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#2962ff] rounded-full"></div>
      </div>

      {/* Right: Language Switcher with Blue Diamond Icon matching screenshot */}
      <button
        onClick={onToggleLanguage}
        className="flex items-center gap-1 text-xs text-[#9ea3ae] hover:text-white transition-colors cursor-pointer"
        title="Toggle Language"
      >
        <span className="text-sm font-medium">{language === 'ar' ? 'اللغة' : 'Language'}</span>
        {/* Blue Diamond polygon matching the screenshot */}
        <div className="w-3.5 h-3.5 bg-[#2962ff] transform rotate-45 rounded-[1px] shadow-[0_0_6px_rgba(41,98,255,0.6)] flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-[#70a6ff] rounded-[0.5px]"></div>
        </div>
      </button>
    </header>
  )
}
