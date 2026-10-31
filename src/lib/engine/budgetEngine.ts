/**
 * Indian F&O Margin & Capital Allocation Budget Engine
 * Calculates SEBI-mandated SPAN + Exposure margins, option buying capital, multi-leg hedge benefits, and position sizing.
 */
import { MarketIndex } from '../../types/market';
import { getInstrumentSpec } from '../data/instrumentMaster';

export interface MarginRequirement {
  index: MarketIndex;
  lotSize: number;
  lotCount: number;
  totalQuantity: number;
  optionAction: 'BUY' | 'SELL_NAKED' | 'HEDGED_SPREAD';
  premiumPrice: number;
  spotPrice: number;
  contractNotionalValue: number;
  spanMargin: number;
  exposureMargin: number;
  totalMarginRequired: number;
  leverageRatio: number;
  maxAffordableLots: number;
  recommendedRiskPerTrade: number;
}

export function calculateFoMargin(
  index: MarketIndex,
  spotPrice: number,
  premiumPrice: number,
  lotCount: number,
  optionAction: 'BUY' | 'SELL_NAKED' | 'HEDGED_SPREAD',
  accountCapital: number = 500000,
  riskPerTradePct: number = 1.5
): MarginRequirement {
  const spec = getInstrumentSpec(index);
  const totalQuantity = lotCount * spec.lotSize;
  const contractNotionalValue = spotPrice * totalQuantity;

  let spanMargin = 0;
  let exposureMargin = 0;
  let totalMarginRequired = 0;

  if (optionAction === 'BUY') {
    // SEBI Rule: Option buyers must pay 100% of option premium upfront. No leverage on premium.
    totalMarginRequired = premiumPrice * totalQuantity;
    spanMargin = 0;
    exposureMargin = 0;
  } else if (optionAction === 'SELL_NAKED') {
    // SEBI SPAN + Exposure margin approx 14% to 17% of notional value for index options
    spanMargin = contractNotionalValue * 0.115;
    exposureMargin = contractNotionalValue * 0.035;
    totalMarginRequired = Math.round(spanMargin + exposureMargin);
  } else if (optionAction === 'HEDGED_SPREAD') {
    // Multi-leg spread (e.g. Bull Call Spread) gets SEBI margin benefit; reduces requirement to ~25-30%
    const baseMargin = (contractNotionalValue * 0.15);
    totalMarginRequired = Math.round(baseMargin * 0.28);
    spanMargin = totalMarginRequired * 0.75;
    exposureMargin = totalMarginRequired * 0.25;
  }

  // Margin per single lot
  const singleLotMargin = totalMarginRequired / (lotCount || 1);
  const maxAffordableLots = singleLotMargin > 0 ? Math.floor(accountCapital / singleLotMargin) : 0;
  const recommendedRiskPerTrade = (accountCapital * riskPerTradePct) / 100;

  return {
    index,
    lotSize: spec.lotSize,
    lotCount,
    totalQuantity,
    optionAction,
    premiumPrice,
    spotPrice,
    contractNotionalValue: Math.round(contractNotionalValue),
    spanMargin: Math.round(spanMargin),
    exposureMargin: Math.round(exposureMargin),
    totalMarginRequired: Math.round(totalMarginRequired),
    leverageRatio: totalMarginRequired > 0 ? Number((contractNotionalValue / totalMarginRequired).toFixed(2)) : 1,
    maxAffordableLots,
    recommendedRiskPerTrade,
  };
}
