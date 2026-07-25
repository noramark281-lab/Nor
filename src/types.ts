export type Language = 'ar' | 'en';

export type TradingMode = 'live' | 'simulation';

export type OrderSide = 'BUY' | 'SELL'; // 1: Open Long, 2: Close Short, 3: Open Short, 4: Close Long
export type PositionSide = 'LONG' | 'SHORT';
export type OrderType = 'LIMIT' | 'MARKET';

export interface MarketTicker {
  symbol: string;
  lastPrice: number;
  riseFallRate: number; // e.g. 0.0345 (3.45%)
  high24Price: number;
  low24Price: number;
  volume24: number;
  amount24: number;
  fundingRate: number;
  fairPrice: number;
  indexPrice: number;
}

export interface KlineCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface AccountAsset {
  currency: string;
  equity: number;
  availableBalance: number;
  positionMargin: number;
  frozenBalance: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface FuturesPosition {
  id: string;
  symbol: string;
  side: PositionSide;
  size: number; // Volume / Contracts
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  margin: number;
  leverage: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  tpPrice?: number;
  slPrice?: number;
  createdAt: number;
}

export interface FuturesOrder {
  id: string;
  symbol: string;
  side: PositionSide;
  action: 'OPEN' | 'CLOSE';
  type: OrderType;
  price: number;
  size: number;
  filledSize: number;
  status: 'PENDING' | 'FILLED' | 'CANCELED' | 'REJECTED';
  leverage: number;
  createdAt: number;
}

export interface BotStrategyConfig {
  id: string;
  name: string;
  type: 'GRID' | 'DCA' | 'AI_TREND' | 'TRAILING_STOP';
  symbol: string;
  enabled: boolean;
  leverage: number;
  allocatedMargin: number;
  
  // Grid parameters
  lowerPrice?: number;
  upperPrice?: number;
  gridCount?: number;

  // DCA parameters
  dcaStepPercent?: number;
  dcaMultiplier?: number;
  maxDcaSteps?: number;

  // Risk parameters
  takeProfitPercent: number;
  stopLossPercent: number;
  maxPositions: number;
  
  // Stats
  totalTrades: number;
  winningTrades: number;
  profitUsdt: number;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR';
  lastRunTimestamp?: number;
}

export interface BotLog {
  id: string;
  timestamp: number;
  strategyName: string;
  symbol: string;
  level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR';
  message: string;
}

export interface AIAnalysisResult {
  symbol: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidenceScore: number; // 0-100
  summary: string;
  summaryAr: string;
  keyLevels: {
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
  };
  recommendedAction: 'STRONG_BUY_LONG' | 'BUY_LONG' | 'HOLD' | 'SELL_SHORT' | 'STRONG_SELL_SHORT';
  suggestedLeverage: number;
  suggestedEntryPrice: number;
  suggestedTakeProfit: number;
  suggestedStopLoss: number;
  technicalIndicators: {
    rsi: number;
    macdSignal: string;
    trend: string;
  };
}

export interface MexcApiCredentials {
  apiKey: string;
  secretKey: string;
  isConfigured: boolean;
  isValidated: boolean;
}
