import { useState, useEffect, useCallback } from 'react'
import { Trash2, History as HistoryIcon, Bot } from 'lucide-react'
import { db } from '../lib/supabase'

export default function HistoryScreen() {
  const [trades, setTrades] = useState<any[]>([])
  const [botTrades, setBotTrades] = useState<any[]>([])
  const [tab, setTab] = useState<'manual' | 'bot'>('manual')
  const [loading, setLoading] = useState(true)

  const fetchTrades = useCallback(async () => {
    setLoading(true)
    try {
      const [manual, bot] = await Promise.all([db.getTrades(100), db.getBotTrades(100)])
      setTrades(manual)
      setBotTrades(bot)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  const clearHistory = async () => {
    if (tab === 'manual') {
      await db.clearTrades()
      setTrades([])
    } else {
      await db.clearBotTrades()
      setBotTrades([])
    }
  }

  const current = tab === 'manual' ? trades : botTrades

  return (
    <div className="animate-in">
      <div className="screen-title">سجل التداول</div>

      <div className="row gap-8" style={{ marginBottom: 16 }}>
        <button
          className={`symbol-btn ${tab === 'manual' ? 'active' : ''}`}
          style={{ flex: 1, padding: '10px' }}
          onClick={() => setTab('manual')}
        >
          <HistoryIcon size={16} style={{ display: 'inline', marginLeft: 6 }} />
          صفقات يدوية
        </button>
        <button
          className={`symbol-btn ${tab === 'bot' ? 'active' : ''}`}
          style={{ flex: 1, padding: '10px' }}
          onClick={() => setTab('bot')}
        >
          <Bot size={16} style={{ display: 'inline', marginLeft: 6 }} />
          صفقات البوت
        </button>
      </div>

      {current.length > 0 && (
        <button
          className="btn btn-outline"
          style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
          onClick={clearHistory}
        >
          <Trash2 size={16} />
          مسح السجل
        </button>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : current.length === 0 ? (
        <div className="empty-state">
          <HistoryIcon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>لا توجد صفقات في السجل</div>
        </div>
      ) : (
        <div className="card">
          {current.map((t) => (
            <div key={t.id} className="trade-row">
              <div className="col gap-4">
                <div className="row gap-8">
                  <span className="font-semibold text-sm">{t.symbol}</span>
                  <span className={`badge ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                    {t.side === 'BUY' ? 'شراء' : 'بيع'}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(t.created_at).toLocaleString('ar')}
                </span>
              </div>
              <div className="col gap-4" style={{ alignItems: 'flex-end' }}>
                <span className="font-bold text-sm">${parseFloat(t.amount).toFixed(2)}</span>
                <span className="text-xs text-muted">
                  @ ${parseFloat(t.price).toFixed(2)}
                </span>
                {t.error && (
                  <span className="text-xs text-red">{t.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
