import React from 'react'
import { X, Sparkles, Activity, ShieldCheck, CheckCircle2, Globe, Radio, ExternalLink } from 'lucide-react'
import { Language, NewsItem, AISentimentState } from '../types'

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
  language: Language
  newsList: NewsItem[]
  sentiment: AISentimentState
}

export const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  language,
  newsList,
  sentiment,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-[440px] bg-[#0c0f16] border border-[#1e2634] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#1b2230] bg-[#10141d]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00c087] animate-pulse"></div>
            <span className="text-sm font-bold text-white">
              {language === 'ar' ? 'أخبار التداول ورادار الذكاء الاصطناعي' : 'Trading News & AI Radar'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 overflow-y-auto flex flex-col gap-3">
          {/* AI Sentiment Banner */}
          <div className="bg-[#121927] border border-[#23334d] rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#00c087] font-bold">
                <Sparkles size={14} className="animate-spin" />
                <span>
                  {language === 'ar' ? 'تأكيد الذكاء الاصطناعي' : 'AI Market Sentiment'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00c087]/20 text-[#00c087] font-mono font-bold">
                {sentiment.score}% {sentiment.direction}
              </span>
            </div>

            <p className="text-xs text-gray-200 font-medium">
              {language === 'ar' ? sentiment.confidenceAr : sentiment.confidence}
            </p>

            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#1d283c]">
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                {language === 'ar' ? 'مستوى المخاطرة: منخفض' : 'Risk Gate: Low'}
              </span>
              <span className="font-mono text-gray-400">
                {language === 'ar' ? 'سيرفر تداول سحابي 24/7' : 'Cloud Engine 24/7 Active'}
              </span>
            </div>
          </div>

          {/* Real Live News Feed */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-gray-400">
              {language === 'ar' ? 'الأخبار العاجلة وتدفقات السيولة' : 'Breaking News & Inflows'}
            </span>

            {newsList.map((item) => (
              <div
                key={item.id}
                className="bg-[#10141d] border border-[#1b2230] hover:border-[#2a364c] transition-all rounded-xl p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#00c087] font-bold flex items-center gap-1">
                    <Radio size={11} className="animate-pulse" />
                    {item.source}
                  </span>
                  <span className="text-gray-500 font-mono">{item.time}</span>
                </div>

                <p className="text-xs text-gray-200 font-medium leading-snug">
                  {language === 'ar' ? item.titleAr : item.title}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#171d27]">
                  <span className="text-gray-400 font-mono">[{item.category}]</span>
                  <span className="text-[#00c087] font-mono font-bold">
                    Bullish Impact: {item.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1b2230] bg-[#10141d] flex items-center justify-between text-[11px] text-gray-400">
          <span>{language === 'ar' ? 'مزامنة مباشرة مع MEXC' : 'Live MEXC Sync'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#2962ff] text-white font-bold hover:bg-[#3d72ff] transition-colors cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
