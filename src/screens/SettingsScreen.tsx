import { useState, useEffect } from 'react'
import { Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { db, mexcApi } from '../lib/supabase'
import { MAX_TRADE_AMOUNT, MIN_TRADE_AMOUNT } from '../lib/constants'
import type { AppSettings } from '../App'

export default function SettingsScreen({
  settings,
  onSettingsSaved,
}: {
  settings: AppSettings
  onSettingsSaved: () => void
}) {
  const [apiKey, setApiKey] = useState(settings.api_key || '')
  const [apiSecret, setApiSecret] = useState(settings.api_secret || '')
  const [showKey, setShowKey] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await db.saveSettings({
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
      })
      setMessage({ type: 'success', text: 'تم حفظ المفاتيح بنجاح' })
      onSettingsSaved()
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setMessage({ type: 'error', text: 'أدخل المفاتيح أولاً ثم احفظها' })
      return
    }
    setTesting(true)
    setMessage(null)
    try {
      await db.saveSettings({
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
      })
      onSettingsSaved()
      const account = await mexcApi.getAccount()
      if (account.error) {
        setMessage({ type: 'error', text: account.error })
      } else {
        setMessage({
          type: 'success',
          text: `تم الاتصال بنجاح! نوع الحساب: ${account.accountType || 'SPOT'}`,
        })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="animate-in">
      <div className="screen-title">الإعدادات</div>

      {message && (
        <div className={message.type === 'success' ? 'success-banner' : 'error-banner'}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="card">
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="row gap-8">
            <Key size={20} className="text-accent" />
            <span className="font-semibold">مفاتيح MEXC API</span>
          </div>
          <Shield size={18} className="text-green" />
        </div>

        <div className="col gap-8">
          <div>
            <label className="text-xs text-secondary" style={{ display: 'block', marginBottom: 6 }}>
              API Key
            </label>
            <div className="row gap-8">
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="أدخل API Key"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-outline"
                style={{ padding: '10px', minWidth: '44px' }}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary" style={{ display: 'block', marginBottom: 6 }}>
              API Secret
            </label>
            <div className="row gap-8">
              <input
                className="input"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="أدخل API Secret"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-outline"
                style={{ padding: '10px', minWidth: '44px' }}
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="divider" />
        <div className="row gap-8">
          <button
            className="btn btn-green"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
          </button>
        </div>
      </div>

      <div className="card">
        <span className="font-semibold" style={{ display: 'block', marginBottom: 12 }}>
          إعدادات التداول
        </span>
        <div className="col gap-12">
          <div className="row">
            <span className="text-sm text-secondary">مبلغ الصفقة</span>
            <span className="font-bold text-accent">${MAX_TRADE_AMOUNT.toFixed(2)}</span>
          </div>
          <div className="row">
            <span className="text-sm text-secondary">الحد الأدنى</span>
            <span className="font-bold">${MIN_TRADE_AMOUNT.toFixed(2)}</span>
          </div>
          <div className="row">
            <span className="text-sm text-secondary">العملة المحددة</span>
            <span className="font-bold">{settings.selected_symbol}</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'rgba(240, 185, 11, 0.05)' }}>
        <div className="col gap-8">
          <div className="row">
            <Shield size={18} className="text-accent" />
            <span className="font-semibold text-accent">معلومات الأمان</span>
          </div>
          <span className="text-xs text-secondary">
            مفاتيحك محفوظة في قاعدة بيانات آمنة ولا تترك الجهاز إلا لتوقيع الطلبات على خادم MEXC مباشرة.
            لا نشارك مفاتيحك مع أي طرف ثالث. استخدم مفاتيح API ذات صلاحيات التداول فقط (بدون سحب).
          </span>
        </div>
      </div>
    </div>
  )
}
