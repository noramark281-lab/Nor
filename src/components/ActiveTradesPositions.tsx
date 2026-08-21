import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Zap,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { Language, EventTrade, MarketData } from '../types';
import { translations } from '../utils/translations';

interface ActiveTradesPositionsProps {
  lang: Language;
  activeTrades: EventTrade[];
  tradeHistory: EventTrade[];
  marketData: MarketData;
  onClearHistory: () => void;
}

export const ActiveTradesPositions: React.FC<ActiveTradesPositionsProps> = ({
  lang,
  activeTrades,
  tradeHistory,
  marketData,
  onClearHistory,
}) => {
  const t = translations[lang];
  const [, setTick] = useState(0);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setTick((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatRemaining = (expiryTime: number) => {
    const diffSec = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const exportToCsv = () => {
    if (tradeHistory.length === 0) return;
    const headers = 'ID,Symbol,Direction,Stake(USDT),StrikePrice,ClosePrice,PayoutRate(%),PnL(USDT),Status,Origin,EntryTime,ExpiryTime\n';
    const rows = tradeHistory.map((tr) => (
      `"${tr.id}","${tr.symbol}","${tr.direction}",${tr.stake},${tr.strikePrice},${tr.closePrice || 0},${tr.payoutRate},${tr.pnl || 0},"${tr.status}","${tr.isAutoTrade ? 'Auto-Bot' : 'Manual'}","${new Date(tr.entryTime).toISOString()}","${new Date(tr.expiryTime).toISOString()}"`
    )).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mexc_event_futures_history_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Event Contracts Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.activePositions}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/40">
                  {activeTrades.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'عقود الأحداث الجارية مع المؤقت اللحظي حتى التسوية' : 'Live binary contracts with countdown timer towards expiry settlement'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {activeTrades.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-xs">
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-60" />
              <p className="font-medium">{t.noActiveTrades}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTrades.map((trade) => {
                const isCall = trade.direction === 'CALL';
                const isItm = isCall 
                  ? marketData.price >= trade.strikePrice 
                  : marketData.price <= trade.strikePrice;
                const remainingFormatted = formatRemaining(trade.expiryTime);
                const totalDurationSec = trade.durationMinutes * 60;
                const elapsedSec = Math.max(0, Math.floor((Date.now() - trade.entryTime) / 1000));
                const progressPct = Math.min(100, Math.max(0, (elapsedSec / totalDurationSec) * 100));
                const potentialProfit = (trade.stake * (trade.payoutRate / 100)).toFixed(2);

                return (
                  <div
                    key={trade.id}
                    className={`rounded-xl p-4 border transition-all relative overflow-hidden bg-slate-950/80 ${
                      isItm 
                        ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/40' 
                        : 'border-rose-500/50 shadow-lg shadow-rose-950/40'
                    }`}
                  >
                    {/* Top Status Bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono flex items-center gap-1 ${
                          isCall 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {isCall ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {trade.direction}
                        </span>

                        <span className="text-xs font-bold text-white font-mono">{trade.symbol}</span>

                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {trade.isAutoTrade ? t.autoBotTag : t.manualTag}
                        </span>
                      </div>

                      {/* ITM / OTM Pill */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${
                        isItm 
                          ? 'bg-emerald-500 text-slate-950 font-black animate-pulse' 
                          : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}>
                        {isItm ? t.inTheMoney : t.outOfTheMoney}
                      </span>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-3 gap-2 my-2 text-xs font-mono">
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">{t.strikePrice}</span>
                        <span className="font-bold text-slate-200">${trade.strikePrice.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">{t.currentPrice}</span>
                        <span className={`font-bold ${isItm ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${marketData.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">{t.potentialPayout}</span>
                        <span className="font-bold text-teal-300">+${potentialProfit}</span>
                      </div>
                    </div>

                    {/* Expiry Countdown & Progress Bar */}
                    <div className="mt-3 pt-2 border-t border-slate-900">
                      <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          {t.expiryCountdown}: <strong className="text-indigo-300 font-bold">{remainingFormatted}</strong>
                        </span>
                        <span className="text-slate-400">{trade.stake} USDT ({trade.payoutRate}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-850 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Closed Historical Trades Ledger */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{t.tradeHistory}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {tradeHistory.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'سجل العمليات المنتهية مع الأرباح والخسائر ونسب العائد' : 'Settled binary event contracts history with PnL and return on investment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCsv}
              disabled={tradeHistory.length === 0}
              id="export-trades-csv-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.exportCsv}</span>
            </button>

            <button
              onClick={onClearHistory}
              disabled={tradeHistory.length === 0}
              id="clear-trades-history-btn"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all disabled:opacity-40"
              title={t.clearHistory}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {tradeHistory.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-xs">
              <p>{t.noHistory}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3 px-2">{t.time}</th>
                    <th className="pb-3 px-2">{t.direction}</th>
                    <th className="pb-3 px-2">{t.strikePrice}</th>
                    <th className="pb-3 px-2">{lang === 'ar' ? 'سعر الإغلاق' : 'Close Price'}</th>
                    <th className="pb-3 px-2">{t.stake}</th>
                    <th className="pb-3 px-2">{t.pnl}</th>
                    <th className="pb-3 px-2">{t.status}</th>
                    <th className="pb-3 px-2">{t.triggerSource}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {tradeHistory.map((tr) => {
                    const isWon = tr.status === 'WON';
                    const isCall = tr.direction === 'CALL';

                    return (
                      <tr key={tr.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                          {new Date(tr.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-2 font-bold">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isCall ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {tr.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-300">${tr.strikePrice.toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-slate-300">${(tr.closePrice || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-2 text-slate-400">${tr.stake.toFixed(2)}</td>
                        <td className={`py-2.5 px-2 font-bold ${isWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWon ? `+${(tr.pnl || 0).toFixed(2)}` : `${(tr.pnl || 0).toFixed(2)}`} USDT
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`flex items-center gap-1 font-bold text-[10px] ${
                            isWon ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isWon ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {isWon ? t.won : t.lost}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 text-[10px]">
                          {tr.isAutoTrade ? t.autoBotTag : t.manualTag}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
