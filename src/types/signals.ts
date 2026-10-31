import { MarketIndex, OptionType } from './market';

export type SignalType = 'BUY CE' | 'BUY PE' | 'WAIT' | 'EXIT' | 'NO TRADE';

export type MarketRegimeType =
  | 'Strong Bullish Trend'
  | 'Strong Bearish Trend'
  | 'Sideways / Consolidation'
  | 'High Volatility Expansion'
  | 'Low Volatility Squeeze'
  | 'Breakout Environment'
  | 'Mean Reversal Environment';

export interface ScoreComponent {
  name: string;
  category: 'Trend' | 'Momentum' | 'Volume' | 'Options OI' | 'IV & Greeks';
  maxPoints: number;
  score: number;
  detail: string;
}

export interface AISignal {
  id: string;
  index: MarketIndex;
  type: SignalType;
  score: number; // 0 to 100
  regime: MarketRegimeType;
  confidence: number; // 0 to 100%
  uncertainty: number; // 0 to 100%
  strike: number;
  optionType: OptionType;
  expiry: string;
  spotPrice: number;
  suggestedEntry: {
    min: number;
    max: number;
    current: number;
  };
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  estimatedRiskPerLot: number;
  timestamp: string;
  dataSource: string;
  breakdown: {
    trendScore: number; // max 25
    momentumScore: number; // max 15
    volumeScore: number; // max 20
    oiScore: number; // max 25
    greeksScore: number; // max 15
    components: ScoreComponent[];
  };
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  geminiAnalysis?: string;
  strategyName: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'Trend' | 'Volume Profile' | 'Options OI' | 'Reversal' | 'Breakout';
  weight: number; // 0.5 to 2.0
  rules: string[];
}
