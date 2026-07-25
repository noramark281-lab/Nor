import React from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  XCircle,
  Activity,
  BarChart3,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { AccountAsset, FuturesPosition, Language } from '../types';

interface AccountManagerProps {
  account: AccountAsset;
  positions: FuturesPosition[];
  lang: Language;
  onClosePosition: (positionId: string, symbol: string) => Promise<void>;
  onCloseAllPositions: () => Promise<void>;
}

export const AccountManager: React.FC<AccountManagerProps> = ({
  account,
  positions,
  lang,
  onClosePosition,
  onCloseAllPositions,
}) => {
  const isAr = lang === 'ar';

  const marginRatio = account.equity > 0 ? ((account.positionMargin / account.equity) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      
      {/* Wallet Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Equity */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isAr ? 'رصيد المحفظة الإجمالي (Equity)' : 'Total Wallet Equity'}</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {isAr ? 'القيمة الصافية المباشرة' : 'Net Liquidation Value'}
          </div>
        </div>

        {/* Available Margin */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isAr ? 'الهامش المتاح للتداول' : 'Available Balance'}</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            ${account.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {isAr ? 'جاهز لفتح صفقات جديدة' : 'Ready for New Orders'}
          </div>
        </div>

        {/* Position Margin */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isAr ? 'هامش الصفقات المفتوحة' : 'Position Margin'}</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">
            ${account.positionMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <span>{isAr ? 'نسبة الهامش المستغل' : 'Margin Usage'}:</span>
            <span className="font-bold text-amber-400">{marginRatio}%</span>
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>{isAr ? 'الأرباح/الخسائر غير المحققة' : 'Unrealized PnL'}</span>
            <TrendingUp className={`w-4 h-4 ${account.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${account.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {account.unrealizedPnL >= 0 ? '+' : ''}${account.unrealizedPnL.toFixed(2)} USDT
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {isAr ? 'عبر الصفقات المفتوحة حالياً' : 'Across Active Positions'}
          </div>
        </div>

      </div>

      {/* Positions Detail & Close All Controls */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'إدارة صفقات العقود الآجلة في حساب MEXC' : 'MEXC Futures Active Positions'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'مراقبة وإغلاق الصفقات المفتوحة مباشرة بالسعر اللحظي للسوق.' : 'Monitor live mark prices, leverage, and liquidation points.'}
            </p>
          </div>

          {positions.length > 0 && (
            <button
              onClick={onCloseAllPositions}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-950/40 transition-all flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>{isAr ? 'إغلاق جميع الصفقات فوراً' : 'Emergency Close All'}</span>
            </button>
          )}
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {isAr ? 'لا توجد صفقات مفتوحة حالياً في المحفظة.' : 'No open positions in your MEXC account right now.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positions.map(pos => {
              const isLong = pos.side === 'LONG';
              const isProfit = pos.unrealizedPnL >= 0;

              return (
                <div key={pos.id} className="bg-slate-950 rounded-xl border border-slate-800/90 p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-100 text-sm">{pos.symbol.replace('_', '/')}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {pos.side} {pos.leverage}x
                      </span>
                    </div>

                    <div className={`font-bold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({pos.unrealizedPnLPercent.toFixed(2)}%)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">{isAr ? 'سعر الدخول' : 'Entry Price'}:</span>
                      <span className="font-bold text-slate-200">${pos.entryPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isAr ? 'سعر التأشير الحالي' : 'Mark Price'}:</span>
                      <span className="font-bold text-slate-100">${pos.markPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isAr ? 'سعر التصفية المخاطر' : 'Liq Price'}:</span>
                      <span className="font-bold text-amber-400">${pos.liquidationPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isAr ? 'الهامش المستخدم' : 'Margin'}:</span>
                      <span className="font-bold text-slate-200">${pos.margin.toFixed(2)} USDT</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onClosePosition(pos.id, pos.symbol)}
                    className="w-full py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition-all text-xs"
                  >
                    {isAr ? 'إغلاق هذه الصفقة بالسوق' : 'Close Position Market'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
