import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Zap,
  Wallet,
  History,
  Settings as SettingsIcon,
  Play,
  Square,
  Cpu,
  Terminal,
  Wifi,
  Clock,
  ShieldCheck,
  Coins,
  ArrowRightLeft,
  RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "motion/react";
import {
  MEXCConfig,
  TradePosition,
  RewardTransferLog,
  BotLog,
  Candle,
  MarketInsight,
  NewsArticle,
  DashboardTab,
  SpotAssetBalance,
  FuturesAssetData
} from "./types";
import { EventFuturesView } from "./components/EventFuturesView";

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("DASHBOARD");
  
  const [config, setConfig] = useState<MEXCConfig>(() => {
    const saved = localStorage.getItem("mexc_config");
    return saved ? JSON.parse(saved) : {
      apiKey: "",
      apiSecret: "",
      isSandbox: true,
      autoTransferRewards: true,
      leverage: 20,
      eventDurationMinutes: 10
    };
  });

  const [positions, setPositions] = useState<TradePosition[]>(() => {
    const saved = localStorage.getItem("mexc_positions");
    return saved ? JSON.parse(saved) : [];
  });

  const [transferLogs, setTransferLogs] = useState<RewardTransferLog[]>(() => {
    const saved = localStorage.getItem("mexc_transfer_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [botLogs, setBotLogs] = useState<BotLog[]>(() => {
    const saved = localStorage.getItem("mexc_bot_logs");
    return saved ? JSON.parse(saved) : [
      {
        id: "init_1",
        timestamp: Date.now() - 300000,
        type: "INFO",
        message: "🤖 نظام الذكاء الاصطناعي Maria Bot جاهز وبانتظار التوجيهات."
      },
      {
        id: "init_2",
        timestamp: Date.now() - 250000,
        type: "INFO",
        message: "📱 بيئة العمل أندرويد 15 native مُهيأة بالكامل لإصدار LT_9904 (com.aistudio.mariabot.txwjqz)."
      }
    ];
  });

  const [btcPrice, setBtcPrice] = useState(68500.0);
  const [priceHistory, setPriceHistory] = useState<number[]>(() => {
    return Array.from({ length: 20 }, () => 68500.0 + (Math.random() - 0.48) * 100);
  });
  const [isAutoTradingActive, setIsAutoTradingActive] = useState(false);

  const [spotWallet] = useState<SpotAssetBalance[]>([
    { asset: "USDT", free: "14500.50", locked: "0.00" },
    { asset: "BTC", free: "0.185", locked: "0.00" },
    { asset: "MX", free: "520.00", locked: "0.00" },
    { asset: "ETH", free: "1.25", locked: "0.00" }
  ]);
  const [futuresWallet, setFuturesWallet] = useState<FuturesAssetData>({
    currency: "USDT",
    availableBalance: 5000.0,
    bonus: 150.0,
    positionMargin: 0.0
  });

  const addLog = (type: BotLog["type"], message: string) => {
    const newLog: BotLog = {
      id: `log_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      type,
      message
    };
    setBotLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBtcPrice((prev) => {
        const delta = (Math.random() - 0.49) * 45.0;
        const next = Math.max(10000, prev + delta);
        setPriceHistory((h) => [...h.slice(1), next]);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteEventOrder = (prediction: 'HIGHER' | 'LOWER', durationMinutes: number, amountUsdt: number) => {
    const newPos: TradePosition = {
      id: `event_${Date.now()}`,
      pair: "BTCUSDT",
      type: prediction === 'HIGHER' ? "LONG" : "SHORT",
      entryPrice: btcPrice,
      currentPrice: btcPrice,
      amount: amountUsdt,
      leverage: config.leverage,
      pnl: 0,
      pnlPercent: 0,
      timestamp: Date.now(),
      status: "ACTIVE",
      stopLoss: null,
      takeProfit: null
    };
    setPositions((prev) => [newPos, ...prev]);
    addLog("SUCCESS", `⚡ تم تنفيذ عقد أحداث جديد (${durationMinutes} دقائق - ${prediction === 'HIGHER' ? 'أعلى' : 'أدنى'}) بمبلغ $${amountUsdt} USDT بسعر $${btcPrice.toFixed(2)}.`);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="min-h-screen bg-[#090D1A] text-white font-sans flex flex-col dir-rtl" dir="rtl">
      {/* Top Header Navigation */}
      <header className="bg-[#0f172a] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-emerald-500/20">
            🤖
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Maria Bot <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">Android Native</span>
            </h1>
            <p className="text-xs text-gray-400">MEXC Event Futures & AI Trading Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-gray-400">BTC/USDT:</span>
            <span className="font-bold text-emerald-400">${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>

          <button
            onClick={() => setIsAutoTradingActive(!isAutoTradingActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isAutoTradingActive
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
            }`}
          >
            {isAutoTradingActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoTradingActive ? 'إيقاف التداول التلقائي' : 'تفعيل التداول الذكي'}
          </button>
        </div>
      </header>

      {/* App Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-[#0d1322] border-l border-gray-800/80 p-4 flex flex-col justify-between">
          <nav className="space-y-1">
            {[
              { id: "DASHBOARD", label: "الرئيسية (Dashboard)", icon: LayoutDashboard },
              { id: "EVENTS", label: "عقود الأحداث (Event Futures)", icon: Zap },
              { id: "FUTURES", label: "تداول العقود (Futures)", icon: TrendingUp },
              { id: "WALLET", label: "المحفظة (Wallet)", icon: Wallet },
              { id: "SETTINGS", label: "الإعدادات (Settings)", icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 shadow-md'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Android Target Status Card */}
          <div className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Target Architecture</span>
              <span className="text-emerald-400 font-mono font-bold">Android 15</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono">Package: com.aistudio.mariabot.txwjqz</div>
            <div className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Native Jetpack Compose Ready
            </div>
          </div>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === "DASHBOARD" && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>رصيد محفظة Futures</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">${futuresWallet.availableBalance.toLocaleString()} USDT</div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> +${futuresWallet.bonus} USDT مكافآت
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>الصفقات النشطة</span>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">{positions.filter(p => p.status === 'ACTIVE').length} صفقات</div>
                  <div className="text-xs text-gray-400 mt-1">الرافعة المالية: {config.leverage}x</div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>التوريد التلقائي للمكافآت</span>
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">{config.autoTransferRewards ? 'مُفعل تلقائياً' : 'غير مفعل'}</div>
                  <div className="text-xs text-gray-400 mt-1">Spot ➔ Futures</div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>حالة النظام</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    متصل وبانتظار التداولات
                  </div>
                  <div className="text-xs text-gray-400 mt-1">MEXC Official API Ready</div>
                </div>
              </div>

              {/* Event Futures Main Component */}
              <EventFuturesView />
            </div>
          )}

          {activeTab === "EVENTS" && (
            <EventFuturesView />
          )}

          {activeTab === "FUTURES" && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                تداول العقود الآجلة المستمرة (Continuous Futures)
              </h2>
              <p className="text-sm text-gray-400">تطبيق أندرويد الأصلي يحتوي على محرك TradingEngine يدعم التحليل الفني لـ RSI وشمعات K-lines ووقف الخسارة وجني الأرباح تلقائياً.</p>
            </div>
          )}

          {activeTab === "WALLET" && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                محافظ منصة MEXC والتوريد التلقائي
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                  <h3 className="font-bold text-emerald-400">محفظة التداول الفوري (Spot Wallet)</h3>
                  {spotWallet.map((item) => (
                    <div key={item.asset} className="flex justify-between text-sm py-1 border-b border-gray-800">
                      <span className="font-bold text-white">{item.asset}</span>
                      <span className="font-mono text-gray-300">{item.free}</span>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                  <h3 className="font-bold text-cyan-400">محفظة العقود الآجلة (Futures Wallet)</h3>
                  <div className="flex justify-between text-sm py-1 border-b border-gray-800">
                    <span className="text-gray-400">الرصيد المتاح</span>
                    <span className="font-mono font-bold text-white">${futuresWallet.availableBalance} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-gray-800">
                    <span className="text-gray-400">المكافآت الترويجية</span>
                    <span className="font-mono text-emerald-400">+${futuresWallet.bonus} USDT</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "SETTINGS" && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-6 space-y-6 max-w-2xl">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-6 h-6 text-emerald-400" />
                إعدادات الربط والمنصة
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">MEXC API Key</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="أدخل مفتاح API الخاص بك..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">MEXC API Secret</label>
                  <input
                    type="password"
                    value={config.apiSecret}
                    onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                    placeholder="أدخل السر الخاص بـ API..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <span>التوريد التلقائي لمكافآت Spot إلى Futures</span>
                  <input
                    type="checkbox"
                    checked={config.autoTransferRewards}
                    onChange={(e) => setConfig({ ...config, autoTransferRewards: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bot Activity Terminal Logs */}
          <div className="bg-[#090d1a] border border-gray-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>سجل أفعال الذكاء الاصطناعي Live AI Terminal Logs</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-mono">{botLogs.length} أحداث مُسجلة</span>
            </div>
            <div className="h-40 overflow-y-auto font-mono text-xs space-y-1 text-gray-300">
              {botLogs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={log.type === 'SUCCESS' ? 'text-emerald-400' : log.type === 'WARNING' ? 'text-amber-400' : 'text-gray-300'}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
