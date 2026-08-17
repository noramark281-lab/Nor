import React, { useState } from 'react'
import {
  Key,
  Save,
  Eye,
  EyeOff,
  CircleCheck as CheckCircle,
  CircleAlert as AlertCircle,
  Shield,
  Sliders,
  ShieldCheck,
  Flame,
  Clock,
} from 'lucide-react'
import { db, mexcApi } from '../lib/supabase'
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
  const [tradeAmount, setTradeAmount] = useState(settings.trade_amount || 1.0)
  const [trailingStop, setTrailingStop] = useState(settings.trailing_stop_percent || 1.8)
  const [minVolume, setMinVolume] = useState((settings.min_volume_usdt || 1000000) / 1000000)
  const [cooldown, setCooldown] = useState(settings.cooldown_seconds || 1.5)
  const [autoDust, setAutoDust] = useState(settings.auto_dust_sweep ?? true)

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
        trade_amount: Number(tradeAmount),
        trailing_stop_percent: Number(trailingStop),
        min_volume_usdt: Number(minVolume) * 1000000,
        cooldown_seconds: Number(cooldown),
        auto_dust_sweep: autoDust,
      })
      setMessage({ type: 'success', text: 'تم حفظ كافة الإعدادات ومعايير الأمان بنجاح' })
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
          text: `تم الاتصال بنجاح! نوع الحساب: ${account.accountType || 'SPOT'} - الصلاحيات: تداول فوري نشط`,
        })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4 pb-20 animate-in">
      <div className="screen-title" style={{ margin: 0 }}>الإعدادات ومعايير الأمان</div>

      {message && (
        <div className={message.type === 'success' ? 'success-banner' : 'error-banner'}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* MEXC API Credentials */}
      <div className="card">
        <div className="row justify-between items-center" style={{ marginBottom: 14 }}>
          <div className="row gap-8 items-center">
            <Key size={20} className="text-accent" />
            <span className="font-semibold text-sm">مفاتيح MEXC Spot API</span>
          </div>
          <Shield size={18} className="text-green" />
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-secondary block" style={{ marginBottom: 4 }}>
              API Key (Spot)
            </label>
            <div className="row gap-8">
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="أدخل مفتاح API Key"
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
            <label className="text-xs text-secondary block" style={{ marginBottom: 4 }}>
              Secret Key (Spot)
            </label>
            <div className="row gap-8">
              <input
                className="input"
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="أدخل مفتاح Secret Key"
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
          <button className="btn btn-green" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleTest} disabled={testing}>
            {testing ? 'جاري الفحص...' : 'اختبار الاتصال'}
          </button>
        </div>
      </div>

      {/* Advanced Strategy & Anti-Freeze Config */}
      <div className="card">
        <div className="row gap-6 items-center" style={{ marginBottom: 12 }}>
          <Sliders size={18} className="text-green" />
          <span className="font-semibold text-sm">ضوابط التداول وإدارة رأس المال</span>
        </div>

        <div className="space-y-3">
          {/* Trade Amount */}
          <div className="row justify-between items-center">
            <div>
              <span className="text-xs font-bold text-white block">مبلغ الدخول للصفقة (USD)</span>
              <span className="text-xs text-muted">الحد الأدنى للصفقة $1.00 USD</span>
            </div>
            <input
              type="number"
              className="input"
              style={{ width: '90px', textAlign: 'center' }}
              value={tradeAmount}
              min={1}
              step={0.5}
              onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 1.0)}
            />
          </div>

          <div className="divider" />

          {/* Trailing Stop % */}
          <div className="row justify-between items-center">
            <div className="row gap-6 items-center">
              <ShieldCheck size={16} className="text-green" />
              <div>
                <span className="text-xs font-bold text-white block">الوقف المتحرك (Trailing Stop %)</span>
                <span className="text-xs text-muted">تسييل فوري عند ارتداد السعر لحماية رأس المال</span>
              </div>
            </div>
            <div className="row gap-4 items-center">
              <input
                type="number"
                className="input"
                style={{ width: '75px', textAlign: 'center' }}
                value={trailingStop}
                min={0.5}
                max={10}
                step={0.1}
                onChange={(e) => setTrailingStop(parseFloat(e.target.value) || 1.8)}
              />
              <span className="text-xs text-secondary">%</span>
            </div>
          </div>

          <div className="divider" />

          {/* Min Volume Scanner */}
          <div className="row justify-between items-center">
            <div className="row gap-6 items-center">
              <Flame size={16} className="text-accent" />
              <div>
                <span className="text-xs font-bold text-white block">حد أدنى لحجم التداول 24h</span>
                <span className="text-xs text-muted">فلترة واستبعاد العملات الضعيفة وغير السائلة</span>
              </div>
            </div>
            <div className="row gap-4 items-center">
              <input
                type="number"
                className="input"
                style={{ width: '75px', textAlign: 'center' }}
                value={minVolume}
                min={0.5}
                step={0.5}
                onChange={(e) => setMinVolume(parseFloat(e.target.value) || 1.0)}
              />
              <span className="text-xs text-secondary">مليون $</span>
            </div>
          </div>

          <div className="divider" />

          {/* Cooldown */}
          <div className="row justify-between items-center">
            <div className="row gap-6 items-center">
              <Clock size={16} className="text-secondary" />
              <div>
                <span className="text-xs font-bold text-white block">فترة التهدئة بين الأوامر (Cooldown)</span>
                <span className="text-xs text-muted">الامتثال التام لسياسة MEXC لمنع حظر الـ IP</span>
              </div>
            </div>
            <div className="row gap-4 items-center">
              <input
                type="number"
                className="input"
                style={{ width: '75px', textAlign: 'center' }}
                value={cooldown}
                min={1.0}
                max={5.0}
                step={0.5}
                onChange={(e) => setCooldown(parseFloat(e.target.value) || 1.5)}
              />
              <span className="text-xs text-secondary">ثانية</span>
            </div>
          </div>

          <div className="divider" />

          {/* Auto Dust Sweeper */}
          <div className="row justify-between items-center">
            <div>
              <span className="text-xs font-bold text-white block">التسييل التلقائي للأرصدة الصغيرة (Dust Sweep)</span>
              <span className="text-xs text-muted">تحويل بقايا العملات الصغيرة تلقائياً إلى USDT</span>
            </div>
            <input
              type="checkbox"
              checked={autoDust}
              onChange={(e) => setAutoDust(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--green)' }}
            />
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="card" style={{ background: 'rgba(240, 185, 11, 0.05)', border: '1px solid rgba(240, 185, 11, 0.2)' }}>
        <div className="col gap-4">
          <div className="row gap-6 items-center">
            <Shield size={16} className="text-accent" />
            <span className="font-semibold text-xs text-accent">إرشادات الأمان الرسمية لـ MEXC 2026</span>
          </div>
          <span className="text-xs text-secondary" style={{ lineHeight: 1.5 }}>
            • احرص على تفعيل صلاحيات (Spot Trading) فقط في مفتاح الـ API دون منح صلاحية السحب (Withdrawal).
            • يتم توقيع جميع الأوامر محلياً بواسطة HMAC SHA-256 مع ختم زمني آمن (Timestamp) لحماية حسابك من التلاعب.
          </span>
        </div>
      </div>
    </div>
  )
}
