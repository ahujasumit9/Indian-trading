/**
 * Portfolio & Derivatives Capital Rebalancing Engine
 * Optimizes cash buffer vs deployed option margin, computes portfolio net Delta, and warns of over-leverage.
 */

export interface AllocationBucket {
  category: 'CASH_EQUIVALENTS' | 'INDEX_OPTION_WRITING' | 'INDEX_OPTION_BUYING' | 'OVERNIGHT_HEDGES';
  targetPercent: number;
  currentAmount: number;
  currentPercent: number;
  deltaAmount: number;
  recommendation: 'ALLOCATE' | 'TRIM' | 'BALANCED';
}

export interface RebalancePlan {
  totalCapital: number;
  deployedMargin: number;
  freeCash: number;
  netPortfolioDelta: number; // Positive = net long, Negative = net short
  deltaBias: 'BULLISH' | 'BEARISH' | 'DELTA_NEUTRAL';
  buckets: AllocationBucket[];
  actionNotes: string[];
}

export function computeRebalancePlan(
  totalCapital: number = 500000,
  deployedMargin: number = 180000,
  optionBuyingValue: number = 25000,
  netDelta: number = 0.18
): RebalancePlan {
  const freeCash = totalCapital - deployedMargin - optionBuyingValue;
  const cashPercent = (freeCash / totalCapital) * 100;
  const writingPercent = (deployedMargin / totalCapital) * 100;
  const buyingPercent = (optionBuyingValue / totalCapital) * 100;

  // Institutional best practice for Indian index option trading:
  // 50% Cash buffer / Liquid funds (for margin safety & drawdown protection)
  // 35% Defined risk option selling (credit spreads, iron condors)
  // 10% High conviction directional option buying (trend continuation)
  // 5% Tail risk hedges (far OTM puts)
  const targets = {
    CASH: 50,
    WRITING: 35,
    BUYING: 10,
    HEDGES: 5,
  };

  const buckets: AllocationBucket[] = [
    {
      category: 'CASH_EQUIVALENTS',
      targetPercent: targets.CASH,
      currentAmount: freeCash,
      currentPercent: Number(cashPercent.toFixed(1)),
      deltaAmount: Math.round((targets.CASH / 100) * totalCapital - freeCash),
      recommendation: cashPercent < 40 ? 'ALLOCATE' : cashPercent > 65 ? 'TRIM' : 'BALANCED',
    },
    {
      category: 'INDEX_OPTION_WRITING',
      targetPercent: targets.WRITING,
      currentAmount: deployedMargin,
      currentPercent: Number(writingPercent.toFixed(1)),
      deltaAmount: Math.round((targets.WRITING / 100) * totalCapital - deployedMargin),
      recommendation: writingPercent > 45 ? 'TRIM' : writingPercent < 25 ? 'ALLOCATE' : 'BALANCED',
    },
    {
      category: 'INDEX_OPTION_BUYING',
      targetPercent: targets.BUYING,
      currentAmount: optionBuyingValue,
      currentPercent: Number(buyingPercent.toFixed(1)),
      deltaAmount: Math.round((targets.BUYING / 100) * totalCapital - optionBuyingValue),
      recommendation: buyingPercent > 15 ? 'TRIM' : 'BALANCED',
    },
    {
      category: 'OVERNIGHT_HEDGES',
      targetPercent: targets.HEDGES,
      currentAmount: Math.round(totalCapital * 0.03),
      currentPercent: 3.0,
      deltaAmount: Math.round((targets.HEDGES / 100) * totalCapital - totalCapital * 0.03),
      recommendation: 'ALLOCATE',
    },
  ];

  const actionNotes: string[] = [];
  if (cashPercent < 40) {
    actionNotes.push('CRITICAL: Free cash buffer below 40%. Close or hedge high-margin short positions to avoid margin calls.');
  } else {
    actionNotes.push('Cash buffer healthy (>40%). Protection against unexpected gap-ups or gap-downs intact.');
  }

  if (Math.abs(netDelta) > 0.5) {
    actionNotes.push(`Net portfolio delta (${netDelta.toFixed(2)}) is heavily directional. Consider taking counter-trend spreads to reach neutral delta.`);
  } else {
    actionNotes.push(`Net portfolio delta (${netDelta.toFixed(2)}) is well balanced and controlled.`);
  }

  return {
    totalCapital,
    deployedMargin,
    freeCash,
    netPortfolioDelta: netDelta,
    deltaBias: netDelta > 0.15 ? 'BULLISH' : netDelta < -0.15 ? 'BEARISH' : 'DELTA_NEUTRAL',
    buckets,
    actionNotes,
  };
}
