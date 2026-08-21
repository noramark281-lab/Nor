export interface MEXCConfig {
  apiKey: string;
  apiSecret: string;
  isLiveMode: boolean;
  autoTransferRewards: boolean;
  leverage: 1 | 2 | 5 | 10;
  eventDurationMinutes: 10 | 30;
  selectedCandleInterval: "5m" | "15m";
}

export interface BlockpitConfig {
  apiKey: string;
  apiSecret: string;
  isConnected: boolean;
  lastSyncTimestamp: number | null;
  autoExportTrades: boolean;
  taxYear: string;
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

export interface RewardTransferLog {
  id: string;
  amount: number;
  asset: string;
  fromAccount: string;
  toAccount: string;
  status: string;
  timestamp: number;
}

export interface BotLog {
  id: string;
  timestamp: number;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  message: string;
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
  recommendedSignal: "CALL_HIGHER" | "PUT_LOWER" | "WAIT";
  targetTimeframe: "10m" | "30m";
}

export type DashboardTab =
  | "DASHBOARD"
  | "EVENTS"
  | "WORKFLOW"
  | "WALLET"
  | "BLOCKPIT"
  | "SETTINGS";

export interface SpotAssetBalance {
  asset: string;
  free: string;
  locked: string;
}

export interface FuturesAssetData {
  currency: string;
  availableBalance: number;
  bonus: number;
  positionMargin: number;
}
