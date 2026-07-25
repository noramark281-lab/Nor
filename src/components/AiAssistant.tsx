import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { AIAnalysisResult, Language } from '../types';

interface AiAssistantProps {
  selectedSymbol: string;
  setSelectedSymbol: (sym: string) => void;
  symbols: string[];
  lang: Language;
  onApplyAiSetup: (setup: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    takeProfitPrice: number;
    stopLossPrice: number;
    leverage: number;
  }) => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  selectedSymbol,
  setSelectedSymbol,
  symbols,
  lang,
  onApplyAiSetup,
}) => {
  const isAr = lang === 'ar';
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const fetchAiAnalysis = async (sym: string) => {
    setIsLoading(true);
    setAppliedSuccess(false);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym, language: lang }),
      });
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.success && data.analysis) {
          setAnalysis(data.analysis);
        }
      }
    } catch (e) {
      console.error('AI fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAiAnalysis(selectedSymbol);
  }, [selectedSymbol]);

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
              <BrainCircuit className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'محلل Gemini الذكي لصفقات MEXC' : 'Gemini AI Futures Trader'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/30">
                  Gemini 2.5 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'تحليل فني لحظي للرسم البياني ومؤشرات الزخم للتوصية بالدخول الدقيق في العقود الآجلة.'
                  : 'Real-time quantitative chart analysis, momentum indicator parsing, and automated trade setup generation.'}
              </p>
            </div>
          </div>

          {/* Symbol selector dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm font-bold text-slate-100 focus:border-cyan-500 focus:outline-none"
            >
              {symbols.map(s => (
                <option key={s} value={s}>{s.replace('_', ' / ')} Perpetual</option>
              ))}
            </select>

            <button
              onClick={() => fetchAiAnalysis(selectedSymbol)}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title={isAr ? 'إعادة التحليل' : 'Re-analyze'}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      {isLoading ? (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-12 text-center space-y-4">
          <BrainCircuit className="w-12 h-12 text-cyan-400 animate-pulse mx-auto" />
          <p className="text-sm text-slate-300 font-medium">
            {isAr ? 'جاري تحليل الرسم البياني وحساب مستويات الدعم والمقاومة لـ MEXC...' : 'Analyzing MEXC Futures market chart and technical indicators...'}
          </p>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main AI Summary Card (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1.5 ${
                  analysis.sentiment === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {analysis.sentiment === 'BULLISH' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{analysis.sentiment}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {isAr ? 'درجة الثقة' : 'Confidence'}: <strong className="text-cyan-400">{analysis.confidenceScore}%</strong>
                </span>
              </div>

              <span className="text-xs font-mono text-slate-400">
                {analysis.symbol.replace('_', '/')}
              </span>
            </div>

            <div className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="font-semibold text-cyan-300 mb-1">{isAr ? 'التحليل الفني والتوصية:' : 'AI Technical Analysis:'}</p>
              <p className="text-slate-300 text-xs sm:text-sm">
                {isAr ? analysis.summaryAr : analysis.summary}
              </p>
            </div>

            {/* Support / Resistance Levels Grid */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isAr ? 'مستويات الدعم والمقاومة المحورية' : 'Pivot Support & Resistance Levels'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 text-[10px] block font-bold">{isAr ? 'دعم 1' : 'Support 1'}</span>
                  <span className="text-slate-200 font-bold">${analysis.keyLevels.support1}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 text-[10px] block font-bold">{isAr ? 'دعم 2' : 'Support 2'}</span>
                  <span className="text-slate-200 font-bold">${analysis.keyLevels.support2}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-rose-400 text-[10px] block font-bold">{isAr ? 'مقاومة 1' : 'Resistance 1'}</span>
                  <span className="text-slate-200 font-bold">${analysis.keyLevels.resistance1}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-rose-400 text-[10px] block font-bold">{isAr ? 'مقاومة 2' : 'Resistance 2'}</span>
                  <span className="text-slate-200 font-bold">${analysis.keyLevels.resistance2}</span>
                </div>
              </div>
            </div>

            {/* Technical Indicators summary */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px]">RSI (14)</span>
                <div className="font-bold text-slate-200">{analysis.technicalIndicators.rsi}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">MACD</span>
                <div className="font-bold text-cyan-400">{analysis.technicalIndicators.macdSignal}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">{isAr ? 'الاتجاه العام' : 'Trend'}</span>
                <div className="font-bold text-slate-200">{analysis.technicalIndicators.trend}</div>
              </div>
            </div>

          </div>

          {/* AI Recommended Trade Setup Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  {isAr ? 'توصية الصفقة الجاهزة للتنفيذ' : 'Recommended Trade Setup'}
                </h3>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'نوع الصفقة الموصى به' : 'Action'}:</span>
                  <span className={`px-2.5 py-1 rounded font-extrabold text-xs ${
                    analysis.recommendedAction.includes('BUY')
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {analysis.recommendedAction.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'سعر الدخول المستهدف' : 'Suggested Entry'}:</span>
                  <span className="font-extrabold text-slate-100">${analysis.suggestedEntryPrice}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-emerald-400 font-semibold">{isAr ? 'سعر جني الأرباح (TP)' : 'Take Profit'}:</span>
                  <span className="font-extrabold text-emerald-400">${analysis.suggestedTakeProfit}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-rose-400 font-semibold">{isAr ? 'سعر وقف الخسارة (SL)' : 'Stop Loss'}:</span>
                  <span className="font-extrabold text-rose-400">${analysis.suggestedStopLoss}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">{isAr ? 'الرافعة المالية المقترحة' : 'Suggested Leverage'}:</span>
                  <span className="font-extrabold text-cyan-400">{analysis.suggestedLeverage}x</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {appliedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'تم نقل التوصية لمنصة التداول بنجاح!' : 'Applied trade setup to terminal!'}</span>
                </div>
              )}

              <button
                onClick={() => {
                  onApplyAiSetup({
                    symbol: analysis.symbol,
                    side: analysis.recommendedAction.includes('BUY') ? 'LONG' : 'SHORT',
                    entryPrice: analysis.suggestedEntryPrice,
                    takeProfitPrice: analysis.suggestedTakeProfit,
                    stopLossPrice: analysis.suggestedStopLoss,
                    leverage: analysis.suggestedLeverage,
                  });
                  setAppliedSuccess(true);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-950/40 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>{isAr ? 'تطبيق التوصية فوراً في منصة التداول' : 'Apply AI Setup to Terminal'}</span>
              </button>
            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
};
