import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Globe,
  QrCode,
  Check,
  Copy,
  ExternalLink,
  X,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Language } from '../types';

interface MobileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative text-slate-100">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-100">
            {isAr ? 'رابط السحابة وتطبيق الهاتف (PWA / APK)' : 'Cloud App & Mobile Web APK'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تطبيق التداول متصل بالسحابة 24/7 ويمكن تثبيته مباشرة على هاتفك لتداول العقود الآجلة بنقرة واحدة.'
              : 'Your trading application is live on the cloud 24/7 and can be installed directly to your mobile phone.'}
          </p>
        </div>

        {/* Live Cloud App URL box */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            {isAr ? 'رابط التطبيق السحابي المباشر (Cloud URL)' : 'Live Cloud Service URL'}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={appUrl}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
            </button>
          </div>
        </div>

        {/* Installation Steps for Android / iOS */}
        <div className="space-y-3 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? 'خطوات التثبيت على الهاتف كـ تطبيق (APK Web App):' : 'Installation on Mobile (Web APK/PWA):'}</span>
          </h3>

          <ol className="space-y-2 text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              {isAr
                ? 'افتح الرابط أعلاه في متصفح Chrome أو Safari على هاتفك المحمول.'
                : 'Open the link above in Chrome or Safari on your phone.'}
            </li>
            <li>
              {isAr
                ? 'اضغط على قائمة المتصفح (⋮) واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق" (Install App).'
                : 'Tap browser options (⋮) and select "Add to Home Screen" or "Install App".'}
            </li>
            <li>
              {isAr
                ? 'سيتشكل تطبيق كامل على شاشة هاتفك للتداول المباشر والسريع 24/7!'
                : 'The app icon will be installed on your phone home screen for instant 24/7 access!'}
            </li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
        >
          {isAr ? 'إغلاق والعودة للتداول' : 'Close & Back to Trading'}
        </button>

      </div>
    </div>
  );
};
