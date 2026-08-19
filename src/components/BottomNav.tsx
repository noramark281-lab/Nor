import React from 'react'
import { Landmark, Wallet2 } from 'lucide-react'
import { Language } from '../types'
import { getT } from '../lib/translations'

interface BottomNavProps {
  language: Language
  currentTab: 'futures' | 'wallets'
  onSelectTab: (tab: 'futures' | 'wallets') => void
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  currentTab,
  onSelectTab,
}) => {
  const t = getT(language)

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-[#0a0d13] border-t border-[#1e2531] flex items-center justify-around py-2 px-6 z-50 backdrop-blur-md">
      <button
        onClick={() => onSelectTab('futures')}
        className={`flex flex-col items-center gap-1 transition-all ${
          currentTab === 'futures'
            ? 'text-[#00c087]'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition-all ${
            currentTab === 'futures' ? 'bg-[#00c087]/15 border border-[#00c087]/40 shadow-[0_0_10px_rgba(0,192,135,0.2)]' : ''
          }`}
        >
          <Landmark size={20} />
        </div>
        <span className="text-[11px] font-bold">{t.futuresNav}</span>
      </button>

      <button
        onClick={() => onSelectTab('wallets')}
        className={`flex flex-col items-center gap-1 transition-all ${
          currentTab === 'wallets'
            ? 'text-[#00c087]'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition-all ${
            currentTab === 'wallets' ? 'bg-[#00c087]/15 border border-[#00c087]/40 shadow-[0_0_10px_rgba(0,192,135,0.2)]' : ''
          }`}
        >
          <Wallet2 size={20} />
        </div>
        <span className="text-[11px] font-bold">{t.walletsNav}</span>
      </button>
    </div>
  )
}
