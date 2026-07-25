import React, { useRef, useEffect } from 'react';
import { KlineCandle } from '../types';

interface CandleChartProps {
  candles: KlineCandle[];
  symbol: string;
  height?: number;
}

export const CandleChart: React.FC<CandleChartProps> = ({ candles, symbol, height = 360 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI retina screens
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);

    const width = rect.width;
    const canvasH = height;

    // Clear background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, canvasH);

    // Grid lines
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;

    for (let y = 40; y < canvasH - 30; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
    }

    // Min and Max prices for scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    const visibleCandles = candles.slice(-50); // view last 50 candles

    visibleCandles.forEach(c => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    if (minPrice === maxPrice) {
      minPrice *= 0.99;
      maxPrice *= 1.01;
    }

    const pricePadding = (maxPrice - minPrice) * 0.08;
    minPrice -= pricePadding;
    maxPrice += pricePadding;

    const chartWidth = width - 65;
    const priceAreaH = canvasH - 60;
    const candleWidth = Math.max(2, (chartWidth / visibleCandles.length) * 0.7);
    const gap = chartWidth / visibleCandles.length;

    // Price to Y conversion
    const getY = (price: number) => {
      return priceAreaH - ((price - minPrice) / (maxPrice - minPrice)) * (priceAreaH - 30) + 15;
    };

    // Draw Price Labels on Y-axis (Right side)
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (i / steps) * (maxPrice - minPrice);
      const y = getY(p);
      ctx.fillText(`$${p.toFixed(p < 1 ? 5 : 2)}`, width - 58, y + 3);
    }

    // Draw Candles & Volume
    visibleCandles.forEach((c, idx) => {
      const x = idx * gap + gap / 2;
      const isGreen = c.close >= c.open;

      // Color
      const bodyColor = isGreen ? '#10b981' : '#f43f5e';
      const wickColor = isGreen ? '#34d399' : '#fb7185';

      // High-Low Wick
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Open-Close Body
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const bodyY = Math.min(yOpen, yClose);
      const bodyH = Math.max(2, Math.abs(yClose - yOpen));

      ctx.fillStyle = bodyColor;
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyH);

      // Volume Bar at Bottom
      const volAreaH = 35;
      const volH = maxVol > 0 ? (c.volume / maxVol) * volAreaH : 2;
      ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
      ctx.fillRect(x - candleWidth / 2, canvasH - 25 - volH, candleWidth, volH);
    });

    // Draw Last Price Line
    if (visibleCandles.length > 0) {
      const lastCandle = visibleCandles[visibleCandles.length - 1];
      const lastY = getY(lastCandle.close);
      const isGreen = lastCandle.close >= lastCandle.open;

      ctx.strokeStyle = isGreen ? '#10b981' : '#f43f5e';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, lastY);
      ctx.lineTo(width - 65, lastY);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Tag
      ctx.fillStyle = isGreen ? '#10b981' : '#f43f5e';
      ctx.fillRect(width - 62, lastY - 9, 58, 18);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`$${lastCandle.close.toFixed(lastCandle.close < 1 ? 4 : 2)}`, width - 58, lastY + 3);
    }

  }, [candles, height]);

  return (
    <div className="relative w-full overflow-hidden bg-slate-900 rounded-xl border border-slate-800 p-2">
      <div className="flex items-center justify-between mb-2 px-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-100">{symbol}</span>
          <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
            MEXC Contract 15m
          </span>
        </div>
        <div className="text-slate-400 flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Low
          </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-[340px] block cursor-crosshair"
      />
    </div>
  );
};
