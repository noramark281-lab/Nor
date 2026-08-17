import React, { useState, useEffect, useCallback } from 'react'
import {
  Chrome as Home,
  ChartCandlestick as CandlestickChart,
  Bot,
  Flame,
  History,
  Settings as SettingsIcon,
} from 'lucide-react'
import { db } from './lib/supabase'
import HomeScreen from './screens/HomeScreen'
import TradingScreen from './screens/TradingScreen'
import BotScreen from './screens/BotScreen'
import ScannerScreen from './screens/ScannerScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'

export type AppSettings = {
  api_key: string | null
  api_secret: string | null
  trade_amount: number
  selected_symbol: string
  bot_strategy: string
  bot_running: boolean
  trailing_stop_percent?: number
  min_volume_usdt?: number
  auto_dust_sweep?: boolean
  cooldown_seconds?: number
}

export type Screen = 'home' | 'trading' | 'bot' | 'scanner' | 'history' | 'settings'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      let s = await db.getSettings()
      if (!s) {
        s = await db.saveSettings({
          trade_amount: 1.0,
          selected_symbol: 'BTCUSDT',
          bot_strategy: 'multi_layer_pro',
          bot_running: false,
          trailing_stop_percent: 1.8,
          min_volume_usdt: 1000000,
          auto_dust_sweep: true,
          cooldown_seconds: 1.5,
        })
      }
      setSettings(s as AppSettings)
    } catch (e) {
      console.error('Settings load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev))
  }, [])

  if (loading || !settings) {
    return (
      <div className="app-container">
        <div className="loading-spinner" style={{ flex: 1 }}>
          <div className="spinner" />
        </div>
      </div>
    )
  }

  const navItems: { id: Screen; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'trading', label: 'التداول', icon: CandlestickChart },
    { id: 'bot', label: 'البوت', icon: Bot },
    { id: 'scanner', label: 'الرادار', icon: Flame },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'settings', label: 'الإعدادات', icon: SettingsIcon },
  ]

  return (
    <div className="app-container">
      <div className="screen" style={{ paddingBottom: 0 }}>
        {screen === 'home' && (
          <HomeScreen settings={settings} onNavigate={setScreen} onSettingsUpdate={updateSettings} />
        )}
        {screen === 'trading' && (
          <TradingScreen settings={settings} onSettingsUpdate={updateSettings} />
        )}
        {screen === 'bot' && (
          <BotScreen settings={settings} onSettingsUpdate={updateSettings} />
        )}
        {screen === 'scanner' && (
          <ScannerScreen
            onSelectPair={(sym) => {
              updateSettings({ selected_symbol: sym })
              setScreen('trading')
            }}
          />
        )}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'settings' && (
          <SettingsScreen settings={settings} onSettingsSaved={loadSettings} />
        )}
      </div>

      <nav className="nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav-item ${screen === item.id ? 'active' : ''}`}
              onClick={() => setScreen(item.id)}
            >
              <Icon size={20} />
              <span style={{ fontSize: '11px', marginTop: 2 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
