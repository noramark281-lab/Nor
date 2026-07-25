import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Sliders,
  DollarSign,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  CheckCircle,
  Activity,
  Maximize2
} from 'lucide-react';
import { MarketTicker, KlineCandle, OrderBookData, FuturesPosition, Language, PositionSide } from '../types';
import { CandleChart } from './CandleChart';

interface TradingTerminalProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  klines: KlineCandle[];
  orderBook: OrderBookData;
  positions: FuturesPosition[];
  lang: Language;
  onPlaceOrder: (order: {
    symbol: string;
    side: PositionSide;
    type: 'MARKET' | 'LIMIT';
    price: number;
    size: number;
    leverage: number;
    tpPrice?: number;
    slPrice?: number;
  }) => Promise<void>;
  onClosePosition: (positionId: string, symbol: string) => Promise<void>;
  userBalance: number;
}

export const TradingTerminal: React.FC<TradingTerminalProps> = ({
  tickers,
  selectedSymbol,
  setSelectedSymbol,
  klines,
  orderBook,
  positions,
  lang,
  onPlaceOrder,
  onClosePosition,
  userBalance,
}) => {
  const isAr = lang === 'ar';

  const currentTicker = tickers.find(t => t.symbol === selectedSymbol) || tickers[0] || {
    symbol: 'BTC_USDT',
    lastPrice: 65840.00,
    riseFallRate: 0.024,
    high24Price: 66800,
    low24Price: 64200,
    volume24: 4820100,
    fundingRate: 0.0001,
  };

  const [orderSide, setOrderSide] = useState<PositionSide>('LONG');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [leverage, setLeverage] = useState<number>(20);
  const [priceInput, setPriceInput] = useState<string>(currentTicker.lastPrice.toString());
  const [sizeInput, setSizeInput] = useState<string>('0.1');
  const [tpPercent, setTpPercent] = useState<string>('2.5');
  const [slPercent, setSlPercent] = useState<string>('1.5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  // Auto update price input when currentTicker changes if limit mode
  React.useEffect(() => {
    if (orderType === 'MARKET') {
      setPriceInput(currentTicker.lastPrice.toString());
    }
  }, [currentTicker.lastPrice, orderType]);

  const execPrice = orderType === 'MARKET' ? currentTicker.lastPrice : parseFloat(priceInput) || currentTicker.lastPrice;
  const numSize = parseFloat(sizeInput) || 0;
  const positionValue = execPrice * numSize;
  const requiredMargin = leverage > 0 ? positionValue / leverage : positionValue;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numSize <= 0) return;

    setIsSubmitting(true);
    setOrderFeedback(null);

    const tpVal = tpPercent ? (orderSide === 'LONG' ? execPrice * (1 + parseFloat(tpPercent) / 100) : execPrice * (1 - parseFloat(tpPercent) / 100)) : undefined;
    const slVal = slPercent ? (orderSide === 'LONG' ? execPrice * (1 - parseFloat(slPercent) / 100) : execPrice * (1 + parseFloat(slPercent) / 100)) : undefined;

    try {
      await onPlaceOrder({
        symbol: selectedSymbol,
        side: orderSide,
        type: orderType,
        price: execPrice,
        size: numSize,
        leverage,
        tpPrice: tpVal,
        slPrice: slVal,
      });

      setOrderFeedback(
        isAr
          ? `تم تنفيذ أمر ${orderSide === 'LONG' ? 'شراء Long' : 'بيع Short'} بنجاح على ${selectedSymbol}!`
          : `Order placed successfully: ${orderSide} ${numSize} ${selectedSymbol}`
      );
    } catch (err: any) {
      setOrderFeedback(err?.message || 'Order execution error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Tickers Scroll Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {tickers.map(t => {
          const isSelected = t.symbol === selectedSymbol;
          const isUp = t.riseFallRate >= 0;
          return (
            <button
              key={t.symbol}
              onClick={() => setSelectedSymbol(t.symbol)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500/50 shadow-md shadow-emerald-950/20 text-slate-100 font-bold'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="font-semibold text-slate-200">{t.symbol.replace('_', '/')}</span>
              <span className="font-mono">${t.lastPrice < 1 ? t.lastPrice.toFixed(4) : t.lastPrice.toLocaleString()}</span>
              <span className={`font-mono flex items-center gap-0.5 text-[11px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {(t.riseFallRate * 100).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left Chart + Orderbook, Right Order Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Chart & Stats (8 Columns on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Market Stats Header */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-extrabold text-emerald-400 text-sm">
                {selectedSymbol.split('_')[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {selectedSymbol.replace('_', ' / ')}
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-normal">
                    MEXC Perpetual
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-xl font-extrabold text-slate-100">
                    ${currentTicker.lastPrice < 1 ? currentTicker.lastPrice.toFixed(6) : currentTicker.lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`font-semibold flex items-center ${currentTicker.riseFallRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentTicker.riseFallRate >= 0 ? '+' : ''}{(currentTicker.riseFallRate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 w-full sm:w-auto justify-between">
              <div>
                <div className="text-slate-400 text-[10px] uppercase">{isAr ? 'أعلى 24س' : '24h High'}</div>
                <div className="font-semibold text-slate-200">${currentTicker.high24Price.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">{isAr ? 'أدنى 24س' : '24h Low'}</div>
                <div className="font-semibold text-slate-200">${currentTicker.low24Price.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">{isAr ? 'حجم التداول' : '24h Vol'}</div>
                <div className="font-semibold text-slate-200">${(currentTicker.volume24 / 1000000).toFixed(2)}M</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">{isAr ? 'معدل التمويل' : 'Funding'}</div>
                <div className="font-semibold text-emerald-400">{(currentTicker.fundingRate * 100).toFixed(4)}%</div>
              </div>
            </div>
          </div>

          {/* Chart Canvas */}
          <CandleChart candles={klines} symbol={selectedSymbol} />

          {/* Orderbook Depth Component */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'سجل الأوامر المباشرة (Order Book)' : 'Live Futures Order Book'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {/* Asks (Sells) */}
              <div>
                <div className="text-[10px] text-slate-400 flex justify-between pb-1 border-b border-slate-800 font-semibold">
                  <span>{isAr ? 'السعر (USDT)' : 'Price (USDT)'}</span>
                  <span>{isAr ? 'الكمية' : 'Size'}</span>
                </div>
                <div className="space-y-1 mt-1">
                  {(orderBook.asks || []).slice(0, 5).reverse().map((ask, i) => (
                    <div key={i} className="flex justify-between text-rose-400 hover:bg-rose-500/10 px-1 py-0.5 rounded">
                      <span>${ask.price.toFixed(ask.price < 1 ? 5 : 2)}</span>
                      <span className="text-slate-300">{ask.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bids (Buys) */}
              <div>
                <div className="text-[10px] text-slate-400 flex justify-between pb-1 border-b border-slate-800 font-semibold">
                  <span>{isAr ? 'السعر (USDT)' : 'Price (USDT)'}</span>
                  <span>{isAr ? 'الكمية' : 'Size'}</span>
                </div>
                <div className="space-y-1 mt-1">
                  {(orderBook.bids || []).slice(0, 5).map((bid, i) => (
                    <div key={i} className="flex justify-between text-emerald-400 hover:bg-emerald-500/10 px-1 py-0.5 rounded">
                      <span>${bid.price.toFixed(bid.price < 1 ? 5 : 2)}</span>
                      <span className="text-slate-300">{bid.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar: Futures Order Execution Form (4 Columns) */}
        <div className="lg:col-span-4 bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'أمر تداول العقود الآجلة' : 'Place Futures Order'}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {isAr ? 'الهامش المتاح' : 'Avail'}: <strong className="text-slate-200">${userBalance.toFixed(2)}</strong>
            </span>
          </div>

          <form onSubmit={handleOrderSubmit} className="space-y-4">
            
            {/* Long / Short Switch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setOrderSide('LONG')}
                className={`py-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  orderSide === 'LONG'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 ring-1 ring-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isAr ? 'شراء / Long' : 'Buy / Long'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderSide('SHORT')}
                className={`py-2 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  orderSide === 'SHORT'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50 ring-1 ring-rose-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{isAr ? 'بيع / Short' : 'Sell / Short'}</span>
              </button>
            </div>

            {/* Order Type Tabs */}
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`flex-1 py-1.5 rounded-lg border text-center font-medium ${
                  orderType === 'MARKET'
                    ? 'bg-slate-800 border-emerald-500/50 text-emerald-400 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'سوق (Market)' : 'Market'}
              </button>

              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`flex-1 py-1.5 rounded-lg border text-center font-medium ${
                  orderType === 'LIMIT'
                    ? 'bg-slate-800 border-emerald-500/50 text-emerald-400 font-bold'
                    : 'border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isAr ? 'محدد (Limit)' : 'Limit'}
              </button>
            </div>

            {/* Leverage Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400 font-medium">{isAr ? 'الرافعة المالية (Leverage)' : 'Leverage'}</span>
                <span className="font-extrabold text-emerald-400 font-mono">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="125"
                step="1"
                value={leverage}
                onChange={e => setLeverage(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>1x</span>
                <span>20x</span>
                <span>50x</span>
                <span>100x</span>
                <span>125x</span>
              </div>
            </div>

            {/* Price Input (if Limit) */}
            {orderType === 'LIMIT' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">{isAr ? 'سعر التنفيذ (USDT)' : 'Limit Price (USDT)'}</label>
                <input
                  type="number"
                  step="any"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {/* Size / Amount Input */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-slate-400">{isAr ? 'الكمية / العقود' : 'Contract Size'}</label>
                <span className="text-slate-400 font-mono">{selectedSymbol.split('_')[0]}</span>
              </div>
              <input
                type="number"
                step="any"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                placeholder="0.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Percentage Presets */}
            <div className="grid grid-cols-4 gap-1">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    const maxPosVal = userBalance * leverage;
                    const calculatedSize = (maxPosVal * (pct / 100)) / execPrice;
                    setSizeInput(calculatedSize.toFixed(3));
                  }}
                  className="py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-[11px] font-mono text-slate-300 hover:text-white"
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Take Profit & Stop Loss inputs */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-emerald-400 mb-1 font-medium">{isAr ? 'جني الأرباح (TP %)' : 'Take Profit %'}</label>
                <input
                  type="number"
                  step="0.1"
                  value={tpPercent}
                  onChange={e => setTpPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-rose-400 mb-1 font-medium">{isAr ? 'وقف الخسارة (SL %)' : 'Stop Loss %'}</label>
                <input
                  type="number"
                  step="0.1"
                  value={slPercent}
                  onChange={e => setSlPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Margin summary box */}
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>{isAr ? 'قيمة الصفقة الإجمالية' : 'Position Value'}:</span>
                <span className="text-slate-200 font-semibold">${positionValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isAr ? 'الهامش المطلوب' : 'Required Margin'}:</span>
                <span className="text-emerald-400 font-extrabold">${requiredMargin.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* Order Feedback Alert */}
            {orderFeedback && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{orderFeedback}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-extrabold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                orderSide === 'LONG'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isSubmitting
                  ? (isAr ? 'جاري التنفيذ...' : 'Submitting...')
                  : (isAr ? `فتح صفقة ${orderSide === 'LONG' ? 'شراء Long' : 'بيع Short'}` : `Open ${orderSide} Position`)}
              </span>
            </button>

          </form>
        </div>

      </div>

      {/* Active Positions & Orders Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'الصفقات المفتوحة المباشرة' : 'Active Futures Positions'}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-mono text-emerald-400">
              {positions.length}
            </span>
          </h3>
        </div>

        {positions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            {isAr ? 'لا توجد صفقات مفتوحة حالياً.' : 'No active positions open right now.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                  <th className="pb-2">{isAr ? 'الزوج' : 'Symbol'}</th>
                  <th className="pb-2">{isAr ? 'النوع' : 'Side'}</th>
                  <th className="pb-2">{isAr ? 'الكمية' : 'Size'}</th>
                  <th className="pb-2">{isAr ? 'سعر الدخول' : 'Entry Price'}</th>
                  <th className="pb-2">{isAr ? 'السعر الحالي' : 'Mark Price'}</th>
                  <th className="pb-2">{isAr ? 'سعر التصفية' : 'Liq Price'}</th>
                  <th className="pb-2">{isAr ? 'الهامش / الرافعة' : 'Margin / Lev'}</th>
                  <th className="pb-2">{isAr ? 'الأرباح/الخسائر (PnL)' : 'PnL (USDT)'}</th>
                  <th className="pb-2 text-right rtl:text-left">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positions.map(pos => {
                  const isLong = pos.side === 'LONG';
                  const isProfit = pos.unrealizedPnL >= 0;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-bold text-slate-200">
                        {pos.symbol.replace('_', '/')}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {pos.side}
                        </span>
                      </td>
                      <td className="py-3 text-slate-200">{pos.size}</td>
                      <td className="py-3 text-slate-300">${pos.entryPrice.toLocaleString()}</td>
                      <td className="py-3 text-slate-100 font-bold">${pos.markPrice.toLocaleString()}</td>
                      <td className="py-3 text-amber-400">${pos.liquidationPrice.toLocaleString()}</td>
                      <td className="py-3 text-slate-400">
                        ${pos.margin.toFixed(2)} <span className="text-emerald-400">({pos.leverage}x)</span>
                      </td>
                      <td className="py-3">
                        <div className={`font-extrabold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnL.toFixed(2)}
                          <span className="text-[10px] ml-1 opacity-80">({pos.unrealizedPnLPercent.toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td className="py-3 text-right rtl:text-left">
                        <button
                          onClick={() => onClosePosition(pos.id, pos.symbol)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 transition-all text-[11px]"
                        >
                          {isAr ? 'إغلاق بالسوق' : 'Close Market'}
                        </button>
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
  );
};
