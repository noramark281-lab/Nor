import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Lock,
  Terminal,
  Zap
} from 'lucide-react';
import { MexcApiCredentials, Language } from '../types';

interface ApiSettingsModalProps {
  credentials: MexcApiCredentials;
  onSaveCredentials: (apiKey: string, secretKey: string) => Promise<boolean>;
  lang: Language;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  credentials,
  onSaveCredentials,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [apiKeyInput, setApiKeyInput] = useState(credentials.apiKey || '');
  const [secretKeyInput, setSecretKeyInput] = useState(credentials.secretKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    try {
      const isOk = await onSaveCredentials(apiKeyInput, secretKeyInput);
      if (isOk) {
        setTestResult({
          success: true,
          message: isAr
            ? 'تم الاتصال والتحقق بنجاح من حسابك في منصة MEXC! البيانات وقراءات المحفظة صحيحة تماماً.'
            : 'Successfully authenticated with MEXC Futures API! Live account feeds connected.',
        });
      } else {
        setTestResult({
          success: false,
          message: isAr
            ? 'فشل الاتصال بمفاتيح MEXC. يرجى التأكد من تفعيل صلاحية تداول العقود الآجلة (Contract Trading) والصلاحية المسموحة.'
            : 'Authentication failed. Please verify your MEXC API Key and ensure Futures Trading permission is checked.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Key className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">
              {isAr ? 'ربط حساب منصة MEXC عبر API' : 'MEXC Futures API Credentials Setup'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'قم بإدخال المفتاح العام والمفتاح السري لحسابك في منصة MEXC لتفعيل القراءة الحقيقية والتداول الحقيقي.'
                : 'Connect your real MEXC account API Key & Secret Key to enable live trading and real portfolio feeds.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
          <form onSubmit={handleSaveAndTest} className="space-y-4 font-mono text-xs">
            
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isAr ? 'مفتاح API الخاص بـ MEXC (API Key)' : 'MEXC API Key'}
              </label>
              <input
                type="text"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                placeholder="e.g. mx0glsXXXXXX..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isAr ? 'المفتاح السري (Secret Key)' : 'MEXC Secret Key'}
              </label>
              <input
                type="password"
                value={secretKeyInput}
                onChange={e => setSecretKeyInput(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Test result status box */}
            {testResult && (
              <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                {testResult.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-bold mb-0.5">{testResult.success ? (isAr ? 'تم الاتصال بنجاح' : 'Connected') : (isAr ? 'فشل الربط' : 'Failed')}</div>
                  <div className="font-normal opacity-90">{testResult.message}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isTesting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>
                {isTesting
                  ? (isAr ? 'جاري التحقق من الاتصال بمفاتيح MEXC...' : 'Testing Connection...')
                  : (isAr ? 'حفظ واختبار الربط بحساب MEXC' : 'Save & Test MEXC Connection')}
              </span>
            </button>

          </form>
        </div>

        {/* Security & Instructions Guide (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 text-xs">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'كيف تحصل على مفاتيح API من MEXC؟' : 'How to get your MEXC API Keys'}</span>
          </h3>

          <ol className="space-y-2.5 text-slate-300 list-decimal list-inside leading-relaxed">
            <li>
              {isAr ? 'سجل الدخول لحسابك في منصة ' : 'Log in to your account at '}
              <a href="https://www.mexc.com" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold underline inline-flex items-center gap-1">
                MEXC.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              {isAr ? 'انتقل إلى إعدادات الحساب > إدارة API (API Management).' : 'Go to User Profile > API Management.'}
            </li>
            <li>
              {isAr ? 'أنشئ مفتاح API جديد وقم بتفعيل خيار "تداول العقود الآجلة" (Futures Trading / Contract).' : 'Create a new API Key and check "Contract Trading" permission.'}
            </li>
            <li>
              {isAr ? 'انسخ الـ API Key والـ Secret Key وضعهما في الخانات المجاورة للبدء فوراً.' : 'Copy the API Key & Secret Key into the form on the left.'}
            </li>
          </ol>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'أمان عالي ومشفر' : 'Encrypted Proxy Security'}</span>
            </div>
            <p>
              {isAr
                ? 'يتم حساب توقيع HMAC-SHA256 بشكل آمن في الخادم المباشر دون كشف أي بيانات في المتصفح.'
                : 'All API requests are signed using server-side HMAC-SHA256. Secret keys are never exposed on client scripts.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
