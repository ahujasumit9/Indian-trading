import { MarketIndex } from './market';

export interface TradingViewAlert {
  id: string;
  receivedAt: string;
  ticker: string; // e.g. "NSE:NIFTY50", "BSE:SENSEX"
  timeframe: string; // "1m", "5m", "15m", "1h"
  price: number;
  ema15?: number;
  ema20?: number;
  rsi?: number;
  vwap?: number;
  volume?: number;
  action?: 'BUY' | 'SELL' | 'ALERT' | 'BREAKOUT';
  message: string;
  rawPayload: string;
}

export interface DataSourceStatus {
  activeSource: 'SIMULATOR' | 'CSV_FILE' | 'TRADINGVIEW_WEBHOOK' | 'EXTERNAL_API';
  isLiveUpdating: boolean;
  updateFrequencySec: number;
  lastUpdateTimestamp: string;
  csvFileName?: string;
  totalCandlesLoaded: number;
  totalStrikesLoaded: number;
  webhookCount: number;
  statusMessage: string;
}

export interface BrokerConfig {
  id: 'ANGEL_ONE' | 'SAHI';
  name: string;
  enabled: boolean;
  apiKey: string;
  clientCode: string;
  totpSecret?: string;
  password?: string;
  pin?: string;
  status: 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
  lastPing?: string;
  isSandboxed: boolean;
  liveOrderExecutionAllowed: boolean; // Always strictly guarded by UI manual approval!
}
