import React from 'react'
import { Language } from '../types'
import { getT } from '../lib/translations'
import { FileText, Wallet } from 'lucide-react'

interface BottomNavProps {
  language: Language
  activeTab: 'futures' | 'wallets'
  onChangeTab: (tab: 'futures' | 'wallets') => void
}

export const BottomNav: React.FC<BottomNavProps> = ({
  language,
  activeTab,
  onChangeTab,
}) => {
  const t = getT(language)

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t border-[#181d26] grid grid-cols-2 py-2 select-none z-30">
      {/* Futures Tab */}
      <button
        id="nav-futures"
        onClick={() => onChangeTab('futures')}
        className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
          activeTab === 'futures' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <div className="relative">
          <FileText size={20} className={activeTab === 'futures' ? 'stroke-[2.5]' : ''} />
          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#2962ff] rounded-full"></div>
        </div>
        <span className="text-xs font-bold">{t.futures}</span>
      </button>

      {/* Wallets Tab */}
      <button
        id="nav-wallets"
        onClick={() => onChangeTab('wallets')}
        className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
          activeTab === 'wallets' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <Wallet size={20} className={activeTab === 'wallets' ? 'stroke-[2.5]' : ''} />
        <span className="text-xs font-bold">{t.wallets}</span>
      </button>
    </nav>
  )
}
