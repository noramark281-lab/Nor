import React from 'react';
import {
  TrendingUp,
  Bot,
  BrainCircuit,
  Wallet,
  Key,
  Globe,
  Zap,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Language, TradingMode } from '../types';

interface HeaderProps {
  activeTab: 'terminal' | 'bot' | 'ai' | 'account' | 'settings';
  setActiveTab: (tab: 'terminal' | 'bot' | 'ai' | 'account' | 'settings') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  mode: TradingMode;
  setMode: (mode: TradingMode) => void;
  isApiConfigured: boolean;
  totalEquity: number;
  unrealizedPnL: number;
  runningBotsCount: number;
  onOpenMobileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  mode,
  setMode,
  isApiConfigured,
  totalEquity,
  unrealizedPnL,
  runningBotsCount,
  onOpenMobileModal,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer" onClick={() => setActiveTab('terminal')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
                  MEXC Futures
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.5 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isAr ? 'منصة التداول الآلي والعقود الآجلة 24/7' : '24/7 Cloud Trading & Automated Bot'}
              </p>
            </div>
          </div>

          {/* Account Metrics Bar */}
          <div className="hidden lg:flex items-center space-x-6 rtl:space-x-reverse bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800/80 text-xs">
            <div>
              <div className="text-slate-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'رصيد المحفظة (USDT)' : 'Wallet Equity'}</span>
              </div>
              <div className="font-mono font-bold text-sm text-slate-100">
                ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="w-px h-7 bg-slate-800" />

            <div>
              <div className="text-slate-400">
                {isAr ? 'الأرباح غير المحققة' : 'Unrealized PnL'}
              </div>
              <div className={`font-mono font-bold text-sm ${unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {unrealizedPnL >= 0 ? '+' : ''}${unrealizedPnL.toFixed(2)}
              </div>
            </div>

            <div className="w-px h-7 bg-slate-800" />

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${runningBotsCount > 0 ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${runningBotsCount > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <div>
                <div className="text-slate-400">{isAr ? 'البوت السحابي' : 'Cloud Bot'}</div>
                <div className="font-semibold text-slate-200">
                  {runningBotsCount > 0 ? `${runningBotsCount} ${isAr ? 'نشط' : 'Active'}` : (isAr ? 'متوقف' : 'Paused')}
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls (Mode, API Badge, Language, Mobile Link) */}
          <div className="flex items-center space-x-2 sm:space-x-3 rtl:space-x-reverse">
            
            {/* Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex text-xs font-medium">
              <button
                onClick={() => setMode('live')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  mode === 'live'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{isAr ? 'تداول حقيقي' : 'MEXC Live'}</span>
              </button>
              <button
                onClick={() => setMode('simulation')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                  mode === 'simulation'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>{isAr ? 'تجريبي' : 'Demo'}</span>
              </button>
            </div>

            {/* API Status Badge */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isApiConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isApiConfigured ? (isAr ? 'MEXC متصل' : 'MEXC Connected') : (isAr ? 'ربط API' : 'Connect API')}</span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
              title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            >
              <Globe className="w-4 h-4" />
              <span className="font-bold">{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* APK & App Link Button */}
            <button
              onClick={onOpenMobileModal}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-900/30 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'تحميل APK / سحابة' : 'Download APK'}</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 rtl:space-x-reverse overflow-x-auto py-2 no-scrollbar border-t border-slate-800/80 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'terminal'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isAr ? 'منصة التداول المباشرة' : 'Trading Terminal'}</span>
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'bot'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{isAr ? 'التداول السحابي الآلي (24h)' : '24/7 Cloud Bot'}</span>
            {runningBotsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 font-bold text-[10px]">
                {runningBotsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'ai'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-cyan-300" />
            <span>{isAr ? 'محلل Gemini الذكي' : 'Gemini AI Analyst'}</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'account'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>{isAr ? 'المحفظة والصفقات' : 'Wallet & Positions'}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{isAr ? 'إعدادات مفاتيح MEXC' : 'MEXC API Settings'}</span>
          </button>
        </nav>

      </div>
    </header>
  );
};
