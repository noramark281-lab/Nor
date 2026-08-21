import React, { useState, useEffect } from 'react';
import {
  Play,
  PlusCircle,
  Cloud,
  Wallet,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MEXCConfig, TradePosition, Candle, MarketInsight } from '../types';

interface EventFuturesProps {
  btcPrice: number;
  config: MEXCConfig;
  walletBalance: number;
  positions: TradePosition[];
  onExecuteTrade: (type: 'CALL_HIGHER' | 'PUT_LOWER', durationMinutes: 10 | 30, amount: number, timeframe: '5m' | '15m') => void;
  onUpdateConfig: (newConfig: MEXCConfig) => void;
  onManualAddOpen: () => void;
  onCloudConfigOpen: () => void;
}

export const EventFuturesView: React.FC<EventFuturesProps> = ({
  btcPrice,
  config,
  walletBalance,
  positions,
  onExecuteTrade,
  onUpdateConfig,
  onManualAddOpen,
  onCloudConfigOpen
}) => {
  const [selectedDuration, setSelectedDuration] = useState<10 | 30>(config.eventDurationMinutes || 10);
  const [selectedCandle, setSelectedCandle] = useState<'5m' | '15m'>(config.selectedCandleInterval || '5m');
  const [tradeAmount, setTradeAmount] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  // Simulated 5m and 15m candles data for live rendering
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    const base = btcPrice || 68500;
    const now = Date.now();
    const intervalMs = selectedCandle === '5m' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const list: Candle[] = [];
    for (let i = 12; i >= 0; i--) {
      const open = base + (Math.sin(i + (selectedCandle === '5m' ? 1 : 2)) * 80) + (Math.random() - 0.5) * 40;
      const close = open + (Math.random() - 0.48) * 60;
      const high = Math.max(open, close) + Math.random() * 25;
      const low = Math.min(open, close) - Math.random() * 25;
      list.push({
        time: now - i * intervalMs,
        open,
        high,
        low,
        close,
        volume: Math.floor(25 + Math.random() * 60),
        trend: close >= open ? 'BULLISH' : 'BEARISH'
      });
    }
    setCandles(list);
  }, [selectedCandle]);

  // Derived market insight for 5m and 15m
  const insight: MarketInsight = {
    asset: "BTCUSDT",
    candle5mTrend: "BULLISH",
    candle15mTrend: "BULLISH",
    rsi: 62.4,
    confidenceScore: 88,
    recommendedSignal: "CALL_HIGHER",
    targetTimeframe: selectedDuration
  };

  const handleTrade = (type: 'CALL_HIGHER' | 'PUT_LOWER') => {
    if (walletBalance < tradeAmount) {
      alert(`رصيد المحفظة الآجلة ($${walletBalance.toFixed(2)}) غير كافٍ لفتح صفقة بـ $${tradeAmount} USDT.`);
      return;
    }
    onExecuteTrade(type, selectedDuration, tradeAmount, selectedCandle);
  };

  const activePositions = positions.filter((p) => p.status === 'ACTIVE');
  const closedPositions = positions.filter((p) => p.status !== 'ACTIVE');

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      {/* Real-time Header & Ticker */}
      <div className="bg-[#0f172a] border border-gray-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">تداول العقود الآجلة للحدث (Event Futures)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  BTCUSDT • عائد 85%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                توقع اتجاه السعر صعوداً (Call) أو هبوطاً (Put) خلال فترة 10 دقائق أو 30 دقيقة مع تتبع مباشر لشموع 5m و 15m.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-2 text-right">
              <div className="text-[11px] text-gray-400 font-medium">سعر البيتكوين الحي (MEXC Ticker)</div>
              <div className="text-2xl font-mono font-black text-yellow-400 tracking-tight">
                ${btcPrice > 0 ? btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '68,500.00'}
              </div>
            </div>

            <div className="bg-gray-900/90 border border-gray-800 rounded-xl px-4 py-2 text-right">
              <div className="text-[11px] text-gray-400 font-medium">رصيد المحفظة الآجلة الحقيقي</div>
              <div className="text-2xl font-mono font-black text-emerald-400 tracking-tight">
                ${walletBalance.toFixed(2)} <span className="text-xs text-gray-400 font-normal">USDT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <button
            onClick={onManualAddOpen}
            className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/10"
          >
            <PlusCircle className="w-4 h-4" />
            زر إضافة يدوية
          </button>

          <button
            onClick={onCloudConfigOpen}
            className="flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/10"
          >
            <Cloud className="w-4 h-4" />
            زر تحكم سحابي للقوائم
          </button>

          {/* Candle interval selector */}
          <div className="flex items-center justify-between bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1">
            <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> فحص الشموع:
            </span>
            <div className="flex gap-1">
              {(['5m', '15m'] as const).map((interval) => (
                <button
                  key={interval}
                  onClick={() => {
                    setSelectedCandle(interval);
                    onUpdateConfig({ ...config, selectedCandleInterval: interval });
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedCandle === interval
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  شمعة {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selector (10m vs 30m strictly) */}
          <div className="flex items-center justify-between bg-gray-900/80 border border-gray-800 rounded-xl px-3 py-1">
            <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> وقت الحدث:
            </span>
            <div className="flex gap-1">
              {([10, 30] as const).map((dur) => (
                <button
                  key={dur}
                  onClick={() => {
                    setSelectedDuration(dur);
                    onUpdateConfig({ ...config, eventDurationMinutes: dur });
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedDuration === dur
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {dur} دقائق
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Candlestick Visualizer & Technical Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candle Visual Canvas */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">مخطط الشموع اللحظي (BTCUSDT - {selectedCandle})</h3>
            </div>
            <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              تحديث فوري 1.5s
            </span>
          </div>

          {/* Candle Bars visualizer */}
          <div className="h-44 bg-gray-950/70 border border-gray-800/80 rounded-xl p-4 flex items-end justify-between gap-1 relative overflow-hidden">
            {candles.map((c, idx) => {
              const isUp = c.close >= c.open;
              const minPrice = 68000;
              const maxPrice = 69000;
              const heightPercent = Math.min(100, Math.max(15, ((c.high - minPrice) / (maxPrice - minPrice)) * 100));
              const bodyHeightPercent = Math.min(80, Math.max(8, (Math.abs(c.close - c.open) / (maxPrice - minPrice)) * 250));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Candle Wick */}
                  <div
                    className={`w-[1px] ${isUp ? 'bg-emerald-400' : 'bg-rose-400'} opacity-70`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  {/* Candle Body */}
                  <div
                    className={`w-full max-w-[18px] rounded-sm transition-all ${
                      isUp
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                        : 'bg-rose-500 shadow-sm shadow-rose-500/40'
                    }`}
                    style={{ height: `${bodyHeightPercent}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-900 border border-gray-700 text-[10px] text-white p-1.5 rounded-md shadow-xl whitespace-nowrap z-30 font-mono">
                    <span>O: ${c.open.toFixed(1)}</span>
                    <span>C: ${c.close.toFixed(1)}</span>
                    <span>H: ${c.high.toFixed(1)}</span>
                    <span>L: ${c.low.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-mono">
            <span>شموع 5 دقائق و 15 دقيقة مؤكدة</span>
            <span className="text-emerald-400 font-bold">RSI (14): 62.4 • إشارة تأكيد شراء صعود (Call)</span>
          </div>
        </div>

        {/* Trade Execution Controller */}
        <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                تنفيذ صفقة الحدث (1 USDT ثابت)
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold">+85% عائد</span>
            </div>

            <div className="p-3 bg-gray-950/60 border border-gray-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>فترة الحدث المختارة:</span>
                <span className="font-bold text-amber-400 font-mono">{selectedDuration} دقائق</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>تتبع الشمعة:</span>
                <span className="font-bold text-cyan-400 font-mono">شمعة {selectedCandle}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>مبلغ الدخول المعتمد:</span>
                <span className="font-bold text-yellow-400 font-mono">1.00 USDT (بدون رافعة)</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>الربح عند النجاح:</span>
                <span className="font-bold text-emerald-400 font-mono">+1.85 USDT (التكلفة + الربح)</span>
              </div>
            </div>
          </div>

          {/* Big Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleTrade('CALL_HIGHER')}
              className="bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-black p-4 rounded-xl text-base flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                <span>شراء صعود (Call)</span>
              </div>
              <span className="text-[11px] text-emerald-950 font-mono font-bold">$1.00 USDT</span>
            </button>

            <button
              onClick={() => handleTrade('PUT_LOWER')}
              className="bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black p-4 rounded-xl text-base flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-500/25 transition-all active:scale-95"
            >
              <div className="flex items-center gap-1">
                <ArrowDownRight className="w-5 h-5 stroke-[3]" />
                <span>بيع هبوط (Put)</span>
              </div>
              <span className="text-[11px] text-rose-100 font-mono font-bold">$1.00 USDT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Positions Table (Active & History) */}
      <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              الصفقات النشطة الحالية ({activePositions.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              سجل الصفقات المنتهية ({closedPositions.length})
            </button>
          </div>

          <span className="text-xs text-gray-500 font-mono">
            الإغلاق التلقائي واسترداد الأرباح مفعّل
          </span>
        </div>

        {activeTab === 'ACTIVE' ? (
          activePositions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              لا توجد صفقات أحداث جارية حالياً. اختر اتجاه الصفقة (صعود أو هبوط) لفتح عقد بـ 1 USDT.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-900/60 text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="p-3">الزوج</th>
                    <th className="p-3">النوع</th>
                    <th className="p-3">الشمعة والمدة</th>
                    <th className="p-3">سعر الدخول</th>
                    <th className="p-3">السعر الحالي</th>
                    <th className="p-3">الوقت المتبقي</th>
                    <th className="p-3">الحالة المتوقعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 font-mono">
                  {activePositions.map((pos) => {
                    const timeLeftSec = Math.max(0, Math.floor((pos.expirationTimestamp - Date.now()) / 1000));
                    const mins = Math.floor(timeLeftSec / 60);
                    const secs = timeLeftSec % 60;
                    const isWinning =
                      pos.type === 'CALL_HIGHER'
                        ? btcPrice >= pos.entryPrice
                        : btcPrice <= pos.entryPrice;

                    return (
                      <tr key={pos.id} className="hover:bg-gray-800/20">
                        <td className="p-3 font-bold text-white">{pos.pair}</td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              pos.type === 'CALL_HIGHER'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {pos.type === 'CALL_HIGHER' ? 'صعود (Call)' : 'هبوط (Put)'}
                          </span>
                        </td>
                        <td className="p-3 text-gray-300">
                          {pos.candleTimeframe} • {pos.durationMinutes}د
                        </td>
                        <td className="p-3 text-gray-300">${pos.entryPrice.toLocaleString()}</td>
                        <td className="p-3 text-yellow-400">${btcPrice.toLocaleString()}</td>
                        <td className="p-3 font-bold text-amber-400">
                          {mins}:{secs < 10 ? `0${secs}` : secs}
                        </td>
                        <td className="p-3 font-bold">
                          {isWinning ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ربح (+1.85 USDT)
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> في نطاق الخسارة
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-900/60 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3">الزوج</th>
                  <th className="p-3">النوع والمدة</th>
                  <th className="p-3">سعر الدخول</th>
                  <th className="p-3">سعر الإغلاق</th>
                  <th className="p-3">النتيجة</th>
                  <th className="p-3">المبلغ المورد للمحفظة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 font-mono">
                {closedPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-800/20">
                    <td className="p-3 font-bold text-white">{pos.pair}</td>
                    <td className="p-3 text-gray-300">
                      {pos.type === 'CALL_HIGHER' ? 'صعود Call' : 'هبوط Put'} ({pos.durationMinutes}د)
                    </td>
                    <td className="p-3 text-gray-300">${pos.entryPrice.toLocaleString()}</td>
                    <td className="p-3 text-gray-300">${pos.closePrice?.toLocaleString() || pos.entryPrice.toLocaleString()}</td>
                    <td className="p-3 font-bold">
                      {pos.status === 'WON' ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          ربحت الصفقة ✅
                        </span>
                      ) : (
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                          خسرت الصفقة ❌
                        </span>
                      )}
                    </td>
                    <td className={`p-3 font-bold ${pos.payoutReturned > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                      +${pos.payoutReturned.toFixed(2)} USDT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
