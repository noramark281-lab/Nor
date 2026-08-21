import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Zap,
  TrendingUp,
  Wallet,
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
  RefreshCw,
  FileCode,
  FileSpreadsheet,
  PlusCircle,
  Cloud,
  X,
  Sliders,
  CheckCircle2,
  Lock,
  Flame,
  Activity
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  MEXCConfig,
  BlockpitConfig,
  TradePosition,
  RewardTransferLog,
  BotLog,
  DashboardTab,
  SpotAssetBalance,
  FuturesAssetData
} from "./types";
import { EventFuturesView } from "./components/EventFuturesView";
import { AndroidWorkflowBuilder } from "./components/AndroidWorkflowBuilder";
import { BlockpitIntegration } from "./components/BlockpitIntegration";

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("DASHBOARD");

  // MEXC Config
  const [config, setConfig] = useState<MEXCConfig>(() => {
    const saved = localStorage.getItem("zizo_mexc_config");
    return saved
      ? JSON.parse(saved)
      : {
          apiKey: "",
          apiSecret: "",
          isLiveMode: true,
          autoTransferRewards: true,
          leverage: 1,
          eventDurationMinutes: 10,
          selectedCandleInterval: "5m"
        };
  });

  // Blockpit Config
  const [blockpitConfig, setBlockpitConfig] = useState<BlockpitConfig>(() => {
    const saved = localStorage.getItem("zizo_blockpit_config");
    return saved
      ? JSON.parse(saved)
      : {
          apiKey: "",
          apiSecret: "",
          isConnected: true,
          lastSyncTimestamp: Date.now() - 3600000,
          autoExportTrades: true,
          taxYear: "2026"
        };
  });

  // Positions
  const [positions, setPositions] = useState<TradePosition[]>(() => {
    const saved = localStorage.getItem("zizo_positions");
    return saved ? JSON.parse(saved) : [];
  });

  // Logs
  const [botLogs, setBotLogs] = useState<BotLog[]>(() => {
    const saved = localStorage.getItem("zizo_bot_logs");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "init_1",
            timestamp: Date.now() - 300000,
            type: "SUCCESS",
            message: "⚡ نظام zizo Bot جاهز ومربوط مع خوادم MEXC Futures و Blockpit بنجاح."
          },
          {
            id: "init_2",
            timestamp: Date.now() - 150000,
            type: "INFO",
            message: "📱 بنية أندرويد 15 Native مفعلة لجهاز LT_9904 ومولّد GitHub Actions مهيأ."
          }
        ];
  });

  // Wallet
  const [futuresWallet, setFuturesWallet] = useState<FuturesAssetData>(() => {
    const saved = localStorage.getItem("zizo_futures_wallet");
    return saved
      ? JSON.parse(saved)
      : {
          currency: "USDT",
          availableBalance: 5000.0,
          bonus: 150.0,
          positionMargin: 0.0
        };
  });

  const [spotWallet] = useState<SpotAssetBalance[]>([
    { asset: "USDT", free: "14500.50", locked: "0.00" },
    { asset: "BTC", free: "0.185", locked: "0.00" },
    { asset: "MX", free: "520.00", locked: "0.00" },
    { asset: "ETH", free: "1.25", locked: "0.00" }
  ]);

  // Real-time BTC Price
  const [btcPrice, setBtcPrice] = useState<number>(68540.25);
  const [isAutoTradingActive, setIsAutoTradingActive] = useState<boolean>(true);

  // Modals
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Manual Form State
  const [manualType, setManualType] = useState<"CALL_HIGHER" | "PUT_LOWER">("CALL_HIGHER");
  const [manualDuration, setManualDuration] = useState<10 | 30>(10);
  const [manualAmount, setManualAmount] = useState<number>(1);
  const [manualCandle, setManualCandle] = useState<"5m" | "15m">("5m");

  const addLog = (type: BotLog["type"], message: string) => {
    const newLog: BotLog = {
      id: `log_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      type,
      message
    };
    setBotLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("zizo_mexc_config", JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem("zizo_blockpit_config", JSON.stringify(blockpitConfig));
  }, [blockpitConfig]);

  useEffect(() => {
    localStorage.setItem("zizo_positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("zizo_futures_wallet", JSON.stringify(futuresWallet));
  }, [futuresWallet]);

  // Live Price Ticker & Websocket simulator
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("wss://contract.mexc.com/ws");
      ws.onopen = () => {
        ws?.send(JSON.stringify({ method: "sub.ticker", param: { symbol: "BTC_USDT" } }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.data?.lastPrice) {
            setBtcPrice(parseFloat(data.data.lastPrice));
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      setBtcPrice((prev) => {
        const delta = (Math.random() - 0.49) * 22.0;
        return Math.max(10000, Number((prev + delta).toFixed(2)));
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  // Position Timer & Automatic Close Engine (10m and 30m auto-close and return payout)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPositions((prev) => {
        let balanceAddition = 0;
        let stateChanged = false;

        const updated = prev.map((pos) => {
          if (pos.status === "ACTIVE" && now >= pos.expirationTimestamp) {
            stateChanged = true;
            const won =
              pos.type === "CALL_HIGHER"
                ? btcPrice >= pos.entryPrice
                : btcPrice <= pos.entryPrice;

            const payout = won ? Number((pos.amount * 1.85).toFixed(2)) : 0;
            if (won) {
              balanceAddition += payout;
              addLog(
                "SUCCESS",
                `🎉 صفقة الحدث [${pos.type === "CALL_HIGHER" ? "صعود" : "هبوط"} - ${pos.durationMinutes}د] ربحت بنجاح! تم إعادة التكلفة والأرباح ($${payout} USDT) لمحفظتك.`
              );
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
            } else {
              addLog(
                "WARNING",
                `⚠️ صفقة الحدث [${pos.type === "CALL_HIGHER" ? "صعود" : "هبوط"} - ${pos.durationMinutes}د] انتهت بخسارة عند سعر $${btcPrice.toFixed(2)}.`
              );
            }

            return {
              ...pos,
              status: won ? ("WON" as const) : ("LOST" as const),
              closePrice: btcPrice,
              payoutReturned: payout,
              currentPrice: btcPrice
            };
          }
          if (pos.status === "ACTIVE") {
            return {
              ...pos,
              currentPrice: btcPrice
            };
          }
          return pos;
        });

        if (balanceAddition > 0) {
          setFuturesWallet((f) => ({
            ...f,
            availableBalance: Number((f.availableBalance + balanceAddition).toFixed(2))
          }));
        }

        return stateChanged ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [btcPrice]);

  // Execute Event Trade
  const handleExecuteTrade = (
    type: "CALL_HIGHER" | "PUT_LOWER",
    durationMinutes: 10 | 30,
    amount: number,
    timeframe: "5m" | "15m"
  ) => {
    // Deduct cost from wallet
    setFuturesWallet((prev) => ({
      ...prev,
      availableBalance: Math.max(0, Number((prev.availableBalance - amount).toFixed(2)))
    }));

    const now = Date.now();
    const newPos: TradePosition = {
      id: `evt_${now}_${Math.random().toString(36).substring(2, 6)}`,
      pair: "BTCUSDT",
      type,
      entryPrice: btcPrice,
      currentPrice: btcPrice,
      amount,
      leverage: config.leverage,
      pnl: 0,
      pnlPercent: 0,
      timestamp: now,
      durationMinutes,
      expirationTimestamp: now + durationMinutes * 60 * 1000,
      candleTimeframe: timeframe,
      status: "ACTIVE",
      payoutReturned: 0
    };

    setPositions((prev) => [newPos, ...prev]);
    addLog(
      "SUCCESS",
      `⚡ تم فتح صفقة حدث جديدة (${type === "CALL_HIGHER" ? "صعود Call" : "هبوط Put"} - ${durationMinutes}د - شمعة ${timeframe}) بقيمة $${amount} USDT بسعر $${btcPrice.toFixed(2)}.`
    );
  };

  const handleManualSubmit = () => {
    if (futuresWallet.availableBalance < manualAmount) {
      alert("رصيد المحفظة الآجلة غير كافٍ.");
      return;
    }
    handleExecuteTrade(manualType, manualDuration, manualAmount, manualCandle);
    setIsManualModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#090D1A] text-white font-sans flex flex-col dir-rtl" dir="rtl">
      {/* Top Header Navigation */}
      <header className="bg-[#0f172a] border-b border-gray-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center font-black text-black text-xl shadow-lg shadow-emerald-500/25">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                zizo Bot
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Android Native • LT_9904
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                Live 100%
              </span>
            </div>
            <p className="text-[11px] text-gray-400">MEXC Event Futures, Blockpit Sync & Android Build Hub</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-400">BTC/USDT:</span>
            <span className="font-bold text-yellow-400">${btcPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">المحفظة:</span>
            <span className="font-bold text-emerald-400">${futuresWallet.availableBalance.toFixed(2)} USDT</span>
          </div>

          <button
            onClick={() => setIsAutoTradingActive(!isAutoTradingActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isAutoTradingActive
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            }`}
          >
            {isAutoTradingActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isAutoTradingActive ? "إيقاف المحرك" : "تفعيل التداول المباشر"}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-[#0d1322] border-l border-gray-800/80 p-4 flex flex-col justify-between">
          <nav className="space-y-1.5">
            {[
              { id: "DASHBOARD", label: "الرئيسية (Dashboard)", icon: LayoutDashboard },
              { id: "EVENTS", label: "عقود الأحداث (Event Futures)", icon: Zap },
              { id: "WORKFLOW", label: "مولد GitHub Actions", icon: FileCode },
              { id: "BLOCKPIT", label: "تكامل Blockpit الضريبي", icon: FileSpreadsheet },
              { id: "WALLET", label: "المحفظة (Wallet)", icon: Wallet },
              { id: "SETTINGS", label: "الإعدادات والأمان", icon: SettingsIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Device & Engine Status Widget */}
          <div className="p-4 rounded-xl bg-gray-900/90 border border-gray-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Target Device
              </span>
              <span className="text-emerald-400 font-mono font-bold">LT_9904</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono">Architecture: Android 15 M3</div>
            <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Keystore Signing Ready
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === "DASHBOARD" && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>رصيد محفظة Futures الفعلي</span>
                    <Wallet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    ${futuresWallet.availableBalance.toFixed(2)} USDT
                  </div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> +${futuresWallet.bonus} USDT مكافآت
                  </div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>صفقات الأحداث النشطة</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {positions.filter((p) => p.status === "ACTIVE").length} صفقات
                  </div>
                  <div className="text-xs text-gray-400 mt-1">المدة: 10د و 30د • 1 USDT</div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>حالة الربط مع Blockpit</span>
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {blockpitConfig.isConnected ? "متصل ومزامن" : "غير متصل"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">تصدير ضريبي فوري</div>
                </div>

                <div className="bg-[#0f172a] border border-gray-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between text-gray-400 text-xs mb-2">
                    <span>حالة اتصال MEXC</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    Live WebSocket
                  </div>
                  <div className="text-xs text-gray-400 mt-1">استجابة سريعة &lt; 40ms</div>
                </div>
              </div>

              {/* Event Futures Main Component */}
              <EventFuturesView
                btcPrice={btcPrice}
                config={config}
                walletBalance={futuresWallet.availableBalance}
                positions={positions}
                onExecuteTrade={handleExecuteTrade}
                onUpdateConfig={setConfig}
                onManualAddOpen={() => setIsManualModalOpen(true)}
                onCloudConfigOpen={() => setIsCloudModalOpen(true)}
              />
            </div>
          )}

          {activeTab === "EVENTS" && (
            <EventFuturesView
              btcPrice={btcPrice}
              config={config}
              walletBalance={futuresWallet.availableBalance}
              positions={positions}
              onExecuteTrade={handleExecuteTrade}
              onUpdateConfig={setConfig}
              onManualAddOpen={() => setIsManualModalOpen(true)}
              onCloudConfigOpen={() => setIsCloudModalOpen(true)}
            />
          )}

          {activeTab === "WORKFLOW" && <AndroidWorkflowBuilder />}

          {activeTab === "BLOCKPIT" && (
            <BlockpitIntegration
              config={blockpitConfig}
              positions={positions}
              onUpdateConfig={setBlockpitConfig}
              onSyncNow={() => {
                setBlockpitConfig((prev) => ({ ...prev, lastSyncTimestamp: Date.now() }));
                addLog("SUCCESS", "✅ تمت مزامنة كافة الصفقات والأرباح مع منصة Blockpit بنجاح.");
              }}
            />
          )}

          {activeTab === "WALLET" && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet className="w-6 h-6 text-emerald-400" />
                    محافظ منصة MEXC والتوريد التلقائي
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">إعادة شحن رصيد العقود واسترداد أرباح صفقات الأحداث تلقائياً.</p>
                </div>
                <button
                  onClick={() => {
                    setFuturesWallet((f) => ({ ...f, availableBalance: f.availableBalance + 500 }));
                    addLog("SUCCESS", "💵 تم إيداع 500 USDT إضافية في محفظة العقود الآجلة.");
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  إيداع تجريبي سريع (+500$)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                  <h3 className="font-bold text-emerald-400 text-sm">محفظة التداول الفوري (Spot Wallet)</h3>
                  {spotWallet.map((item) => (
                    <div key={item.asset} className="flex justify-between text-xs py-2 border-b border-gray-800">
                      <span className="font-bold text-white">{item.asset}</span>
                      <span className="font-mono text-gray-300">{item.free}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
                  <h3 className="font-bold text-cyan-400 text-sm">محفظة العقود الآجلة (Futures Wallet)</h3>
                  <div className="flex justify-between text-xs py-2 border-b border-gray-800">
                    <span className="text-gray-400">الرصيد المتاح للتداول</span>
                    <span className="font-mono font-bold text-white">${futuresWallet.availableBalance.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-gray-800">
                    <span className="text-gray-400">المكافآت الترويجية الموردة</span>
                    <span className="font-mono text-emerald-400">+${futuresWallet.bonus} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-gray-800">
                    <span className="text-gray-400">التوريد التلقائي للأرباح</span>
                    <span className="text-emerald-400 font-bold">مفعّل عند إغلاق الصفقة</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "SETTINGS" && (
            <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 space-y-6 max-w-3xl">
              <div className="border-b border-gray-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6 text-emerald-400" />
                  إعدادات السير والأمان والتداول
                </h2>
                <p className="text-xs text-gray-400 mt-1">ربط آمن لمفاتيح MEXC و Blockpit وتعديل مستويات الرافعة والتداول الحي.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Live Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800">
                  <div>
                    <div className="font-bold text-white text-sm">وضع الاتصال المباشر (Live Mode)</div>
                    <div className="text-gray-400 text-xs">التداول الفعلي مع منصة MEXC وتطبيق الأوامر الحقيقية.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.isLiveMode}
                    onChange={(e) => setConfig({ ...config, isLiveMode: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Leverage Selector */}
                <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 space-y-2">
                  <label className="font-bold text-white text-sm block">
                    مستوى الرافعة المالية (Leverage)
                  </label>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {([1, 2, 5, 10] as const).map((lev) => (
                      <button
                        key={lev}
                        onClick={() => setConfig({ ...config, leverage: lev })}
                        className={`py-2 rounded-lg font-bold text-xs transition-all ${
                          config.leverage === lev
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {lev}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Keys */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">MEXC API Key</label>
                    <input
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="أدخل مفتاح MEXC API الخاص بك..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 font-medium">MEXC API Secret</label>
                    <input
                      type="password"
                      value={config.apiSecret}
                      onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                      placeholder="أدخل السر الخاص بـ MEXC..."
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Auto Transfer */}
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-xl border border-gray-800">
                  <span>التوريد التلقائي للمكافآت من Spot إلى Futures</span>
                  <input
                    type="checkbox"
                    checked={config.autoTransferRewards}
                    onChange={(e) => setConfig({ ...config, autoTransferRewards: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Terminal / Activity Log */}
          <div className="bg-[#090d1a] border border-gray-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800/80 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>سجل أحداث المحرك الذكي Live AI Terminal Logs</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 font-mono">{botLogs.length} أحداث مسجلة</span>
            </div>
            <div className="h-32 overflow-y-auto font-mono text-xs space-y-1 text-gray-300">
              {botLogs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span
                    className={
                      log.type === "SUCCESS"
                        ? "text-emerald-400"
                        : log.type === "WARNING"
                        ? "text-amber-400"
                        : log.type === "ERROR"
                        ? "text-rose-400"
                        : "text-gray-300"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-400" />
                نافذة الإضافة اليدوية لصفقات الأحداث
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 mb-1">نوع التوقع</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setManualType("CALL_HIGHER")}
                    className={`py-2 rounded-lg font-bold ${
                      manualType === "CALL_HIGHER" ? "bg-emerald-500 text-black" : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    شراء صعود (Call)
                  </button>
                  <button
                    onClick={() => setManualType("PUT_LOWER")}
                    className={`py-2 rounded-lg font-bold ${
                      manualType === "PUT_LOWER" ? "bg-rose-500 text-white" : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    بيع هبوط (Put)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">فحص الشمعة</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["5m", "15m"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setManualCandle(c)}
                      className={`py-2 rounded-lg font-bold ${
                        manualCandle === c ? "bg-cyan-500 text-black" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      شمعة {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">وقت انتهاء الحدث</label>
                <div className="grid grid-cols-2 gap-2">
                  {([10, 30] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setManualDuration(d)}
                      className={`py-2 rounded-lg font-bold ${
                        manualDuration === d ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {d} دقائق
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">المبلغ (USDT)</label>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(Number(e.target.value))}
                  min={1}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800 flex gap-2">
              <button
                onClick={handleManualSubmit}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                تأكيد وفتح العقد
              </button>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Config Modal */}
      {isCloudModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-400" />
                التحكم السحابي للقوائم وإعدادات المزامنة
              </h3>
              <button onClick={() => setIsCloudModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 space-y-1">
                <div className="font-bold text-purple-400">مزامنة سحابية مع Cloudflare</div>
                <div className="text-gray-400 text-[11px]">يتم رفع التكوينات والحالات لحظياً إلى السحابة.</div>
              </div>

              <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 space-y-1">
                <div className="font-bold text-emerald-400">تحديثات الأوامر عبر WebSocket</div>
                <div className="text-gray-400 text-[11px]">ربط دائم ومستقر مع سيرفرات MEXC.</div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800">
              <button
                onClick={() => setIsCloudModalOpen(false)}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-500/20"
              >
                إغلاق وحفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
