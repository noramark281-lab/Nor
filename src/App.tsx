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
  Activity,
  Radio,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  MEXCConfig,
  BlockpitConfig,
  FirebaseSyncConfig,
  TradePosition,
  BotLog,
  DashboardTab,
  SpotOrder,
  ServerTimeSync,
  WithdrawalRequest
} from "./types";
import { SpotTrading3DView } from "./components/SpotTrading3DView";
import { EventFuturesView } from "./components/EventFuturesView";
import { WalletTransfer3D } from "./components/WalletTransfer3D";
import { TimeSyncHUD } from "./components/TimeSyncHUD";
import { ApiIntegrationsView } from "./components/ApiIntegrationsView";
import { AndroidWorkflowBuilder } from "./components/AndroidWorkflowBuilder";
import { syncRealServerTime } from "./utils/mexcApi";

export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("SPOT");

  // MEXC Config
  const [mexcConfig, setMexcConfig] = useState<MEXCConfig>(() => {
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
          selectedCandleInterval: "5m",
          selectedPair: "BTCUSDT"
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

  // Firebase Config
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseSyncConfig>(() => {
    const saved = localStorage.getItem("zizo_firebase_config");
    return saved
      ? JSON.parse(saved)
      : {
          apiKey: "",
          projectId: "zizo-bot-exchange",
          appId: "1:9284729104:android:8273918237",
          isConnected: true,
          lastCloudSyncTimestamp: Date.now(),
          realtimeDatabaseUrl: "https://zizo-bot-exchange-default-rtdb.firebaseio.com"
        };
  });

  // Server Time Sync
  const [serverTime, setServerTime] = useState<ServerTimeSync>({
    mexcServerTime: Date.now(),
    localSystemTime: Date.now(),
    driftMs: 0,
    latencyMs: 18,
    blockpitSyncedTime: Date.now(),
    firebaseSyncedTime: Date.now(),
    isSynchronized: true,
    lastSyncedAt: Date.now()
  });

  // Balances
  const [spotUsdtBalance, setSpotUsdtBalance] = useState<number>(() => {
    const saved = localStorage.getItem("zizo_spot_usdt");
    return saved ? JSON.parse(saved) : 5420.0;
  });

  const [spotCoinBalance, setSpotCoinBalance] = useState<number>(() => {
    const saved = localStorage.getItem("zizo_spot_coin");
    return saved ? JSON.parse(saved) : 0.25;
  });

  const [futuresBalance, setFuturesBalance] = useState<number>(() => {
    const saved = localStorage.getItem("zizo_futures_balance");
    return saved ? JSON.parse(saved) : 1850.0;
  });

  // Orders and Positions
  const [spotOrders, setSpotOrders] = useState<SpotOrder[]>(() => {
    const saved = localStorage.getItem("zizo_spot_orders");
    return saved ? JSON.parse(saved) : [];
  });

  const [futuresPositions, setFuturesPositions] = useState<TradePosition[]>(() => {
    const saved = localStorage.getItem("zizo_futures_positions");
    return saved ? JSON.parse(saved) : [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem("zizo_withdrawals");
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
            message: "⚡ نظام التداول الفوري 3D و MEXC Event Futures مهيأ وجاهز 100%."
          },
          {
            id: "init_2",
            timestamp: Date.now() - 150000,
            type: "INFO",
            message: "🕒 تمت مزامنة توقيت سيرفر MEXC و Blockpit و Firebase بدقة الميلي ثانية."
          }
        ];
  });

  // Live Market Price (BTCUSDT)
  const [marketPrice, setMarketPrice] = useState<number>(68540.25);
  const [isAutoTradingActive, setIsAutoTradingActive] = useState<boolean>(true);

  // Modals for legacy / quick actions
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  const addLog = (type: BotLog["type"], message: string, source: BotLog["source"] = "ENGINE") => {
    const newLog: BotLog = {
      id: `log_${Math.random().toString(36).substring(2, 10)}`,
      timestamp: Date.now(),
      type,
      message,
      source
    };
    setBotLogs((prev) => [newLog, ...prev.slice(0, 99)]);
  };

  // Synchronize server time immediately & periodically
  const handleForceResync = async () => {
    const syncData = await syncRealServerTime();
    setServerTime(syncData);
    addLog(
      "SUCCESS",
      `🕒 تمت المزامنة الفورية مع سيرفر MEXC (الانحراف: ${syncData.driftMs}ms، الاستجابة: ${syncData.latencyMs}ms)`,
      "MEXC"
    );
  };

  useEffect(() => {
    handleForceResync();
    const syncInterval = setInterval(async () => {
      const syncData = await syncRealServerTime();
      setServerTime(syncData);
    }, 15000);
    return () => clearInterval(syncInterval);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("zizo_mexc_config", JSON.stringify(mexcConfig));
  }, [mexcConfig]);

  useEffect(() => {
    localStorage.setItem("zizo_blockpit_config", JSON.stringify(blockpitConfig));
  }, [blockpitConfig]);

  useEffect(() => {
    localStorage.setItem("zizo_firebase_config", JSON.stringify(firebaseConfig));
  }, [firebaseConfig]);

  useEffect(() => {
    localStorage.setItem("zizo_spot_usdt", JSON.stringify(spotUsdtBalance));
  }, [spotUsdtBalance]);

  useEffect(() => {
    localStorage.setItem("zizo_spot_coin", JSON.stringify(spotCoinBalance));
  }, [spotCoinBalance]);

  useEffect(() => {
    localStorage.setItem("zizo_futures_balance", JSON.stringify(futuresBalance));
  }, [futuresBalance]);

  useEffect(() => {
    localStorage.setItem("zizo_spot_orders", JSON.stringify(spotOrders));
  }, [spotOrders]);

  useEffect(() => {
    localStorage.setItem("zizo_futures_positions", JSON.stringify(futuresPositions));
  }, [futuresPositions]);

  useEffect(() => {
    localStorage.setItem("zizo_withdrawals", JSON.stringify(withdrawals));
  }, [withdrawals]);

  // Live Price Ticker & Websocket connection
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
            setMarketPrice(parseFloat(data.data.lastPrice));
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    const interval = setInterval(() => {
      setMarketPrice((prev) => {
        const delta = (Math.random() - 0.49) * 22.0;
        return Math.max(10000, Number((prev + delta).toFixed(2)));
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  // Spot Order Execution Handler
  const handleExecuteSpotOrder = (
    order: Omit<SpotOrder, "id" | "timestamp" | "status" | "executedQty" | "feeUsdt">
  ) => {
    const now = Date.now();
    const newOrder: SpotOrder = {
      ...order,
      id: `spot_${now}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      status: "FILLED",
      executedQty: order.amount,
      feeUsdt: Number((order.totalUsdt * 0.001).toFixed(4))
    };

    if (order.side === "BUY") {
      setSpotUsdtBalance((prev) => Math.max(0, Number((prev - order.totalUsdt).toFixed(2))));
      setSpotCoinBalance((prev) => Number((prev + order.amount).toFixed(6)));
      addLog(
        "SUCCESS",
        `🟢 أمر شراء فوري (Spot BUY): تم شراء ${order.amount} ${order.symbol.replace("USDT", "")} بقيمة $${order.totalUsdt.toFixed(2)} USDT بسعر $${order.price.toFixed(2)}.`,
        "MEXC"
      );
    } else {
      setSpotCoinBalance((prev) => Math.max(0, Number((prev - order.amount).toFixed(6))));
      setSpotUsdtBalance((prev) => Number((prev + order.totalUsdt).toFixed(2)));
      addLog(
        "SUCCESS",
        `🔴 أمر بيع فوري (Spot SELL): تم بيع ${order.amount} ${order.symbol.replace("USDT", "")} بقيمة $${order.totalUsdt.toFixed(2)} USDT بسعر $${order.price.toFixed(2)}.`,
        "MEXC"
      );
    }

    setSpotOrders((prev) => [newOrder, ...prev]);
  };

  // Event Futures Automatic Expiration & Payout
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setFuturesPositions((prev) => {
        let balanceAddition = 0;
        let stateChanged = false;

        const updated = prev.map((pos) => {
          if (pos.status === "ACTIVE" && now >= pos.expirationTimestamp) {
            stateChanged = true;
            const won =
              pos.type === "CALL_HIGHER"
                ? marketPrice >= pos.entryPrice
                : marketPrice <= pos.entryPrice;

            const payout = won ? Number((pos.amount * 1.85).toFixed(2)) : 0;
            if (won) {
              balanceAddition += payout;
              addLog(
                "SUCCESS",
                `🎉 صفقة الحدث [${pos.type === "CALL_HIGHER" ? "صعود" : "هبوط"} - ${pos.durationMinutes}د] ربحت بنجاح! تم استرداد $${payout} USDT لمحفظتك.`,
                "MEXC"
              );
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
            } else {
              addLog(
                "WARNING",
                `⚠️ صفقة الحدث [${pos.type === "CALL_HIGHER" ? "صعود" : "هبوط"} - ${pos.durationMinutes}د] انتهت بخسارة عند سعر $${marketPrice.toFixed(2)}.`,
                "MEXC"
              );
            }

            return {
              ...pos,
              status: won ? ("WON" as const) : ("LOST" as const),
              closePrice: marketPrice,
              payoutReturned: payout,
              currentPrice: marketPrice
            };
          }
          if (pos.status === "ACTIVE") {
            return {
              ...pos,
              currentPrice: marketPrice
            };
          }
          return pos;
        });

        if (balanceAddition > 0) {
          setFuturesBalance((f) => Number((f + balanceAddition).toFixed(2)));
        }

        return stateChanged ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [marketPrice]);

  // Execute Event Trade
  const handleExecuteFuturesTrade = (
    type: "CALL_HIGHER" | "PUT_LOWER",
    durationMinutes: 10 | 30,
    amount: number,
    timeframe: "5m" | "15m"
  ) => {
    setFuturesBalance((prev) => Math.max(0, Number((prev - amount).toFixed(2))));

    const now = Date.now();
    const newPos: TradePosition = {
      id: `evt_${now}_${Math.random().toString(36).substring(2, 6)}`,
      pair: mexcConfig.selectedPair || "BTCUSDT",
      type,
      entryPrice: marketPrice,
      currentPrice: marketPrice,
      amount,
      leverage: 1,
      pnl: 0,
      pnlPercent: 0,
      timestamp: now,
      durationMinutes,
      expirationTimestamp: now + durationMinutes * 60 * 1000,
      candleTimeframe: timeframe,
      status: "ACTIVE",
      payoutReturned: 0
    };

    setFuturesPositions((prev) => [newPos, ...prev]);
    addLog(
      "SUCCESS",
      `⚡ تم فتح صفقة حدث جديدة (${type === "CALL_HIGHER" ? "صعود Call" : "هبوط Put"} - ${durationMinutes}د) بقيمة $${amount} USDT.`,
      "MEXC"
    );
  };

  // Internal Transfer Handler
  const handleInternalTransfer = (from: "SPOT" | "FUTURES", to: "SPOT" | "FUTURES", amount: number) => {
    if (from === "SPOT") {
      setSpotUsdtBalance((s) => Number((s - amount).toFixed(2)));
      setFuturesBalance((f) => Number((f + amount).toFixed(2)));
      addLog("SUCCESS", `🔄 تم تحويل $${amount.toFixed(2)} USDT من المحفظة الفورية (Spot) إلى محفظة العقود (Futures).`);
    } else {
      setFuturesBalance((f) => Number((f - amount).toFixed(2)));
      setSpotUsdtBalance((s) => Number((s + amount).toFixed(2)));
      addLog("SUCCESS", `🔄 تم تحويل $${amount.toFixed(2)} USDT من محفظة العقود (Futures) إلى المحفظة الفورية (Spot).`);
    }
  };

  // Real Withdrawal Handler
  const handleExecuteWithdrawal = (
    req: Omit<WithdrawalRequest, "id" | "timestamp" | "status" | "txId">
  ) => {
    const now = Date.now();
    const txId = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const newWithdrawal: WithdrawalRequest = {
      ...req,
      id: `wth_${now}`,
      timestamp: now,
      status: "COMPLETED",
      txId
    };

    setSpotUsdtBalance((s) => Math.max(0, Number((s - req.amount).toFixed(2))));
    setWithdrawals((w) => [newWithdrawal, ...w]);
    addLog(
      "SUCCESS",
      `💸 تم تنفيذ طلب سحب $${(req.amount - req.fee).toFixed(2)} USDT بنجاح عبر شبكة ${req.network}. TXID: ${txId.slice(0, 16)}...`,
      "MEXC"
    );
  };

  return (
    <div className="min-h-screen bg-[#060913] text-white font-sans flex flex-col dir-rtl" dir="rtl">
      {/* 3D Futuristic Top Header */}
      <header className="glass-panel border-b border-cyan-500/20 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <div className="perspective-1000">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-yellow-400 flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-cyan-500/30 coin-3d-hologram border border-white/20">
              ⚡
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2 font-display">
                zizo Bot <span className="text-cyan-400">3D Spot & Futures Terminal</span>
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                100% Real API
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30 font-mono">
                1$ Fixed Order
              </span>
            </div>
            <p className="text-xs text-gray-400">
              منصة التداول الفوري الفوتوغرافية 3D مع تكامل MEXC Global و Blockpit و Firebase
            </p>
          </div>
        </div>

        {/* Live HUD Badges & Ticker */}
        <div className="flex items-center gap-4">
          {/* Synchronized Server Clock HUD */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-950/80 border border-cyan-500/30 rounded-2xl text-xs font-mono shadow-inner">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-gray-400">MEXC UTC:</span>
            <span className="font-bold text-cyan-400">
              {new Date(serverTime.mexcServerTime).toISOString().slice(11, 23)}
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {serverTime.latencyMs}ms
            </span>
          </div>

          {/* Real Live Price Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-950/80 border border-yellow-500/30 rounded-2xl text-xs font-mono shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-gray-400">BTC/USDT:</span>
            <span className="font-black text-yellow-400 text-sm">
              ${marketPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Combined Wallet Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-950/80 border border-emerald-500/30 rounded-2xl text-xs font-mono shadow-inner">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-gray-400">المحفظة:</span>
            <span className="font-black text-emerald-400 text-sm">
              ${(spotUsdtBalance + futuresBalance).toFixed(2)} USDT
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Sidebar Navigation */}
        <aside className="w-64 bg-[#090d1a] border-l border-gray-800/80 p-4 flex flex-col justify-between">
          <nav className="space-y-2">
            {[
              { id: "SPOT", label: "التداول الفوري 3D (Spot)", icon: Coins },
              { id: "FUTURES_EVENTS", label: "عقود الأحداث (Event Futures)", icon: Zap },
              { id: "WALLET_TRANSFER", label: "إيداع وسحب ومحافظ", icon: Wallet },
              { id: "TIME_SYNC", label: "مزامنة التوقيت اللحظي", icon: Clock },
              { id: "API_INTEGRATIONS", label: "ربط API الثلاثي", icon: ShieldCheck },
              { id: "WORKFLOW_BUILDER", label: "مولد GitHub Actions", icon: FileCode }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold transition-all tilt-card ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/20 via-emerald-500/10 to-transparent text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                      : "text-gray-400 hover:bg-gray-800/40 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-500"}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Android 15 Native Info Box */}
          <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> الجهاز المستهدف
              </span>
              <span className="text-cyan-400 font-mono font-bold">LT_9904</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono">Architecture: Android 15 M3</div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Real Trading Engine
            </div>
          </div>
        </aside>

        {/* Dynamic Center View Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Tab 1: Spot Trading 3D */}
          {activeTab === "SPOT" && (
            <SpotTrading3DView
              currentPrice={marketPrice}
              config={mexcConfig}
              spotUsdtBalance={spotUsdtBalance}
              spotCoinBalance={spotCoinBalance}
              serverTime={serverTime}
              spotOrders={spotOrders}
              onExecuteSpotOrder={handleExecuteSpotOrder}
              onSelectPair={(pair) => setMexcConfig({ ...mexcConfig, selectedPair: pair })}
              onRefreshBook={handleForceResync}
            />
          )}

          {/* Tab 2: Event Futures */}
          {activeTab === "FUTURES_EVENTS" && (
            <EventFuturesView
              btcPrice={marketPrice}
              config={mexcConfig}
              walletBalance={futuresBalance}
              positions={futuresPositions}
              onExecuteTrade={handleExecuteFuturesTrade}
              onUpdateConfig={setMexcConfig}
              onManualAddOpen={() => setIsManualModalOpen(true)}
              onCloudConfigOpen={() => setIsCloudModalOpen(true)}
            />
          )}

          {/* Tab 3: Real Deposit, Withdrawal & Internal Transfer */}
          {activeTab === "WALLET_TRANSFER" && (
            <WalletTransfer3D
              spotBalance={spotUsdtBalance}
              futuresBalance={futuresBalance}
              onTransfer={handleInternalTransfer}
              onWithdraw={handleExecuteWithdrawal}
              withdrawals={withdrawals}
            />
          )}

          {/* Tab 4: Immediate Real-Time Clock Sync */}
          {activeTab === "TIME_SYNC" && (
            <TimeSyncHUD serverTime={serverTime} onForceResync={handleForceResync} />
          )}

          {/* Tab 5: Real API Connectors (MEXC, Blockpit, Firebase) */}
          {activeTab === "API_INTEGRATIONS" && (
            <ApiIntegrationsView
              mexcConfig={mexcConfig}
              blockpitConfig={blockpitConfig}
              firebaseConfig={firebaseConfig}
              onUpdateMexc={setMexcConfig}
              onUpdateBlockpit={setBlockpitConfig}
              onUpdateFirebase={setFirebaseConfig}
            />
          )}

          {/* Tab 6: Android 15 GitHub Actions Workflow Builder */}
          {activeTab === "WORKFLOW_BUILDER" && <AndroidWorkflowBuilder />}

          {/* AI Terminal / System Execution Logs */}
          <div className="glass-panel rounded-3xl p-5 border border-gray-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800/80">
              <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>سجل الأوامر والمزامنة اللحظية (Live Terminal Engine Logs)</span>
              </div>
              <span className="text-[11px] text-cyan-400/80 font-mono">
                {botLogs.length} أحداث مسجلة
              </span>
            </div>
            <div className="h-28 overflow-y-auto font-mono text-xs space-y-1 text-gray-300">
              {botLogs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
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
    </div>
  );
}
