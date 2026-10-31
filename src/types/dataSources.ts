import { Candle, MarketIndex, OptionChainData } from './market';

export type MarketDataState = 'LIVE' | 'DELAYED' | 'HISTORICAL' | 'SIMULATED' | 'DISCONNECTED';

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
  marketDataState: MarketDataState;
  sourceLabel: string;
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
  status: 'DISCONNECTED' | 'CONNECTED' | 'ERROR';
  isConfiguredOnServer?: boolean;
  apiKey?: string; // Temporary form state only, never stored in localStorage
  clientCode?: string; // Temporary form state only, never stored in localStorage
  lastPing?: string;
  lastError?: string;
  isSandboxed: boolean;
  liveOrderExecutionAllowed: boolean; // Always strictly guarded by UI manual approval!
}

export interface MarketDataProvider {
  id: string;
  name: string;
  state: MarketDataState;
  latencyMs?: number;
  lastUpdated: string;
  getSpotQuote(index: MarketIndex): Promise<{ spotPrice: number; change: number; changePct: number; timestamp: string }>;
  getCandles(index: MarketIndex, timeframe: string, count?: number): Promise<Candle[]>;
  getOptionChain(index: MarketIndex, expiry?: string): Promise<OptionChainData>;
  isHealthy(): boolean;
}
