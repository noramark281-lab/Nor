import React from 'react';
import { 
  Zap, 
  Globe, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  AlertCircle, 
  DollarSign, 
  Activity,
  Cpu
} from 'lucide-react';
import { Language, MarketData, AccountBalance, BotStatus } from '../types';
import { translations } from '../utils/translations';
import { sounds } from '../utils/soundAlerts';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  marketData: MarketData;
  balance: AccountBalance;
  botStatus: BotStatus;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isSimulated: boolean;
  onToggleSimulation: () => void;
  activeTradesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  marketData,
  balance,
  botStatus,
  soundEnabled,
  onToggleSound,
  isSimulated,
  onToggleSimulation,
  activeTradesCount,
}) => {
  const t = translations[lang];
  const isPositive = marketData.change24h >= 0;

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 text-slate-100">
      {/* Top Banner / Ticker Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 shadow-lg shadow-emerald-500/20 text-white font-black text-xl">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>MEXC</span>
                <span className="text-emerald-400 font-extrabold">EventFutures</span>
                <span className="text-xs px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded font-mono">
                  AI-V3
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Real-time BTC Market Bar */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-semibold text-slate-400">BTC/USDT:</span>
            <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wide">
              ${marketData.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className={`flex items-center gap-0.5 text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
            isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
          }`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{isPositive ? '+' : ''}{marketData.change24h}%</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 border-l border-slate-800 pl-3">
            <div>
              <span className="text-slate-500 text-[10px] block">24h H</span>
              <span className="font-mono text-slate-300">${marketData.high24h.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">24h L</span>
              <span className="font-mono text-slate-300">${marketData.low24h.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Controls & Quick Info */}
        <div className="flex items-center gap-2">
          {/* Balance Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-none">{t.availableMargin}</span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                ${balance.availableMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Active Trades Counter */}
          {activeTradesCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 animate-pulse text-xs font-bold font-mono">
              <Activity className="w-3.5 h-3.5" />
              <span>{activeTradesCount} {lang === 'ar' ? 'صفقات نشطة' : 'Active'}</span>
            </div>
          )}

          {/* Mode Switcher */}
          <button
            onClick={onToggleSimulation}
            id="simulation-mode-toggle"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSimulated 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25' 
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
            }`}
            title={t.switchMode}
          >
            {isSimulated ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSimulated ? t.simulationMode : t.liveTrading}</span>
            <span className="sm:hidden">{isSimulated ? 'DEMO' : 'LIVE'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            id="sound-alert-toggle"
            className={`p-2 rounded-xl border text-xs transition-all ${
              soundEnabled
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title={soundEnabled ? t.soundOn : t.soundOff}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            id="language-toggle-btn"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs border border-indigo-400/40 shadow-sm transition-all active:scale-95"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
