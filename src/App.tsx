import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TradingTerminal } from './components/TradingTerminal';
import { CloudBotManager } from './components/CloudBotManager';
import { AiAssistant } from './components/AiAssistant';
import { AccountManager } from './components/AccountManager';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { MobileDownloadModal } from './components/MobileDownloadModal';
import { getApiUrl } from './utils/api';

import {
  MarketTicker,
  KlineCandle,
  OrderBookData,
  AccountAsset,
  FuturesPosition,
  BotStrategyConfig,
  BotLog,
  MexcApiCredentials,
  Language,
  TradingMode,
  PositionSide
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'bot' | 'ai' | 'account' | 'settings'>('terminal');
  const [lang, setLang] = useState<Language>('ar');
  const [mode, setMode] = useState<TradingMode>('live');

  // MEXC Credentials State (Stored in localStorage for persistence)
  const [credentials, setCredentials] = useState<MexcApiCredentials>(() => {
    const savedApi = localStorage.getItem('mexc_api_key') || '';
    const savedSec = localStorage.getItem('mexc_secret_key') || '';
    return {
      apiKey: savedApi,
      secretKey: savedSec,
      isConfigured: !!(savedApi && savedSec),
      isValidated: false,
    };
  });

  // Selected trading pair
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC_USDT');

  // Live Data States
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [klines, setKlines] = useState<KlineCandle[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [] });
  const [account, setAccount] = useState<AccountAsset>({
    currency: 'USDT',
    equity: 10000,
    availableBalance: 9500,
    positionMargin: 500,
    frozenBalance: 0,
    unrealizedPnL: 0,
    unrealizedPnLPercent: 0,
  });
  const [positions, setPositions] = useState<FuturesPosition[]>([]);
  const [bots, setBots] = useState<BotStrategyConfig[]>([]);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);

  // Mobile APK Modal state
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // 1. Poll Tickers & Market Data (Every 3 seconds)
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch(getApiUrl('/api/mexc/tickers'));
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.data)) {
            setTickers(data.data);
          }
        }
      } catch (err) {
        console.error('Fetch tickers error:', err);
      }
    };

    fetchTickers();
    const interval = setInterval(fetchTickers, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Poll Klines Candlesticks for selected symbol (Every 5 seconds)
  useEffect(() => {
    const fetchKlines = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/mexc/klines?symbol=${selectedSymbol}&interval=Min15`));
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.candles)) {
            setKlines(data.candles);
          }
        }
      } catch (err) {
        console.error('Fetch klines error:', err);
      }
    };

    fetchKlines();
    const interval = setInterval(fetchKlines, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // 3. Poll Orderbook Depth for selected symbol (Every 3 seconds)
  useEffect(() => {
    const fetchDepth = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/mexc/depth?symbol=${selectedSymbol}`));
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.success) {
            setOrderBook({
              bids: data.bids || [],
              asks: data.asks || [],
            });
          }
        }
      } catch (err) {
        console.error('Fetch depth error:', err);
      }
    };

    fetchDepth();
    const interval = setInterval(fetchDepth, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // 4. Poll Account Assets & Positions (Every 4 seconds)
  const fetchAccountAndPositions = async () => {
    try {
      // Account
      const accRes = await fetch(getApiUrl('/api/mexc/account'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          secretKey: credentials.secretKey,
          mode,
        }),
      });
      const accContentType = accRes.headers.get('content-type') || '';
      if (accRes.ok && accContentType.includes('application/json')) {
        const accData = await accRes.json();
        if (accData && accData.success && accData.account) {
          setAccount(accData.account);
        }
      }

      // Positions
      const posRes = await fetch(getApiUrl('/api/mexc/positions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: credentials.apiKey,
          secretKey: credentials.secretKey,
          mode,
        }),
      });
      const posContentType = posRes.headers.get('content-type') || '';
      if (posRes.ok && posContentType.includes('application/json')) {
        const posData = await posRes.json();
        if (posData && posData.success && Array.isArray(posData.positions)) {
          setPositions(posData.positions);
        }
      }
    } catch (err) {
      console.error('Fetch account & positions error:', err);
    }
  };

  useEffect(() => {
    fetchAccountAndPositions();
    const interval = setInterval(fetchAccountAndPositions, 4000);
    return () => clearInterval(interval);
  }, [credentials, mode]);

  // 5. Poll 24/7 Cloud Bot List & Logs (Every 5 seconds)
  const fetchBotsAndLogs = async () => {
    try {
      const res = await fetch(getApiUrl('/api/bot/list'));
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
          setBots(data.bots || []);
          setBotLogs(data.logs || []);
        }
      }
    } catch (err) {
      console.error('Fetch bots error:', err);
    }
  };

  useEffect(() => {
    fetchBotsAndLogs();
    const interval = setInterval(fetchBotsAndLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handler: Save Credentials
  const handleSaveCredentials = async (apiKey: string, secretKey: string): Promise<boolean> => {
    localStorage.setItem('mexc_api_key', apiKey);
    localStorage.setItem('mexc_secret_key', secretKey);

    const updated = {
      apiKey,
      secretKey,
      isConfigured: !!(apiKey && secretKey),
      isValidated: false,
    };

    setCredentials(updated);

    try {
      const testRes = await fetch(getApiUrl('/api/mexc/test-credentials'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, secretKey }),
      });
      const contentType = testRes.headers.get('content-type') || '';
      if (testRes.ok && contentType.includes('application/json')) {
        const testData = await testRes.json();
        if (testData && testData.success) {
          setCredentials({ ...updated, isValidated: true });
          fetchAccountAndPositions();
          return true;
        }
      }
    } catch (e) {
      console.error('Test credentials error:', e);
    }
    return false;
  };

  // Handler: Place Order
  const handlePlaceOrder = async (order: {
    symbol: string;
    side: PositionSide;
    type: 'MARKET' | 'LIMIT';
    price: number;
    size: number;
    leverage: number;
    tpPrice?: number;
    slPrice?: number;
  }) => {
    const res = await fetch(getApiUrl('/api/mexc/order/place'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...order,
        apiKey: credentials.apiKey,
        secretKey: credentials.secretKey,
        mode,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && !data.success) {
        throw new Error(data.message || 'Order execution failed');
      }
    }
    fetchAccountAndPositions();
  };

  // Handler: Close Position
  const handleClosePosition = async (positionId: string, symbol: string) => {
    const posObj = positions.find(p => p.id === positionId);
    await fetch(getApiUrl('/api/mexc/position/close'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        positionId,
        symbol,
        side: posObj?.side,
        size: posObj?.size,
        leverage: posObj?.leverage,
        apiKey: credentials.apiKey,
        secretKey: credentials.secretKey,
        mode,
      }),
    });
    fetchAccountAndPositions();
  };

  // Handler: Close All Positions
  const handleCloseAllPositions = async () => {
    for (const pos of positions) {
      await handleClosePosition(pos.id, pos.symbol);
    }
    fetchAccountAndPositions();
  };

  // Handler: Toggle Bot State
  const handleToggleBot = async (botId: string, enabled: boolean) => {
    await fetch(getApiUrl('/api/bot/toggle'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botId, enabled }),
    });
    fetchBotsAndLogs();
  };

  // Handler: Update Bot Config
  const handleUpdateBotConfig = async (updatedBot: BotStrategyConfig) => {
    await fetch(getApiUrl('/api/bot/update-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot: updatedBot }),
    });
    fetchBotsAndLogs();
  };

  // Handler: Apply AI Setup to Terminal
  const handleApplyAiSetup = (setup: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    takeProfitPrice: number;
    stopLossPrice: number;
    leverage: number;
  }) => {
    setSelectedSymbol(setup.symbol);
    setActiveTab('terminal');
  };

  const runningBotsCount = bots.filter(b => b.enabled).length;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      
      {/* Top Header & Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        mode={mode}
        setMode={setMode}
        isApiConfigured={credentials.isConfigured}
        totalEquity={account.equity}
        unrealizedPnL={account.unrealizedPnL}
        runningBotsCount={runningBotsCount}
        onOpenMobileModal={() => setIsMobileModalOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'terminal' && (
          <TradingTerminal
            tickers={tickers}
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            klines={klines}
            orderBook={orderBook}
            positions={positions}
            lang={lang}
            onPlaceOrder={handlePlaceOrder}
            onClosePosition={handleClosePosition}
            userBalance={account.availableBalance}
          />
        )}

        {activeTab === 'bot' && (
          <CloudBotManager
            bots={bots}
            logs={botLogs}
            lang={lang}
            onToggleBot={handleToggleBot}
            onUpdateBotConfig={handleUpdateBotConfig}
          />
        )}

        {activeTab === 'ai' && (
          <AiAssistant
            selectedSymbol={selectedSymbol}
            setSelectedSymbol={setSelectedSymbol}
            symbols={['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT', 'DOGE_USDT', 'BNB_USDT', 'PEPE_USDT', 'SUI_USDT']}
            lang={lang}
            onApplyAiSetup={handleApplyAiSetup}
          />
        )}

        {activeTab === 'account' && (
          <AccountManager
            account={account}
            positions={positions}
            lang={lang}
            onClosePosition={handleClosePosition}
            onCloseAllPositions={handleCloseAllPositions}
          />
        )}

        {activeTab === 'settings' && (
          <ApiSettingsModal
            credentials={credentials}
            onSaveCredentials={handleSaveCredentials}
            lang={lang}
          />
        )}

      </main>

      {/* APK & Mobile Cloud Download Modal */}
      <MobileDownloadModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        lang={lang}
      />

    </div>
  );
}
