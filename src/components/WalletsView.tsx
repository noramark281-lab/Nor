import React from 'react'
import { Wallet, ShieldCheck, ArrowDownLeft, ArrowUpRight, History, CheckCircle2, Lock } from 'lucide-react'
import { Language } from '../types'
import { getT } from '../lib/translations'

interface WalletsViewProps {
  language: Language
  availBalance: number
  onBack: () => void
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  language,
  availBalance,
  onBack,
}) => {
  const t = getT(language)

  return (
    <div className="flex flex-col gap-4 w-full p-2 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f2632] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <Wallet size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {language === 'ar' ? 'محفظة العقود الآجلة للأحداث' : 'Event Futures Wallet'}
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">MEXC Sub-Account & Blockpit Sync</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-3 py-1 bg-[#18202c] hover:bg-[#222c3d] text-gray-300 text-xs font-semibold rounded-lg border border-[#2b3544]"
        >
          {language === 'ar' ? 'رجوع للتداول' : 'Back to Trade'}
        </button>
      </div>

      {/* Main Total Balance Card */}
      <div className="bg-gradient-to-br from-[#131924] to-[#0c1017] border border-[#232c3d] rounded-2xl p-4 shadow-xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{language === 'ar' ? 'إجمالي الرصيد المقدر' : 'Total Estimated Balance'}</span>
          <span className="flex items-center gap-1 text-[#00c087] text-[11px] font-bold bg-[#00c087]/10 px-2 py-0.5 rounded">
            <CheckCircle2 size={12} />
            {language === 'ar' ? 'متصل وآمن' : 'Connected & Protected'}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            ${availBalance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </span>
          <span className="text-xs text-gray-400 font-semibold">USDT</span>
        </div>
        <span className="text-[11px] text-gray-500 font-mono">≈ 0.0450 BTC</span>
      </div>

      {/* API Key Architecture Badges */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0f141d] border border-[#1f2838] rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <ShieldCheck size={14} />
            <span>{language === 'ar' ? 'تكامل Blockpit' : 'Blockpit Audit'}</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {language === 'ar' ? 'صلاحيات قراءة فقط للضرائب والتتبع' : 'Strictly Read-Only Permissions for Tax & Audit'}
          </span>
          <span className="text-[9px] text-gray-500 font-mono mt-1">BLOCKPIT_MEXC_API_KEY</span>
        </div>

        <div className="bg-[#0f141d] border border-[#1f2838] rounded-xl p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Lock size={14} />
            <span>{language === 'ar' ? 'محرك التداول الآلي' : 'Murum-BOT Engine'}</span>
          </div>
          <span className="text-[10px] text-gray-400">
            {language === 'ar' ? 'تنفيذ صفقات العقود الآجلة السحابية' : 'Automated 24/7 Futures Execution on GCP VPS'}
          </span>
          <span className="text-[9px] text-gray-500 font-mono mt-1">BOT_MEXC_API_KEY</span>
        </div>
      </div>

      {/* Asset Breakdown */}
      <div className="bg-[#0e1219] border border-[#1e2533] rounded-xl p-3 flex flex-col gap-2">
        <span className="text-xs font-bold text-gray-300">
          {language === 'ar' ? 'الأصول المتاحة' : 'Available Assets'}
        </span>

        <div className="flex items-center justify-between py-2 border-b border-[#1a212e]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ₮
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Tether USD</span>
              <span className="text-[10px] text-gray-500">USDT</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold font-mono text-white block">
              {availBalance.toFixed(4)}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Free Margin</span>
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              ₿
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Bitcoin</span>
              <span className="text-[10px] text-gray-500">BTC</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold font-mono text-white block">0.0450</span>
            <span className="text-[10px] text-gray-400 font-mono">≈ $3,061.05</span>
          </div>
        </div>
      </div>
    </div>
  )
}
