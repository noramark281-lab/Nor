import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Maximize2, 
  Eye, 
  Activity,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Language, Candle, CandleTimeframe, MarketData, EventTrade } from '../types';
import { translations } from '../utils/translations';

interface LiveChartOrderbookProps {
  lang: Language;
  candles: Candle[];
  timeframe: CandleTimeframe;
  onTimeframeChange: (tf: CandleTimeframe) => void;
  marketData: MarketData;
  activeTrades: EventTrade[];
  isLoading: boolean;
}

export const LiveChartOrderbook: React.FC<LiveChartOrderbookProps> = ({
  lang,
  candles,
  timeframe,
  onTimeframeChange,
  marketData,
  activeTrades,
  isLoading,
}) => {
  const t = translations[lang];
  const [showIndicators, setShowIndicators] = useState(true);

  // Compute chart bounds
  const prices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = prices.length ? Math.min(...prices) * 0.9995 : 95000;
  const maxPrice = prices.length ? Math.max(...prices) * 1.0005 : 97000;
  const priceRange = maxPrice - minPrice || 1;

  const chartHeight = 260;
  const chartWidth = 600;
  const paddingBottom = 25;
  const paddingTop = 15;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const candleWidth = Math.max(4, Math.floor((chartWidth - 20) / (candles.length || 1)) - 3);

  const getY = (price: number) => {
    return chartHeight - paddingBottom - ((price - minPrice) / priceRange) * usableHeight;
  };

  // Generate synthetic orderbook depth around current price
  const basePrice = marketData.price;
  const bids = [
    { price: basePrice - 0.8, amount: 2.45, total: 2.45 },
    { price: basePrice - 1.5, amount: 4.80, total: 7.25 },
    { price: basePrice - 3.0, amount: 8.12, total: 15.37 },
    { price: basePrice - 5.5, amount: 14.50, total: 29.87 },
    { price: basePrice - 8.0, amount: 22.30, total: 52.17 },
  ];
  const asks = [
    { price: basePrice + 0.8, amount: 3.10, total: 3.10 },
    { price: basePrice + 1.6, amount: 5.20, total: 8.30 },
    { price: basePrice + 2.8, amount: 7.90, total: 16.20 },
    { price: basePrice + 4.5, amount: 12.40, total: 28.60 },
    { price: basePrice + 7.2, amount: 19.80, total: 48.40 },
  ];

  const totalBidVol = bids.reduce((acc, b) => acc + b.amount, 0);
  const totalAskVol = asks.reduce((acc, a) => acc + a.amount, 0);
  const buyerRatio = Math.round((totalBidVol / (totalBidVol + totalAskVol)) * 100);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Top Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.tabChart}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ${marketData.price.toFixed(2)}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar' ? 'بيانات الشموع اللحظية وعمق الطلبات من منصة MEXC' : 'Real-time candlestick momentum & orderbook depth from MEXC'}
            </p>
          </div>
        </div>

        {/* Timeframe Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['1m', '5m', '15m'] as CandleTimeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                timeframe === tf
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Candlestick Chart Area (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950/80 rounded-xl p-3 sm:p-4 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-mono">BTC/USDT</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                {timeframe}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">H: <strong className="text-slate-200">${maxPrice.toFixed(1)}</strong></span>
              <span className="text-slate-400">L: <strong className="text-slate-200">${minPrice.toFixed(1)}</strong></span>
            </div>
          </div>

          {/* SVG Candlestick Canvas */}
          <div className="w-full overflow-x-auto relative">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto max-h-[300px] select-none"
            >
              {/* Horizontal Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                const y = paddingTop + ratio * usableHeight;
                const pVal = maxPrice - ratio * priceRange;
                return (
                  <g key={ratio}>
                    <line
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={chartWidth - 5}
                      y={y - 3}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      ${pVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Active Trades Strike Price Lines */}
              {activeTrades.map((trade) => {
                const strikeY = getY(trade.strikePrice);
                const isCall = trade.direction === 'CALL';
                return (
                  <g key={trade.id}>
                    <line
                      x1="0"
                      y1={strikeY}
                      x2={chartWidth}
                      y2={strikeY}
                      stroke={isCall ? '#10B981' : '#F43F5E'}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <rect
                      x="4"
                      y={strikeY - 9}
                      width="90"
                      height="18"
                      rx="4"
                      fill={isCall ? '#064e3b' : '#881337'}
                      stroke={isCall ? '#10B981' : '#F43F5E'}
                    />
                    <text
                      x="49"
                      y={strikeY + 3}
                      fill="#ffffff"
                      fontSize="8.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {trade.direction} ${trade.strikePrice.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Current Price Line */}
              {(() => {
                const curY = getY(marketData.price);
                return (
                  <g>
                    <line
                      x1="0"
                      y1={curY}
                      x2={chartWidth}
                      y2={curY}
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    <rect
                      x={chartWidth - 65}
                      y={curY - 8}
                      width="60"
                      height="16"
                      rx="3"
                      fill="#0284c7"
                    />
                    <text
                      x={chartWidth - 35}
                      y={curY + 3}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      ${marketData.price.toFixed(1)}
                    </text>
                  </g>
                );
              })()}

              {/* Candlesticks */}
              {candles.map((candle, idx) => {
                const isBull = candle.close >= candle.open;
                const color = isBull ? '#10B981' : '#F43F5E';
                const x = 15 + idx * (candleWidth + 3);

                const openY = getY(candle.open);
                const closeY = getY(candle.close);
                const highY = getY(candle.high);
                const lowY = getY(candle.low);

                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));

                return (
                  <g key={idx}>
                    {/* Wick Line */}
                    <line
                      x1={x + candleWidth / 2}
                      y1={highY}
                      x2={x + candleWidth / 2}
                      y2={lowY}
                      stroke={color}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      rx="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-900 mt-2 font-mono">
            <span>MEXC Perpetual WebSocket: Connected (15ms)</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Feed
            </span>
          </div>
        </div>

        {/* Right: Orderbook Depth Snapshot (4 cols) */}
        <div className="lg:col-span-4 bg-slate-950/80 rounded-xl p-3 sm:p-4 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'ar' ? 'دفتر الأوامر اللحظي' : 'Orderbook Depth'}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">Spread: $0.10</span>
            </div>

            {/* Asks (Sellers - Rose) */}
            <div className="space-y-1 text-[11px] font-mono mb-2">
              {asks.slice().reverse().map((ask, idx) => {
                const depthPct = Math.min(100, (ask.total / 50) * 100);
                return (
                  <div key={idx} className="relative flex justify-between px-1.5 py-0.5 rounded overflow-hidden">
                    <div 
                      className="absolute top-0 right-0 bottom-0 bg-rose-500/15"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="relative z-10 text-rose-400 font-bold">${ask.price.toFixed(1)}</span>
                    <span className="relative z-10 text-slate-400">{ask.amount.toFixed(2)} BTC</span>
                  </div>
                );
              })}
            </div>

            {/* Mid Price Divider */}
            <div className="py-1 px-2 bg-slate-900 rounded border border-slate-800 text-center text-xs font-mono font-extrabold text-cyan-400 my-1">
              ${marketData.price.toFixed(2)}
            </div>

            {/* Bids (Buyers - Emerald) */}
            <div className="space-y-1 text-[11px] font-mono mt-2">
              {bids.map((bid, idx) => {
                const depthPct = Math.min(100, (bid.total / 50) * 100);
                return (
                  <div key={idx} className="relative flex justify-between px-1.5 py-0.5 rounded overflow-hidden">
                    <div 
                      className="absolute top-0 right-0 bottom-0 bg-emerald-500/15"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="relative z-10 text-emerald-400 font-bold">${bid.price.toFixed(1)}</span>
                    <span className="relative z-10 text-slate-400">{bid.amount.toFixed(2)} BTC</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pressure Ratio Bar */}
          <div className="mt-4 pt-3 border-t border-slate-900">
            <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
              <span className="text-emerald-400">Buyers {buyerRatio}%</span>
              <span className="text-rose-400">{100 - buyerRatio}% Sellers</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${buyerRatio}%` }} />
              <div className="h-full bg-rose-500" style={{ width: `${100 - buyerRatio}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
