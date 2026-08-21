import React, { useState } from 'react';
import { 
  Wallet, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  RotateCcw, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign,
  ExternalLink,
  Cpu,
  Lock
} from 'lucide-react';
import { Language, AccountBalance, MexcCredentials } from '../types';
import { translations } from '../utils/translations';

interface MexcWalletSettingsProps {
  lang: Language;
  balance: AccountBalance;
  mexcCreds: MexcCredentials;
  onSaveCreds: (creds: MexcCredentials) => void;
  onResetBalance: () => void;
}

export const MexcWalletSettings: React.FC<MexcWalletSettingsProps> = ({
  lang,
  balance,
  mexcCreds,
  onSaveCreds,
  onResetBalance,
}) => {
  const t = translations[lang];
  const [apiKey, setApiKey] = useState(mexcCreds.apiKey);
  const [secretKey, setSecretKey] = useState(mexcCreds.secretKey);
  const [isTestnet, setIsTestnet] = useState(mexcCreds.isTestnet);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/mexc/validate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secretKey, isTestnet }),
      });
      const data = await res.json();

      if (data.success) {
        onSaveCreds({
          apiKey,
          secretKey,
          isTestnet,
          isValid: true,
        });
        setTestResult({
          success: true,
          message: lang === 'ar' 
            ? 'تم التحقق من مفاتيح MEXC وتفعيل التداول بنجاح!' 
            : 'MEXC API credentials verified successfully!'
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || (lang === 'ar' ? 'فشل التحقق من المفاتيح' : 'Failed to validate API credentials')
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection error'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const isPositivePnl = balance.todayPnl >= 0;

  return (
    <div className="space-y-6">
      {/* 1. Account Equity & Performance Grid */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.walletHeader}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  balance.isSimulated 
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}>
                  {balance.isSimulated ? t.simulationMode : t.liveTrading}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'إجمالي الرصيد والهامش المتاح والأداء التراكمي' : 'Real-time margin allocation and portfolio win rate metrics'}
              </p>
            </div>
          </div>

          <button
            onClick={onResetBalance}
            id="reset-demo-balance-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.resetDemoBalance}</span>
          </button>
        </div>

        {/* Financial Metrics Cards */}
        <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t.totalBalance}</span>
            <span className="text-lg sm:text-2xl font-bold font-mono text-white">
              ${balance.totalUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">USDT Equity</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t.availableMargin}</span>
            <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-400">
              ${balance.availableMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">Ready for deployment</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t.todayPnl}</span>
            <span className={`text-lg sm:text-2xl font-bold font-mono ${isPositivePnl ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositivePnl ? '+' : ''}${balance.todayPnl.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">Net Realized PnL</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">{t.winRate}</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-2xl font-bold font-mono text-cyan-400">
                {balance.winRate.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({balance.winsCount}W / {balance.lossesCount}L)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">Event Contracts Accuracy</span>
          </div>
        </div>
      </div>

      {/* 2. MEXC API Configuration Form */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.mexcApiConfig}</span>
                {mexcCreds.isValid && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lang === 'ar' ? 'متصل' : 'Connected'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar' 
                  ? 'قم بإدخال مفاتيح API الخاصة بك من منصة MEXC لتفعيل التنفيذ المباشر' 
                  : 'Enter your MEXC Contract/Futures API keys to enable live event execution'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleTestAndSave} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.apiKeyLabel}</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="mx0vgl... (MEXC API Access Key)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Secret Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.secretKeyLabel}</span>
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Testnet Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mexc-testnet-check"
              checked={isTestnet}
              onChange={(e) => setIsTestnet(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
            <label htmlFor="mexc-testnet-check" className="text-xs text-slate-300 font-medium cursor-pointer">
              {t.testnetToggle}
            </label>
          </div>

          {/* Test Feedback Message */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              {lang === 'ar' 
                ? 'يتم تخزين المفاتيح محلياً ومشفرة دون مشاركتها مع أي طرف ثالث' 
                : 'API keys are stored securely in local browser session'}
            </span>

            <button
              type="submit"
              disabled={isTesting}
              id="save-mexc-api-keys-btn"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isTesting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>{lang === 'ar' ? 'جاري التحقق...' : 'Testing Connection...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t.saveApiKeys}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
