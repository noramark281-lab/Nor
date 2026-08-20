import React from 'react'
import { Language, NewsItem, AISentimentState } from '../types'
import { X, Sparkles, ExternalLink, TrendingUp, TrendingDown, Radio } from 'lucide-react'

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
  language: Language
  newsList: NewsItem[]
  sentiment: AISentimentState
  onRefreshNews: () => void
}

export const NewsModal: React.FC<NewsModalProps> = ({
  isOpen,
  onClose,
  language,
  newsList,
  sentiment,
  onRefreshNews,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
      <div className="w-full max-w-md bg-[#0e121a] border border-[#202738] rounded-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2436] bg-[#121722]">
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#00c087] animate-pulse" />
            <span className="text-sm font-bold text-white">
              {language === 'ar' ? 'رادار أخبار البيتكوين المباشر' : 'Live BTC Trading News Radar'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Gemini AI Sentiment Overview Header */}
        <div className="px-4 py-3 bg-[#161e2d] border-b border-[#222d42] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Sparkles size={14} className="text-[#00c087]" />
              <span>{language === 'ar' ? 'تقييم الذكاء الاصطناعي (Gemini):' : 'Gemini AI NLP Sentiment:'}</span>
            </div>
            <span className="text-[#00c087] font-mono font-black text-sm">
              {sentiment.score}% {sentiment.direction}
            </span>
          </div>

          <div className="w-full bg-[#0a0d14] rounded-full h-2 overflow-hidden border border-[#243147]">
            <div
              className="bg-gradient-to-r from-emerald-500 to-[#00c087] h-full rounded-full transition-all duration-500"
              style={{ width: `${sentiment.score}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>{language === 'ar' ? 'المصادر: CryptoPanic, CoinDesk, Bloomberg' : 'Sources: CryptoPanic, CoinDesk, Bloomberg'}</span>
            <span className="text-emerald-400 font-semibold">
              {language === 'ar' ? sentiment.confidenceAr : sentiment.confidence}
            </span>
          </div>
        </div>

        {/* News Stream Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {newsList.map((item) => (
            <div
              key={item.id}
              className="bg-[#121620] border border-[#1d2535] hover:border-[#2d3a52] rounded-xl p-3 flex flex-col gap-2 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="px-2 py-0.5 rounded bg-[#1b2333] text-gray-300 font-mono">
                  {item.source}
                </span>
                <span className="text-gray-500 font-mono">{item.time}</span>
              </div>

              <p className="text-xs font-semibold text-gray-200 leading-relaxed">
                {language === 'ar' ? item.titleAr : item.title}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-[#18202d] text-[11px]">
                <span className="text-gray-400">{item.category}</span>
                <div className="flex items-center gap-1 font-bold text-[#00c087]">
                  <TrendingUp size={12} />
                  <span>+{item.score}% Bullish</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#121722] border-t border-[#1c2436] flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            {language === 'ar' ? 'تحديث تلقائي كل 30 ثانية' : 'Auto-refreshed every 30s'}
          </span>
          <button
            onClick={onRefreshNews}
            className="px-3 py-1.5 rounded-lg bg-[#2962ff] hover:bg-[#1e4bd8] text-white text-xs font-bold transition-all cursor-pointer"
          >
            {language === 'ar' ? 'تحديث الآن' : 'Refresh Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
