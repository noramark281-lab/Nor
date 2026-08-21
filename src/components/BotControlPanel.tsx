import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Settings, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  ShieldCheck, 
  Sliders, 
  Percent, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  Flame,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  Language, 
  BotConfig, 
  BotStatus, 
  TradeDirection, 
  TradeDuration, 
  CandleTimeframe, 
  MinPayoutThreshold 
} from '../types';
import { translations } from '../utils/translations';

interface BotControlPanelProps {
  lang: Language;
  config: BotConfig;
  status: BotStatus;
  onUpdateConfig: (newConfig: Partial<BotConfig>) => void;
  onToggleBot: () => void;
  onManualTrade: (direction: TradeDirection, duration: TradeDuration, stake: number) => void;
  currentBtcPrice: number;
  availableBalance: number;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({
  lang,
  config,
  status,
  onUpdateConfig,
  onToggleBot,
  onManualTrade,
  currentBtcPrice,
  availableBalance,
}) => {
  const t = translations[lang];
  const [manualStake, setManualStake] = useState<number>(config.stakeAmount);
  const [customStakeInput, setCustomStakeInput] = useState<string>(config.stakeAmount.toString());

  const isRunning = config.isEnabled;
  const payoutMultiplier = 1 + (config.minPayout / 100);
  const potentialGrossPayout = (manualStake * payoutMultiplier).toFixed(2);
  const potentialNetProfit = (manualStake * (config.minPayout / 100)).toFixed(2);

  const handleStakePreset = (val: number) => {
    setManualStake(val);
    setCustomStakeInput(val.toString());
    onUpdateConfig({ stakeAmount: val });
  };

  const handleCustomStakeChange = (valStr: string) => {
    setCustomStakeInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      setManualStake(num);
      onUpdateConfig({ stakeAmount: num });
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow ${
            isRunning ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-800 text-slate-400'
          }`}>
            <Zap className={`w-5 h-5 ${isRunning ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.botHeader}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                isRunning 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isRunning ? t.botRunning : t.botStopped}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {status === 'SCANNING' ? t.botScanning 
                : status === 'ANALYZING' ? t.botAnalyzing 
                : status === 'EXECUTING' ? t.botExecuting 
                : status === 'WAITING_EXPIRY' ? t.botWaiting 
                : (lang === 'ar' ? 'قم بتهيئة الإعدادات ثم اضغط على زر التشغيل' : 'Configure parameters and toggle Start to run auto-trading')}
            </p>
          </div>
        </div>

        {/* Master Start / Stop Toggle Button */}
        <button
          onClick={onToggleBot}
          id="master-bot-toggle-btn"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
            isRunning
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30'
          }`}
        >
          {isRunning ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunning ? t.stopBot : t.startBot}</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Middle: Configuration Parameters (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Row 1: Duration & Candle Timeframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Trade Duration Selector (10m, 30m) */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.tradeDuration}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['10m', '30m'] as TradeDuration[]).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => onUpdateConfig({ duration: dur })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all border ${
                      config.duration === dur
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {dur === '10m' ? t.duration10m : t.duration30m}
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Candle (1m, 5m, 15m) */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.analysisCandle}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['1m', '5m', '15m'] as CandleTimeframe[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => onUpdateConfig({ timeframe: tf })}
                    className={`py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                      config.timeframe === tf
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-600/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Min Payout Threshold (75%, 80%, 85%) & Min AI Confidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Min Payout */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.minPayout}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([75, 80, 85] as MinPayoutThreshold[]).map((payout) => (
                  <button
                    key={payout}
                    type="button"
                    onClick={() => onUpdateConfig({ minPayout: payout })}
                    className={`py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                      config.minPayout === payout
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {payout}%
                  </button>
                ))}
              </div>
            </div>

            {/* Min AI Confidence Filter */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.minAiConfidence}</span>
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">{config.minConfidence}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                step="5"
                value={config.minConfidence}
                onChange={(e) => onUpdateConfig({ minConfidence: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>70%</span>
                <span>80% (Rec)</span>
                <span>95%</span>
              </div>
            </div>
          </div>

          {/* Row 3: Stake Presets & Custom Input */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-teal-400" />
                <span>{t.stakeAmount}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {lang === 'ar' ? 'المتاح:' : 'Available:'} <span className="font-mono text-emerald-400 font-semibold">${availableBalance.toFixed(2)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[10, 25, 50, 100, 250].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleStakePreset(amount)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    manualStake === amount
                      ? 'bg-teal-600 text-white border-teal-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ${amount}
                </button>
              ))}

              <div className="relative flex-1 min-w-[90px]">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  min="1"
                  max={availableBalance}
                  value={customStakeInput}
                  onChange={(e) => handleCustomStakeChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                  placeholder="Custom"
                />
              </div>
            </div>
          </div>

          {/* Advanced Risk Controls Accordion */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Martingale Multiplier Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-semibold block">{t.martingaleMode}</span>
                <span className="text-[10px] text-slate-500">2x {lang === 'ar' ? 'عند خسارة الصفقة السابقة' : 'on previous loss'}</span>
              </div>
              <input
                type="checkbox"
                checked={config.martingaleEnabled}
                onChange={(e) => onUpdateConfig({ martingaleEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Cooldown Seconds */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-semibold block">{t.cooldownSeconds}</span>
                <span className="text-[10px] text-slate-500">30s {lang === 'ar' ? 'بين كل صفقة وأخرى' : 'delay between orders'}</span>
              </div>
              <select
                value={config.tradeCooldownSeconds}
                onChange={(e) => onUpdateConfig({ tradeCooldownSeconds: parseInt(e.target.value, 10) })}
                className="bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>120s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Manual Instant Overrides & Projected Payout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-slate-950/70 rounded-xl p-4 sm:p-5 border border-slate-800/80">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.manualOverrides}</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Strike: ${currentBtcPrice.toLocaleString()}
              </span>
            </div>

            {/* Projected Payout Box */}
            <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 mb-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{t.potentialPayout}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">${potentialGrossPayout} USDT</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{t.estimatedReturn}</span>
                <span className="font-mono font-bold text-teal-300">+${potentialNetProfit} (+{config.minPayout}%)</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800 text-slate-500">
                <span>{t.tradeDuration}:</span>
                <span className="font-mono font-semibold text-slate-300">{config.duration}</span>
              </div>
            </div>

            {/* Instant Manual Execution Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Manual CALL */}
              <button
                type="button"
                onClick={() => onManualTrade('CALL', config.duration, manualStake)}
                id="manual-call-override-btn"
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold border border-emerald-400/30 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-sm sm:text-base font-extrabold tracking-wide">CALL (صعود)</span>
                </div>
                <span className="text-[10px] text-emerald-100 font-mono">
                  {lang === 'ar' ? `توقع السعر أعلى من $${currentBtcPrice.toFixed(0)}` : `Price > $${currentBtcPrice.toFixed(0)}`}
                </span>
              </button>

              {/* Manual PUT */}
              <button
                type="button"
                onClick={() => onManualTrade('PUT', config.duration, manualStake)}
                id="manual-put-override-btn"
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold border border-rose-400/30 shadow-lg shadow-rose-900/30 transition-all active:scale-95"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowDownRight className="w-5 h-5 text-rose-200 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
                  <span className="text-sm sm:text-base font-extrabold tracking-wide">PUT (هبوط)</span>
                </div>
                <span className="text-[10px] text-rose-100 font-mono">
                  {lang === 'ar' ? `توقع السعر أقل من $${currentBtcPrice.toFixed(0)}` : `Price < $${currentBtcPrice.toFixed(0)}`}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-2 text-center text-[10px] text-slate-500 font-mono">
            {lang === 'ar' 
              ? 'تعتمد عقود الأحداث على سعر الإغلاق عند انتهاء المؤقت مقارنة بسعر الدخول' 
              : 'Event contracts settle binary outcome based on expiry price vs strike price'}
          </div>
        </div>
      </div>
    </div>
  );
};
