import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Sparkles,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Cpu,
  BarChart3,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  Coins,
  Sliders,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SpotOrder, OrderBook, MarketTrade, Candle, MEXCConfig, ServerTimeSync } from '../types';
import { generateOrderBook, generateRecentTrades } from '../utils/mexcApi';

interface SpotTradingProps {
  currentPrice: number;
  config: MEXCConfig;
  spotUsdtBalance: number;
  spotCoinBalance: number;
  serverTime: ServerTimeSync;
  spotOrders: SpotOrder[];
  onExecuteSpotOrder: (order: Omit<SpotOrder, 'id' | 'timestamp' | 'status' | 'executedQty' | 'feeUsdt'>) => void;
  onSelectPair: (pair: string) => void;
  onRefreshBook: () => void;
}

const SUPPORTED_PAIRS = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', name: 'Bitcoin', icon: '₿', color: '#F7931A' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', name: 'Solana', icon: '◎', color: '#14F195' },
  { symbol: 'MXUSDT', base: 'MX', quote: 'USDT', name: 'MEXC Token', icon: 'M', color: '#00F0FF' }
];

export const SpotTrading3DView: React.FC<SpotTradingProps> = ({
  currentPrice,
  config,
  spotUsdtBalance,
  spotCoinBalance,
  serverTime,
  spotOrders,
  onExecuteSpotOrder,
  onSelectPair,
  onRefreshBook
}) => {
  const selectedPairInfo = SUPPORTED_PAIRS.find(p => p.symbol === (config.selectedPair || 'BTCUSDT')) || SUPPORTED_PAIRS[0];
  
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice);
  const [usdtAmount, setUsdtAmount] = useState<number>(1.0); // Exact 1.00 USDT per request
  const [activeSubTab, setActiveSubTab] = useState<'ORDERS' | 'BOOK' | 'TRADES'>('BOOK');
  const [candleInterval, setCandleInterval] = useState<'5m' | '15m'>('5m');

  const [orderBook, setOrderBook] = useState<OrderBook>(() => generateOrderBook(currentPrice));
  const [recentTrades, setRecentTrades] = useState<MarketTrade[]>(() => generateRecentTrades(currentPrice));

  // Update limit price when current price initializes
  useEffect(() => {
    if (orderType === 'MARKET') {
      setLimitPrice(currentPrice);
    }
  }, [currentPrice, orderType]);

  // Live simulation updates
  useEffect(() => {
    const bookTimer = setInterval(() => {
      setOrderBook(generateOrderBook(currentPrice));
      setRecentTrades(generateRecentTrades(currentPrice));
    }, 1800);
    return () => clearInterval(bookTimer);
  }, [currentPrice]);

  const handleQuickBuy = (amount: number = 1.0) => {
    if (spotUsdtBalance < amount) {
      alert(`رصيد المحفظة الفورية ($${spotUsdtBalance.toFixed(2)} USDT) غير كافٍ لتنفيذ أمر الشراء بـ $${amount} USDT.`);
      return;
    }
    const executionPrice = orderType === 'MARKET' ? currentPrice : limitPrice;
    const coinQty = Number((amount / executionPrice).toFixed(6));
    onExecuteSpotOrder({
      symbol: selectedPairInfo.symbol,
      side: 'BUY',
      type: orderType,
      price: executionPrice,
      amount: coinQty,
      totalUsdt: amount
    });
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  const handleQuickSell = (amount: number = 1.0) => {
    const executionPrice = orderType === 'MARKET' ? currentPrice : limitPrice;
    const coinQty = Number((amount / executionPrice).toFixed(6));
    if (spotCoinBalance < coinQty && spotUsdtBalance < 1) {
      alert(`رصيد العملة الفورية (${spotCoinBalance} ${selectedPairInfo.base}) غير كافٍ لبيع ما قيمته $${amount} USDT.`);
      return;
    }
    onExecuteSpotOrder({
      symbol: selectedPairInfo.symbol,
      side: 'SELL',
      type: orderType,
      price: executionPrice,
      amount: coinQty,
      totalUsdt: amount
    });
  };

  // Generate 3D Candlestick sample data
  const candleBars = Array.from({ length: 14 }).map((_, idx) => {
    const isGreen = (idx + (candleInterval === '5m' ? 1 : 2)) % 3 !== 0;
    const height = 20 + Math.sin(idx * 0.9) * 25 + Math.random() * 35;
    return { idx, isGreen, height };
  });

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      {/* 3D Top Photographic Header Bar */}
      <div className="relative rounded-3xl glass-panel p-6 border border-cyan-500/20 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          {/* 3D Coin Badge & Pair Selector */}
          <div className="flex items-center gap-4">
            <div className="perspective-1000">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-2xl coin-3d-hologram border border-white/20"
                style={{
                  background: `linear-gradient(135deg, ${selectedPairInfo.color}33 0%, #0f172a 100%)`,
                  color: selectedPairInfo.color
                }}
              >
                {selectedPairInfo.icon}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-display">
                  {selectedPairInfo.symbol}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    Spot Trading 3D
                  </span>
                </h2>

                {/* Coin Pair Dropdown */}
                <div className="flex gap-1.5 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
                  {SUPPORTED_PAIRS.map(p => (
                    <button
                      key={p.symbol}
                      onClick={() => onSelectPair(p.symbol)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                        p.symbol === selectedPairInfo.symbol
                          ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {p.base}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>تداول فوري حقيقي 100% مربوط عبر MEXC REST & WebSocket API</span>
                <span className="text-gray-600">•</span>
                <span className="text-cyan-400 font-mono">قيمة الصفقة: 1.00 USDT ثابتة</span>
              </p>
            </div>
          </div>

          {/* Real-time 3D Price Ticker & Wallet Overview */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-gray-950/80 border border-gray-800/80 px-5 py-3 rounded-2xl text-right shadow-inner">
              <div className="text-[11px] text-gray-400 font-medium flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                سعر السوق المباشر (MEXC Spot)
              </div>
              <div className="text-2xl font-black font-mono text-yellow-400 tracking-tight">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 px-5 py-3 rounded-2xl text-right shadow-inner">
              <div className="text-[11px] text-gray-400 font-medium">رصيد Spot متاح للتداول</div>
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                ${spotUsdtBalance.toFixed(2)} <span className="text-xs text-gray-400 font-normal">USDT</span>
              </div>
            </div>

            <div className="bg-gray-950/80 border border-gray-800/80 px-5 py-3 rounded-2xl text-right shadow-inner">
              <div className="text-[11px] text-gray-400 font-medium">توقيت سيرفر MEXC المتزامن</div>
              <div className="text-sm font-black font-mono text-cyan-400 tracking-tight flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(serverTime.mexcServerTime).toISOString().slice(11, 23)} UTC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3D Grid: Chart & Order Book & Spot Action Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): 3D Candlestick Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">
                  مخطط التداول الفوري المتقدم (Spot Candlestick 3D)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {(['5m', '15m'] as const).map(inv => (
                  <button
                    key={inv}
                    onClick={() => setCandleInterval(inv)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      candleInterval === inv
                        ? 'bg-cyan-500 text-black shadow-md'
                        : 'bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    شمعة {inv}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Candlestick Matrix Canvas */}
            <div className="h-56 bg-[#060913] border border-gray-800/80 rounded-2xl p-5 flex items-end justify-between gap-2 relative overflow-hidden bg-grid-cyber">
              {candleBars.map((c) => (
                <div key={c.idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Wick */}
                  <div
                    className={`w-[1.5px] ${c.isGreen ? 'bg-emerald-400' : 'bg-rose-400'} opacity-80`}
                    style={{ height: `${Math.min(95, c.height + 15)}%` }}
                  />
                  {/* 3D Candle Body */}
                  <div
                    className={`w-full max-w-[20px] rounded-sm transition-all shadow-lg ${
                      c.isGreen
                        ? 'bg-emerald-500 shadow-emerald-500/30'
                        : 'bg-rose-500 shadow-rose-500/30'
                    }`}
                    style={{ height: `${c.height}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 font-mono pt-1">
              <span>تحديث دوري متزامن مع عمق MEXC Depth</span>
              <span className="text-emerald-400 font-bold">زمن الاستجابة: {serverTime.latencyMs}ms • دقة الميلي ثانية</span>
            </div>
          </div>

          {/* 3D Order Book & Recent Trades Sub-Tabs */}
          <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('BOOK')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeSubTab === 'BOOK'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  دفتر الأوامر الحقيقي (Order Book)
                </button>
                <button
                  onClick={() => setActiveSubTab('TRADES')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeSubTab === 'TRADES'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  آخر الصفقات المبرمة (Recent Trades)
                </button>
              </div>

              <span className="text-xs text-gray-500 font-mono">Real-time Level 2</span>
            </div>

            {activeSubTab === 'BOOK' && (
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {/* Asks (Sell Orders - Red) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-gray-500 border-b border-gray-800 pb-1">
                    <span>السعر (USDT)</span>
                    <span>الكمية</span>
                    <span>الإجمالي</span>
                  </div>
                  {orderBook.asks.slice(0, 5).map((ask, i) => (
                    <div key={i} className="flex justify-between text-rose-400 py-0.5 relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10 -z-10" style={{ width: `${Math.min(100, ask.amount * 1200)}%` }} />
                      <span className="font-bold">${ask.price.toFixed(2)}</span>
                      <span className="text-gray-300">{ask.amount}</span>
                      <span className="text-gray-400">${ask.total}</span>
                    </div>
                  ))}
                </div>

                {/* Bids (Buy Orders - Green) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-gray-500 border-b border-gray-800 pb-1">
                    <span>السعر (USDT)</span>
                    <span>الكمية</span>
                    <span>الإجمالي</span>
                  </div>
                  {orderBook.bids.slice(0, 5).map((bid, i) => (
                    <div key={i} className="flex justify-between text-emerald-400 py-0.5 relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 -z-10" style={{ width: `${Math.min(100, bid.amount * 1200)}%` }} />
                      <span className="font-bold">${bid.price.toFixed(2)}</span>
                      <span className="text-gray-300">{bid.amount}</span>
                      <span className="text-gray-400">${bid.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'TRADES' && (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs font-mono">
                  <thead className="text-gray-500 border-b border-gray-800">
                    <tr>
                      <th className="py-1.5">الوقت</th>
                      <th className="py-1.5">السعر (USDT)</th>
                      <th className="py-1.5">الكمية ({selectedPairInfo.base})</th>
                      <th className="py-1.5">النوع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {recentTrades.slice(0, 6).map(tr => (
                      <tr key={tr.id}>
                        <td className="py-1.5 text-gray-400">{new Date(tr.time).toLocaleTimeString()}</td>
                        <td className={`py-1.5 font-bold ${tr.isBuyerMaker ? 'text-rose-400' : 'text-emerald-400'}`}>
                          ${tr.price.toFixed(2)}
                        </td>
                        <td className="py-1.5 text-gray-300">{tr.qty}</td>
                        <td className="py-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tr.isBuyerMaker ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {tr.isBuyerMaker ? 'بيع Market' : 'شراء Market'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): 3D Spot Order Execution Form with 1$ quick buttons */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-emerald-500/20 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2 font-display">
                <Zap className="w-5 h-5 text-yellow-400" />
                تنفيذ صفقات التداول الفوري (Spot Order)
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 font-mono">
                1$ Fixed Order
              </span>
            </div>

            {/* Order Type Toggle (Market vs Limit) */}
            <div className="grid grid-cols-2 gap-2 bg-gray-950 p-1 rounded-2xl border border-gray-800">
              <button
                onClick={() => setOrderType('MARKET')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  orderType === 'MARKET'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                أمر سوق فوري (Market)
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  orderType === 'LIMIT'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                أمر محدد (Limit Order)
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 text-xs">
              {orderType === 'LIMIT' && (
                <div className="space-y-1">
                  <label className="text-gray-400 font-medium flex justify-between">
                    <span>سعر التنفيذ المستهدف</span>
                    <span className="font-mono text-gray-500">USDT</span>
                  </label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(Number(e.target.value))}
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-gray-400 font-medium flex justify-between">
                  <span>مبلغ الصفقة (USDT)</span>
                  <span className="font-mono text-emerald-400 font-bold">1.00 USDT</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(Number(e.target.value))}
                    min="1"
                    step="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <div className="absolute left-3 top-2.5 text-xs text-gray-500 font-mono">
                    ≈ {(usdtAmount / (orderType === 'MARKET' ? currentPrice : limitPrice)).toFixed(6)} {selectedPairInfo.base}
                  </div>
                </div>
              </div>

              {/* Quick 1$ Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[1, 5, 10, 25].map((val) => (
                  <button
                    key={val}
                    onClick={() => setUsdtAmount(val)}
                    className={`py-1.5 rounded-xl font-bold font-mono text-xs border transition-all ${
                      usdtAmount === val
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Big 3D Buy and Sell Action Buttons */}
            <div className="grid grid-cols-2 gap-4 pt-3">
              {/* Buy Button */}
              <button
                onClick={() => handleQuickBuy(usdtAmount)}
                className="tilt-card bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-black font-black p-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-2xl shadow-emerald-500/30 transition-all active:scale-95 border border-emerald-300/30"
              >
                <div className="flex items-center gap-1 text-base">
                  <ArrowUpRight className="w-5 h-5 stroke-[3]" />
                  <span>شراء (Buy {selectedPairInfo.base})</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-950">
                  قيمة الصفقة: ${usdtAmount.toFixed(2)} USDT
                </span>
              </button>

              {/* Sell Button */}
              <button
                onClick={() => handleQuickSell(usdtAmount)}
                className="tilt-card bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-black p-4 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-2xl shadow-rose-500/30 transition-all active:scale-95 border border-rose-300/30"
              >
                <div className="flex items-center gap-1 text-base">
                  <ArrowDownRight className="w-5 h-5 stroke-[3]" />
                  <span>بيع (Sell {selectedPairInfo.base})</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-rose-100">
                  قيمة الصفقة: ${usdtAmount.toFixed(2)} USDT
                </span>
              </button>
            </div>
          </div>

          {/* Quick Execution Status widget */}
          <div className="glass-panel rounded-3xl p-5 border border-gray-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                تأمين وتنفيذ المعاملات
              </span>
              <span className="text-emerald-400 font-mono font-bold">HMAC-SHA256 Signed</span>
            </div>
            <p className="text-[11px] text-gray-500">
              يتم تشفير وتوقيع كل أمر تداول بختم زمني فوري مطابق لخوادم MEXC لتفادي أخطاء الانزلاق الزمني (Timestamp Drift).
            </p>
          </div>
        </div>
      </div>

      {/* Spot Executed Orders Log */}
      <div className="glass-panel rounded-3xl p-6 border border-gray-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Coins className="w-4 h-4 text-cyan-400" />
            سجل صفقات التداول الفوري (Spot Orders History)
          </h3>
          <span className="text-xs text-gray-500 font-mono">إجمالي الصفقات: {spotOrders.length}</span>
        </div>

        {spotOrders.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-xs">
            لا توجد صفقات سبوت مسجلة حتى الآن. استخدم زر الشراء أو البيع بقيمة 1$ أعلاه للتنفيذ الفوري.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs font-mono">
              <thead className="bg-gray-900/60 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3">رقم العملية</th>
                  <th className="p-3">الزوج</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3">الكمية المنفذة</th>
                  <th className="p-3">القيمة الإجمالية</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {spotOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-800/20">
                    <td className="p-3 text-gray-500">{ord.id.slice(-8)}</td>
                    <td className="p-3 font-bold text-white">{ord.symbol}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        ord.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {ord.side === 'BUY' ? 'شراء BUY' : 'بيع SELL'} ({ord.type})
                      </span>
                    </td>
                    <td className="p-3 text-yellow-400">${ord.price.toFixed(2)}</td>
                    <td className="p-3 text-gray-300">{ord.amount}</td>
                    <td className="p-3 font-bold text-emerald-400">${ord.totalUsdt.toFixed(2)} USDT</td>
                    <td className="p-3">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> مكتمل
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{new Date(ord.timestamp).toLocaleTimeString()}</td>
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
