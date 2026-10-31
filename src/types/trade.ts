import { MarketIndex, OptionType } from './market';
import { AISignal } from './signals';

export interface PaperOrderTicket {
  ticketId: string;
  timestamp: string;
  index: MarketIndex;
  optionType: OptionType;
  strike: number;
  expiry: string;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice: number;
  quantity: number;
  lotSize: number;
  lots: number;
  stopLoss: number;
  target1: number;
  target2: number;
  estimatedRisk: number;
  allowedRisk: number;
  estimatedCharges: number; // STT, exchange turnover, GST, SEBI
  signalScore: number;
  strategy: string;
  notes?: string;
}

export interface RiskValidationResult {
  status: 'PASS' | 'BLOCK' | 'WARNING';
  estimatedRisk: number;
  allowedRisk: number;
  reasons: string[];
  maxLotsAllowed: number;
  capitalAtRiskPercent: number;
}

export interface PaperPosition {
  positionId: string;
  ticketFingerprint: string;
  index: MarketIndex;
  optionType: OptionType;
  strike: number;
  expiry: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  lots: number;
  lotSize: number;
  entryTime: string;
  stopLoss: number;
  target1: number;
  target2: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  status: 'OPEN' | 'CLOSED';
  exitPrice?: number;
  exitTime?: string;
  exitReason?: string;
  realizedPnL?: number;
  strategy: string;
}

export interface TradeJournalEntry {
  id: string;
  fingerprint: string;
  ticketId: string;
  date: string;
  time: string;
  index: MarketIndex;
  instrument: string; // e.g. "NIFTY 24200 CE"
  optionType: OptionType;
  strike: number;
  expiry: string;
  quantity: number;
  lots: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  target: number;
  pnl: number;
  netPnl: number;
  charges: number;
  strategy: string;
  marketRegime: string;
  entryRationale: string;
  exitReason: string;
  userApproved: boolean;
  approvalTimestamp: string;
  aiScore: number;
  dataSource: string;
}

export interface RiskSettings {
  accountCapital: number;
  maxRiskPerTradePercent: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  maxLotsPerTrade: {
    NIFTY: number;
    SENSEX: number;
  };
  lotSizes: {
    NIFTY: number;
    SENSEX: number;
  };
  maxConsecutiveLosses: number;
  expiryDayRiskTightening: boolean;
  killSwitchActive: boolean;
  minRiskRewardRatio: number;
}
