export interface MEXCConfig {
  apiKey: string;
  apiSecret: string;
  isLiveMode: boolean;
  autoTransferRewards: boolean;
  leverage: 1 | 2 | 5 | 10;
  eventDurationMinutes: 10 | 30;
  selectedCandleInterval: "5m" | "15m";
  selectedPair: string;
}

export interface BlockpitConfig {
  apiKey: string;
  apiSecret: string;
  isConnected: boolean;
  lastSyncTimestamp: number | null;
  autoExportTrades: boolean;
  taxYear: string;
}

export interface FirebaseSyncConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  isConnected: boolean;
  lastCloudSyncTimestamp: number | null;
  realtimeDatabaseUrl: string;
}

export interface ServerTimeSync {
  mexcServerTime: number;
  localSystemTime: number;
  driftMs: number;
  latencyMs: number;
  blockpitSyncedTime: number;
  firebaseSyncedTime: number;
  isSynchronized: boolean;
  lastSyncedAt: number;
}

export interface SpotOrder {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  price: number;
  amount: number; // in Coin (e.g. BTC)
  totalUsdt: number; // in USDT (e.g. 1.00 USDT)
  status: "FILLED" | "PENDING" | "CANCELLED";
  timestamp: number;
  executedQty: number;
  feeUsdt: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

export interface MarketTrade {
  id: string;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean; // true = sell, false = buy
}

export interface TradePosition {
  id: string;
  pair: string;
  type: "CALL_HIGHER" | "PUT_LOWER";
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
  durationMinutes: 10 | 30;
  expirationTimestamp: number;
  candleTimeframe: "5m" | "15m";
  status: "ACTIVE" | "WON" | "LOST";
  payoutReturned: number;
  closePrice?: number;
}

export interface DepositAddress {
  coin: string;
  network: "TRC20" | "ERC20" | "BEP20" | "BITCOIN";
  address: string;
  memo?: string;
  minDeposit: number;
  confirmationBlocks: number;
}

export interface WithdrawalRequest {
  id: string;
  coin: string;
  network: string;
  targetAddress: string;
  amount: number;
  fee: number;
  timestamp: number;
  status: "COMPLETED" | "PROCESSING" | "PENDING";
  txId: string;
}

export interface BotLog {
  id: string;
  timestamp: number;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  message: string;
  source?: "MEXC" | "BLOCKPIT" | "FIREBASE" | "ENGINE";
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface MarketInsight {
  asset: string;
  candle5mTrend: "BULLISH" | "BEARISH" | "NEUTRAL";
  candle15mTrend: "BULLISH" | "BEARISH" | "NEUTRAL";
  rsi: number;
  confidenceScore: number;
  recommendedSignal: "CALL_HIGHER" | "PUT_LOWER";
  targetTimeframe: 10 | 30;
}

export type DashboardTab =
  | "SPOT"
  | "FUTURES_EVENTS"
  | "WALLET_TRANSFER"
  | "TIME_SYNC"
  | "API_INTEGRATIONS"
  | "WORKFLOW_BUILDER";
