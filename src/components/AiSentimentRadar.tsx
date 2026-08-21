import React from 'react';
import { 
  Radar, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldAlert, 
  Layers, 
  Compass, 
  BarChart3, 
  Sparkles, 
  Clock, 
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Language, SentimentSignal, TradeDirection, TradeDuration } from '../types';
import { translations } from '../utils/translations';

interface AiSentimentRadarProps {
  lang: Language;
  sentiment: SentimentSignal | null;
  isLoading: boolean;
  onRefresh: () => void;
  onQuickTrade: (direction: TradeDirection, duration: TradeDuration) => void;
}

export const AiSentimentRadar: React.FC<AiSentimentRadarProps> = ({
  lang,
  sentiment,
  isLoading,
  onRefresh,
  onQuickTrade,
}) => {
  const t = translations[lang];

  if (!sentiment) {
    return (
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center min-h-[360px] text-center">
        <RefreshCw className={`w-8 h-8 text-indigo-400 mb-3 ${isLoading ? 'animate-spin' : ''}`} />
        <p className="text-sm text-slate-300 font-medium">{t.analyzingRadar}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all"
        >
          {t.refreshRadar}
        </button>
      </div>
    );
  }

  const isBullish = sentiment.direction === 'CALL';
  const isBearish = sentiment.direction === 'PUT';
  const scoreColor = sentiment.score > 20 
    ? 'text-emerald-400' 
    : sentiment.score < -20 
      ? 'text-rose-400' 
      : 'text-amber-400';

  const gaugeRotation = ((sentiment.score + 100) / 200) * 180 - 90; // -90 deg to +90 deg

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Radar className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{t.radarTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Gemini 3.7 Live
              </span>
            </h2>
            <p className="text-xs text-slate-400">{t.radarSubtitle}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          id="refresh-sentiment-radar-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? t.analyzingRadar : t.refreshRadar}</span>
        </button>
      </div>

      {/* Main Core Sentiment Dashboard */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Gauge & Primary Signal Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 bg-slate-950/60 rounded-xl p-4 sm:p-5 border border-slate-800/80">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">{t.overallSentiment}</span>
              <span className="font-mono text-slate-500">
                {new Date(sentiment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Visual Arc Gauge */}
            <div className="relative flex flex-col items-center justify-center my-2 pt-2">
              <div className="w-48 h-24 overflow-hidden relative">
                <div className="w-48 h-48 rounded-full border-[14px] border-slate-800 border-b-transparent border-l-transparent -rotate-45" />
                {/* Colored Track */}
                <div 
                  className="w-48 h-48 rounded-full border-[14px] border-transparent absolute top-0 left-0 transition-transform duration-700 origin-center"
                  style={{
                    borderTopColor: sentiment.score > 20 ? '#10B981' : sentiment.score < -20 ? '#F43F5E' : '#F59E0B',
                    borderRightColor: sentiment.score > 20 ? '#10B981' : sentiment.score < -20 ? '#F43F5E' : '#F59E0B',
                    transform: `rotate(${gaugeRotation}deg)`
                  }}
                />
              </div>

              {/* Center Score & Bias Badge */}
              <div className="text-center -mt-8">
                <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${scoreColor}`}>
                  {sentiment.score > 0 ? `+${sentiment.score}` : sentiment.score}
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                  {sentiment.strength.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Metrics Pills Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-900/90 rounded-lg p-2.5 text-center border border-slate-800">
                <span className="text-[10px] text-slate-400 block leading-tight">{t.confidenceScore}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-cyan-400">{sentiment.confidence}%</span>
              </div>
              <div className="bg-slate-900/90 rounded-lg p-2.5 text-center border border-slate-800">
                <span className="text-[10px] text-slate-400 block leading-tight">{t.expectedPayoutRate}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-400">{sentiment.payoutProbability}%</span>
              </div>
              <div className="bg-slate-900/90 rounded-lg p-2.5 text-center border border-slate-800">
                <span className="text-[10px] text-slate-400 block leading-tight">{t.tradeDuration}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-indigo-400">{sentiment.recommendedDuration}</span>
              </div>
            </div>
          </div>

          {/* Direct Quick Execution CTA */}
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-slate-400 block text-[11px]">{t.recommendedAction}</span>
              <span className={`font-bold ${isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'}`}>
                {sentiment.direction === 'CALL' ? 'CALL (صعود)' : sentiment.direction === 'PUT' ? 'PUT (هبوط)' : 'HOLD (انتظار)'} • {sentiment.recommendedDuration}
              </span>
            </div>
            {sentiment.direction !== 'NEUTRAL' && (
              <button
                onClick={() => onQuickTrade(sentiment.direction as TradeDirection, sentiment.recommendedDuration)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow transition-all active:scale-95 flex items-center gap-1 ${
                  isBullish ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تنفيذ فوري' : 'Quick Trade'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: AI Analysis Summary, Catalysts & Macro (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* AI Executive Summary */}
          <div className="bg-indigo-950/30 rounded-xl p-3.5 border border-indigo-500/25">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'ar' ? 'الخلاصة التحليلية الذكية' : 'AI Market Intelligence Synthesis'}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {lang === 'ar' ? sentiment.summaryAr : sentiment.summary}
            </p>
          </div>

          {/* Top Live Catalysts */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.topCatalysts}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">{sentiment.catalysts.length} {lang === 'ar' ? 'أخبار نشطة' : 'news events'}</span>
            </div>

            <div className="space-y-2">
              {sentiment.catalysts.map((cat, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex items-start justify-between gap-2.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                      cat.impact === 'BULLISH' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : cat.impact === 'BEARISH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {cat.impact}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-200 leading-snug">
                        {lang === 'ar' ? cat.titleAr : cat.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>{cat.source}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {cat.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                    {cat.score > 0 ? `+${cat.score}` : cat.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Macro Factors & Technical Confluence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Macro Drivers */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>{t.macroFactors}</span>
              </div>
              <div className="space-y-1.5">
                {sentiment.macroFactors.slice(0, 3).map((mf, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[170px]">
                      {lang === 'ar' ? mf.factorAr : mf.factor}
                    </span>
                    <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                      mf.sentiment === 'POSITIVE' ? 'text-emerald-400 bg-emerald-500/10' : mf.sentiment === 'NEGATIVE' ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 bg-slate-800'
                    }`}>
                      {mf.sentiment}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Confluence */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.technicalConfluence}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">RSI 14:</span>
                  <span className="font-mono text-cyan-400 font-bold">{sentiment.technicalConfluence.rsi14} ({sentiment.technicalConfluence.rsiStatus})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MACD:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[130px] text-[10px]">{sentiment.technicalConfluence.macd}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Orderbook:</span>
                  <span className={`font-mono font-bold ${sentiment.technicalConfluence.orderbookImbalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sentiment.technicalConfluence.orderbookImbalance >= 0 ? `+${sentiment.technicalConfluence.orderbookImbalance}% Buyers` : `${sentiment.technicalConfluence.orderbookImbalance}% Sellers`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
