export type ImageResolution = '1K' | '2K' | '4K';

export type VoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface MeditationSession {
  id: string;
  title: string;
  category: 'Mindfulness' | 'Trading Zen' | 'Deep Sleep' | 'Focus & Clarity' | 'Stress Relief';
  description: string;
  durationMinutes: number;
  prompt: string;
  voice: VoiceName;
  imageResolution: ImageResolution;
  imageUrl?: string;
  audioBase64?: string;
  script?: string;
  createdAt?: string;
}

export type ChatModel = 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: ChatModel;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  yieldRate: number; // e.g. 80 for 80%
}

export interface EventPosition {
  id: string;
  symbol: string;
  type: 'UP' | 'DOWN'; // 'أعلى' | 'أدنى'
  amount: number;
  entryPrice: number;
  timeframe: '10m' | '30m' | '1h' | '1d';
  expiryTime: number;
  status: 'OPEN' | 'WON' | 'LOST';
  payout: number;
  createdAt: string;
}

export interface GitHubSecretCheck {
  name: string;
  description: string;
  configured: boolean;
}
