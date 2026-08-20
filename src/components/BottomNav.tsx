import React from 'react'
import { FileSpreadsheet, Wallet } from 'lucide-react'
import { Language } from '../types'

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
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-black border-t border-[#181a1f] flex items-center justify-around py-2 px-8 z-50 select-none">
      {/* Futures Tab */}
      <button
        onClick={() => onSelectTab('futures')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
          currentTab === 'futures' ? 'text-white' : 'text-[#6b7280] hover:text-gray-300'
        }`}
      >
        <FileSpreadsheet size={20} className={currentTab === 'futures' ? 'text-white' : 'text-[#6b7280]'} />
        <span className="text-[11px] font-semibold">
          {language === 'ar' ? 'العقود (Futures)' : 'Futures'}
        </span>
      </button>

      {/* Wallets Tab */}
      <button
        onClick={() => onSelectTab('wallets')}
        className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
          currentTab === 'wallets' ? 'text-white' : 'text-[#6b7280] hover:text-gray-300'
        }`}
      >
        <Wallet size={20} className={currentTab === 'wallets' ? 'text-white' : 'text-[#6b7280]'} />
        <span className="text-[11px] font-semibold">
          {language === 'ar' ? 'المحافظ (Wallets)' : 'Wallets'}
        </span>
      </button>
    </div>
  )
}
