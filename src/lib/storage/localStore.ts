import { PaperPosition, RiskSettings, TradeJournalEntry } from '../../types/trade';
import { TradingViewAlert, BrokerConfig } from '../../types/dataSources';
import { TradingStrategy } from '../../types/signals';
import { DEFAULT_RISK_SETTINGS } from '../engine/riskEngine';
import { DEFAULT_STRATEGIES } from '../engine/strategies';

const KEYS = {
  POSITIONS: 'india_trader_positions',
  JOURNAL: 'india_trader_journal',
  SETTINGS: 'india_trader_risk_settings',
  ALERTS: 'india_trader_tv_alerts',
  BROKERS: 'india_trader_brokers',
  STRATEGIES: 'india_trader_strategies',
};

export const DEFAULT_BROKERS: BrokerConfig[] = [
  {
    id: 'ANGEL_ONE',
    name: 'Angel One SmartAPI',
    enabled: false,
    status: 'DISCONNECTED',
    isConfiguredOnServer: false,
    isSandboxed: true,
    liveOrderExecutionAllowed: false,
  },
  {
    id: 'SAHI',
    name: 'Sahi Broker API',
    enabled: false,
    status: 'DISCONNECTED',
    isConfiguredOnServer: false,
    isSandboxed: true,
    liveOrderExecutionAllowed: false,
  },
];

export function getStoredPositions(): PaperPosition[] {
  try {
    const raw = localStorage.getItem(KEYS.POSITIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPositions(positions: PaperPosition[]): void {
  try {
    localStorage.setItem(KEYS.POSITIONS, JSON.stringify(positions));
  } catch (err) {
    console.error('Failed to save positions:', err);
  }
}

export function getStoredJournal(): TradeJournalEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.JOURNAL);
    return raw ? JSON.parse(raw) : getInitialMockJournal();
  } catch {
    return getInitialMockJournal();
  }
}

export function saveStoredJournal(entries: TradeJournalEntry[]): void {
  try {
    localStorage.setItem(KEYS.JOURNAL, JSON.stringify(entries));
  } catch (err) {
    console.error('Failed to save journal:', err);
  }
}

export function getStoredRiskSettings(): RiskSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_RISK_SETTINGS, ...JSON.parse(raw) } : DEFAULT_RISK_SETTINGS;
  } catch {
    return DEFAULT_RISK_SETTINGS;
  }
}

export function saveStoredRiskSettings(settings: RiskSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save risk settings:', err);
  }
}

export function getStoredAlerts(): TradingViewAlert[] {
  try {
    const raw = localStorage.getItem(KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredAlerts(alerts: TradingViewAlert[]): void {
  try {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
  } catch (err) {
    console.error('Failed to save alerts:', err);
  }
}

export function getStoredBrokers(): BrokerConfig[] {
  try {
    const raw = localStorage.getItem(KEYS.BROKERS);
    return raw ? JSON.parse(raw) : DEFAULT_BROKERS;
  } catch {
    return DEFAULT_BROKERS;
  }
}

export function saveStoredBrokers(brokers: BrokerConfig[]): void {
  try {
    // Strip any sensitive credentials before localStorage write
    const sanitized = brokers.map((b) => ({
      id: b.id,
      name: b.name,
      enabled: b.enabled,
      status: b.status,
      isConfiguredOnServer: b.isConfiguredOnServer,
      isSandboxed: b.isSandboxed,
      liveOrderExecutionAllowed: b.liveOrderExecutionAllowed,
      lastPing: b.lastPing,
      lastError: b.lastError,
    }));
    localStorage.setItem(KEYS.BROKERS, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Failed to save brokers:', err);
  }
}

export function getStoredStrategies(): TradingStrategy[] {
  try {
    const raw = localStorage.getItem(KEYS.STRATEGIES);
    return raw ? JSON.parse(raw) : DEFAULT_STRATEGIES;
  } catch {
    return DEFAULT_STRATEGIES;
  }
}

export function saveStoredStrategies(strategies: TradingStrategy[]): void {
  try {
    localStorage.setItem(KEYS.STRATEGIES, JSON.stringify(strategies));
  } catch (err) {
    console.error('Failed to save strategies:', err);
  }
}

function getInitialMockJournal(): TradeJournalEntry[] {
  return [
    {
      id: 'tj_001',
      fingerprint: '3a8f9c4b12e756108ad921f0ce51280ba6f9',
      ticketId: 'TKT-2410-0935',
      date: '2026-10-30',
      time: '09:35:10',
      index: 'NIFTY',
      instrument: 'NIFTY 24200 CE',
      optionType: 'CE',
      strike: 24200,
      expiry: '2026-11-05',
      quantity: 100,
      lots: 2,
      entryPrice: 112.5,
      exitPrice: 138.0,
      stopLoss: 94.0,
      target: 140.0,
      pnl: 2550.0,
      netPnl: 2486.2,
      charges: 63.8,
      strategy: 'EMA 15/20 Crossover + VWAP Confirmation',
      marketRegime: 'Strong Bullish Trend',
      entryRationale: 'Clean EMA 15/20 bullish cross with price breaking above intraday VWAP; ATM PE Short Buildup confirmed floor',
      exitReason: 'Target 1 hit with momentum plateau on 5m chart',
      userApproved: true,
      approvalTimestamp: '2026-10-30T09:35:05.000Z',
      aiScore: 84,
      dataSource: 'SIMULATED DATA (DEMO MODE)',
    },
    {
      id: 'tj_002',
      fingerprint: '7b2c149d88fe01aa256cd8103328e71fa4d0',
      ticketId: 'TKT-7940-1120',
      date: '2026-10-30',
      time: '11:20:45',
      index: 'SENSEX',
      instrument: 'SENSEX 79500 PE',
      optionType: 'PE',
      strike: 79500,
      expiry: '2026-11-05',
      quantity: 40,
      lots: 2,
      entryPrice: 285.0,
      exitPrice: 255.0,
      stopLoss: 255.0,
      target: 335.0,
      pnl: -1200.0,
      netPnl: -1254.5,
      charges: 54.5,
      strategy: 'VAH / VAL Rejection',
      marketRegime: 'Sideways / Consolidation',
      entryRationale: 'Rejection test at Value Area High with negative MACD histogram divergence',
      exitReason: 'Stop loss triggered after sideways chop broke upward',
      userApproved: true,
      approvalTimestamp: '2026-10-30T11:20:30.000Z',
      aiScore: 32,
      dataSource: 'SIMULATED DATA (DEMO MODE)',
    },
  ];
}
