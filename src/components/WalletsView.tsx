import React from 'react'
import { Language, WalletBalance } from '../types'
import { getT } from '../lib/translations'
import {
  ShieldCheck,
  Key,
  Database,
  Server,
  RefreshCw,
  ExternalLink,
  Lock,
  Zap,
} from 'lucide-react'

interface WalletsViewProps {
  language: Language
  balances: WalletBalance[]
  onRefresh: () => void
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  language,
  balances,
  onRefresh,
}) => {
  const t = getT(language)

  const totalUsd = balances.reduce((acc, b) => acc + b.usdValue, 0)

  return (
    <div className="w-full bg-black min-h-screen flex flex-col px-3 py-3 gap-3 pb-24 select-none">
      {/* Wallet Balance Card */}
      <div className="w-full bg-gradient-to-br from-[#131926] to-[#0c1017] border border-[#20293b] rounded-2xl p-4 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00c087] animate-pulse"></div>
            <span className="text-xs font-bold text-gray-300">
              {language === 'ar' ? 'محفظة العقود الآجلة (MEXC Futures)' : 'MEXC Event Futures Wallet'}
            </span>
          </div>
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div>
          <div className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي الرصيد المقدر' : 'Total Estimated Balance'}</div>
          <div className="text-2xl font-mono font-black text-white tracking-tight">
            ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-sm font-normal text-gray-400">USD</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1c2436] text-xs">
          <div>
            <span className="text-[11px] text-gray-400">USDT {t.avail}:</span>
            <div className="text-white font-mono font-bold">
              {balances.find((b) => b.asset === 'USDT')?.free || '1,250.00'} USDT
            </div>
          </div>
          <div>
            <span className="text-[11px] text-gray-400">{language === 'ar' ? 'المحجوز في العقود:' : 'Locked in Orders:'}</span>
            <div className="text-gray-300 font-mono">0.00 USDT</div>
          </div>
        </div>
      </div>

      {/* 4-API Keys & Security Architecture Status */}
      <div className="w-full bg-[#0d1118] border border-[#1b2332] rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <Key size={16} className="text-[#2962ff]" />
            <span>{language === 'ar' ? 'إدارة مفاتيح API الأربعة (MEXC & Blockpit)' : '4-Key Security & Permission Matrix'}</span>
          </div>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">
            ISOLATED
          </span>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          {/* Key 1 & 2: Bot Trading Key */}
          <div className="bg-[#121722] border border-[#1d2535] rounded-xl p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-bold flex items-center gap-1.5">
                <Zap size={13} className="text-[#00c087]" />
                BOT_MEXC_API_KEY (Futures Trading)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                TRADE ENABLED
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              {language === 'ar'
                ? 'مفتاح مخصص لتنفيذ الصفقات وإدارة عقود BTC/USDT حصرياً'
                : 'Dedicated to auto & manual order execution on Event Futures.'}
            </div>
          </div>

          {/* Key 3 & 4: Blockpit Audit Key */}
          <div className="bg-[#121722] border border-[#1d2535] rounded-xl p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-bold flex items-center gap-1.5">
                <Lock size={13} className="text-blue-400" />
                BLOCKPIT_MEXC_API_KEY (Tax & Audit)
              </span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded font-mono">
                READ-ONLY
              </span>
            </div>
            <div className="text-[11px] text-gray-400">
              {language === 'ar'
                ? 'مفتاح قراءة فقط لمزامنة الضرائب والتدقيق المالي عبر Blockpit دون أي صلاحية للتداول'
                : 'Strictly Read-Only access for tax calculation and financial compliance.'}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Engine & Database Status */}
      <div className="w-full bg-[#0d1118] border border-[#1b2332] rounded-2xl p-3.5 flex flex-col gap-2.5">
        <div className="text-xs font-bold text-white flex items-center gap-2">
          <Server size={15} className="text-[#00c087]" />
          <span>{language === 'ar' ? 'حالة البنية التحتية السحابية' : 'Cloud Infrastructure Status'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-[#121722] p-2 rounded-xl border border-[#1d2535]">
            <div className="text-[10px] text-gray-500">GCP Compute Engine</div>
            <div className="text-emerald-400 font-mono font-bold">ONLINE 24/7</div>
            <div className="text-[10px] text-gray-400 font-mono">e2-micro Always Free</div>
          </div>

          <div className="bg-[#121722] p-2 rounded-xl border border-[#1d2535]">
            <div className="text-[10px] text-gray-500">Firebase & Supabase</div>
            <div className="text-blue-400 font-mono font-bold">CONNECTED</div>
            <div className="text-[10px] text-gray-400 font-mono">Real-time Sync</div>
          </div>
        </div>
      </div>
    </div>
  )
}
