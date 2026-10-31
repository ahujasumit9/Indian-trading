import { Candle, OptionChainData, VolumeProfileData } from '../../types/market';
import { TradingStrategy } from '../../types/signals';

export const DEFAULT_STRATEGIES: TradingStrategy[] = [
  {
    id: 'strat_1',
    name: 'EMA 15/20 Crossover + VWAP Confirmation',
    description: 'Bullish when fast EMA 15 crosses above EMA 20 with price strictly sustaining above intraday VWAP; bearish when EMA 15 drops below EMA 20 below VWAP.',
    enabled: true,
    category: 'Trend',
    weight: 1.2,
    rules: [
      'EMA 15 > EMA 20 for Long / EMA 15 < EMA 20 for Short',
      'Candle Close > VWAP for Long / Candle Close < VWAP for Short',
      'Minimum candle body size > 0.15% of spot',
    ],
  },
  {
    id: 'strat_2',
    name: 'VWAP Breakout with Volume Expansion',
    description: 'Captures decisive institutional pushes through VWAP backed by volume > 1.3x 20-period volume moving average.',
    enabled: true,
    category: 'Breakout',
    weight: 1.1,
    rules: [
      'Cross above VWAP within last 3 candles',
      'Volume > 1.3x Volume MA',
      'RSI between 52 and 68',
    ],
  },
  {
    id: 'strat_3',
    name: 'Volume Profile POC Breakout',
    description: 'Enters directional momentum when price clears high-volume POC node and holds above with volume acceptance.',
    enabled: true,
    category: 'Volume Profile',
    weight: 1.0,
    rules: [
      'Price breaks beyond POC level',
      'Volume acceptance confirmed outside POC',
      'Next resistance/support at least 1.5 ATR away',
    ],
  },
  {
    id: 'strat_4',
    name: 'VAH / VAL Rejection (Mean Reversion)',
    description: 'Identifies failed breakouts at Value Area High (VAH) or Value Area Low (VAL), signaling a rapid mean-reversion move back to POC.',
    enabled: true,
    category: 'Reversal',
    weight: 1.0,
    rules: [
      'Price tests VAH/VAL with upper/lower wick rejection',
      'Volume contracts at edge of Value Area',
      'Target: Return to POC (Point of Control)',
    ],
  },
  {
    id: 'strat_5',
    name: 'OI Buildup & Unwinding Tracker',
    description: 'Detects institutional long buildup (CE Price ↑, OI ↑) paired with put writing or aggressive short covering.',
    enabled: true,
    category: 'Options OI',
    weight: 1.3,
    rules: [
      'ATM CE demonstrates Long Buildup or Short Covering',
      'ATM PE demonstrates Short Buildup (Put writing cushion)',
      'Total Net OI change favorable to direction',
    ],
  },
  {
    id: 'strat_6',
    name: 'PCR Multi-Strike Confirmation',
    description: 'Filters setups against Put-Call Ratio dynamics: longs confirmed when PCR > 1.10 and rising; shorts confirmed when PCR < 0.80 and falling.',
    enabled: true,
    category: 'Options OI',
    weight: 1.0,
    rules: [
      'Long: PCR > 1.10 or PCR crossed above 1.0 from oversold',
      'Short: PCR < 0.80 or PCR broke below 0.90',
      'Avoid trading against extreme PCR divergence',
    ],
  },
  {
    id: 'strat_7',
    name: 'Trend Continuation on Pullback',
    description: 'Enters in the direction of the dominant Supertrend & EMA 50 trend when price pulls back to test EMA 20 or VWAP.',
    enabled: true,
    category: 'Trend',
    weight: 1.1,
    rules: [
      'Supertrend direction aligned with higher timeframe',
      'Pullback touches EMA 20 within 0.1% tolerance',
      'Bullish/bearish reversal candlestick print at support',
    ],
  },
  {
    id: 'strat_8',
    name: 'False Breakout (Trap) Detection',
    description: 'Spots when price breaks previous day high/low or swing high, fails to sustain, and snaps back with volume divergence.',
    enabled: true,
    category: 'Breakout',
    weight: 1.0,
    rules: [
      'Break of swing high/low followed immediately by close back inside range',
      'Volume profile shows LVN rejection',
      'RSI bearish/bullish divergence against price peak',
    ],
  },
  {
    id: 'strat_9',
    name: 'Momentum Reversal (RSI + MACD Divergence)',
    description: 'Fades exhaustion moves when RSI reaches extreme territory (<28 or >72) and MACD histogram begins converging.',
    enabled: true,
    category: 'Reversal',
    weight: 0.9,
    rules: [
      'RSI > 70 or < 30 on testing key support/resistance strike',
      'MACD histogram shows inflection toward zero line',
      'Strict 1.5 ATR stop loss',
    ],
  },
  {
    id: 'strat_10',
    name: 'Opening Range Breakout (ORB)',
    description: 'Monitors the high and low of the initial 15-minute market window (9:15 to 9:30 AM IST) and triggers on the first decisive breakout candle.',
    enabled: true,
    category: 'Breakout',
    weight: 1.2,
    rules: [
      'Clear break of 15m opening high/low',
      'Volume on breakout candle > 1.5x opening average',
      'First pullback to opening range boundary held',
    ],
  },
];

export interface StrategyEvaluationResult {
  strategyId: string;
  name: string;
  active: boolean;
  scoreContribution: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  message: string;
}

/**
 * Evaluates active strategies against current candles, option chain, and volume profile
 */
export function evaluateStrategies(
  strategies: TradingStrategy[],
  candles: Candle[],
  optionChain: OptionChainData,
  volumeProfile: VolumeProfileData
): StrategyEvaluationResult[] {
  if (candles.length < 5) return [];
  const last = candles[candles.length - 1];

  return strategies.map((strat) => {
    if (!strat.enabled) {
      return {
        strategyId: strat.id,
        name: strat.name,
        active: false,
        scoreContribution: 0,
        direction: 'NEUTRAL',
        message: 'Strategy disabled by user',
      };
    }

    switch (strat.id) {
      case 'strat_1': {
        const isBull = (last.ema15 || 0) > (last.ema20 || 0) && last.close > (last.vwap || 0);
        const isBear = (last.ema15 || 0) < (last.ema20 || 0) && last.close < (last.vwap || 0);
        return {
          strategyId: strat.id,
          name: strat.name,
          active: isBull || isBear,
          scoreContribution: isBull ? 10 * strat.weight : isBear ? -10 * strat.weight : 0,
          direction: isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL',
          message: isBull ? 'EMA 15/20 bullish crossover aligned above VWAP' : isBear ? 'EMA 15/20 bearish crossover aligned below VWAP' : 'MAs converging without VWAP alignment',
        };
      }
      case 'strat_2': {
        const isVolSurge = (last.volume || 0) > (last.volumeMA || 1) * 1.25;
        const aboveVwap = last.close > (last.vwap || 0);
        return {
          strategyId: strat.id,
          name: strat.name,
          active: isVolSurge,
          scoreContribution: isVolSurge && aboveVwap ? 8 * strat.weight : 0,
          direction: isVolSurge && aboveVwap ? 'BULLISH' : 'NEUTRAL',
          message: isVolSurge ? `Volume surge (${Math.round((last.volume / (last.volumeMA || 1)) * 100)}% of avg) at VWAP` : 'Volume normal',
        };
      }
      case 'strat_3': {
        const abovePoc = last.close > volumeProfile.poc;
        return {
          strategyId: strat.id,
          name: strat.name,
          active: volumeProfile.acceptanceStatus === 'ACCEPTED',
          scoreContribution: abovePoc ? 7 * strat.weight : -7 * strat.weight,
          direction: abovePoc ? 'BULLISH' : 'BEARISH',
          message: abovePoc ? `Price holding above POC (${volumeProfile.poc})` : `Trapped below POC (${volumeProfile.poc})`,
        };
      }
      case 'strat_4': {
        const isNearVah = Math.abs(last.close - volumeProfile.vah) < (last.atr14 || 50) * 0.5;
        const isNearVal = Math.abs(last.close - volumeProfile.val) < (last.atr14 || 50) * 0.5;
        return {
          strategyId: strat.id,
          name: strat.name,
          active: isNearVah || isNearVal,
          scoreContribution: isNearVal ? 6 * strat.weight : isNearVah ? -6 * strat.weight : 0,
          direction: isNearVal ? 'BULLISH' : isNearVah ? 'BEARISH' : 'NEUTRAL',
          message: isNearVal ? 'VAL test: potential bounce back to POC' : isNearVah ? 'VAH test: potential rejection back to POC' : 'Price oscillating inside value area',
        };
      }
      case 'strat_5': {
        const atm = optionChain.strikes.find((s) => s.strike === optionChain.atmStrike);
        const ceLong = atm?.ce.buildup === 'Long Buildup';
        const peShort = atm?.pe.buildup === 'Short Buildup';
        return {
          strategyId: strat.id,
          name: strat.name,
          active: ceLong || peShort,
          scoreContribution: ceLong && peShort ? 12 * strat.weight : ceLong ? 6 * strat.weight : 0,
          direction: ceLong || peShort ? 'BULLISH' : 'NEUTRAL',
          message: ceLong && peShort ? 'ATM CE Long Buildup + PE Short Buildup confirmed' : 'No clear OI dominance',
        };
      }
      case 'strat_6': {
        const pcr = optionChain.pcr;
        const isBullPcr = pcr >= 1.15;
        const isBearPcr = pcr <= 0.8;
        return {
          strategyId: strat.id,
          name: strat.name,
          active: isBullPcr || isBearPcr,
          scoreContribution: isBullPcr ? 8 * strat.weight : isBearPcr ? -8 * strat.weight : 0,
          direction: isBullPcr ? 'BULLISH' : isBearPcr ? 'BEARISH' : 'NEUTRAL',
          message: `PCR at ${pcr.toFixed(3)}: ${isBullPcr ? 'Put writer support dominant' : isBearPcr ? 'Call writer resistance dominant' : 'Balanced'}`,
        };
      }
      default: {
        return {
          strategyId: strat.id,
          name: strat.name,
          active: true,
          scoreContribution: 4 * strat.weight,
          direction: 'BULLISH',
          message: 'Monitoring conditions',
        };
      }
    }
  });
}
