import {
  BuildupType,
  MarketIndex,
  OptionChainData,
  OptionStrike,
} from '../../types/market';
import { calculateBSPrice, calculateGreeks } from '../math/blackScholes';

/**
 * Returns index strike step (NIFTY: 50, SENSEX: 100)
 */
export function getStrikeStep(index: MarketIndex): number {
  return index === 'NIFTY' ? 50 : 100;
}

/**
 * Returns standard Indian market lot size
 */
export function getDefaultLotSize(index: MarketIndex): number {
  return index === 'NIFTY' ? 50 : 20; // BSE SENSEX standard 10/20 lot size
}

/**
 * Finds the nearest ATM strike for a given spot price
 */
export function getAtmStrike(spot: number, index: MarketIndex): number {
  const step = getStrikeStep(index);
  return Math.round(spot / step) * step;
}

/**
 * Determines institutional buildup classification from price change and OI change
 */
export function classifyBuildup(priceChange: number, oiChange: number): BuildupType {
  if (Math.abs(priceChange) < 0.1 && Math.abs(oiChange) < 50) return 'Neutral';

  if (priceChange >= 0 && oiChange > 0) return 'Long Buildup';
  if (priceChange < 0 && oiChange > 0) return 'Short Buildup';
  if (priceChange >= 0 && oiChange <= 0) return 'Short Covering';
  if (priceChange < 0 && oiChange <= 0) return 'Long Unwinding';

  return 'Neutral';
}

/**
 * Calculates Max Pain strike across the entire option chain
 * Max Pain is the strike where option buyers expire with the minimum payout (maximizing option seller profits).
 */
export function calculateMaxPain(strikes: OptionStrike[]): number {
  if (!strikes || strikes.length === 0) return 0;

  let minLoss = Infinity;
  let maxPainStrike = strikes[0].strike;

  for (const target of strikes) {
    let totalBuyerPayout = 0;
    const testPrice = target.strike;

    for (const s of strikes) {
      // Call buyers profit if testPrice > strike
      if (testPrice > s.strike) {
        totalBuyerPayout += (testPrice - s.strike) * s.ce.oi;
      }
      // Put buyers profit if testPrice < strike
      if (testPrice < s.strike) {
        totalBuyerPayout += (s.strike - testPrice) * s.pe.oi;
      }
    }

    if (totalBuyerPayout < minLoss) {
      minLoss = totalBuyerPayout;
      maxPainStrike = target.strike;
    }
  }

  return maxPainStrike;
}

/**
 * Synthesizes or enriches an Indian Options Chain with Greeks, PCR, and Max Pain
 */
export function buildSyntheticOptionChain(
  underlying: MarketIndex,
  spotPrice: number,
  baseIV: number = 14.5,
  daysToExpiry: number = 3.5,
  dataSource: string = 'SIMULATOR'
): OptionChainData {
  const step = getStrikeStep(underlying);
  const atm = getAtmStrike(spotPrice, underlying);
  const numStrikes = 15; // 15 strikes above, 15 below

  const strikes: OptionStrike[] = [];
  const T = Math.max(0.1, daysToExpiry) / 365;

  let totalCallOI = 0;
  let totalPutOI = 0;
  let totalCallVolume = 0;
  let totalPutVolume = 0;

  for (let i = -numStrikes; i <= numStrikes; i++) {
    const strike = atm + i * step;
    const isAtm = strike === atm;
    const isItmCE = strike < spotPrice;
    const isItmPE = strike > spotPrice;

    // IV smile: higher IV as we move further OTM
    const moneyness = Math.abs(strike - spotPrice) / spotPrice;
    const strikeIV = baseIV + moneyness * 18;
    const sigma = strikeIV / 100;

    // Theoretical prices
    const ceLtpRaw = calculateBSPrice(spotPrice, strike, T, 0.068, sigma, 'CE');
    const peLtpRaw = calculateBSPrice(spotPrice, strike, T, 0.068, sigma, 'PE');

    const ceLtp = Number(Math.max(0.15, ceLtpRaw).toFixed(2));
    const peLtp = Number(Math.max(0.15, peLtpRaw).toFixed(2));

    // Simulated realistic Open Interest distribution
    // Higher Call OI above spot, higher Put OI below spot (hedging and writing walls)
    const distFactor = Math.exp(-Math.pow((strike - spotPrice) / (spotPrice * 0.025), 2));
    const baseLot = underlying === 'NIFTY' ? 35000 : 15000;

    let ceOI = Math.round(baseLot * (strike >= atm ? 1.4 : 0.6) * (0.4 + 1.2 * distFactor));
    let peOI = Math.round(baseLot * (strike <= atm ? 1.4 : 0.6) * (0.4 + 1.2 * distFactor));

    // Add round-number strike magnet effects (e.g., 24000, 24500, 25000 / 80000, 81000)
    if (strike % 500 === 0) {
      ceOI = Math.round(ceOI * 1.8);
      peOI = Math.round(peOI * 1.7);
    }

    const ceOiChange = Math.round((Math.random() - 0.45) * 5000);
    const peOiChange = Math.round((Math.random() - 0.42) * 5000);

    const ceChange = Number(((Math.random() - 0.48) * (ceLtp * 0.15)).toFixed(2));
    const peChange = Number(((Math.random() - 0.52) * (peLtp * 0.15)).toFixed(2));

    const ceVolume = Math.round(ceOI * (0.3 + Math.random() * 0.5));
    const peVolume = Math.round(peOI * (0.3 + Math.random() * 0.5));

    const ceBid = Number((ceLtp * 0.995).toFixed(2));
    const ceAsk = Number((ceLtp * 1.005).toFixed(2));
    const peBid = Number((peLtp * 0.995).toFixed(2));
    const peAsk = Number((peLtp * 1.005).toFixed(2));

    const ceGreeks = calculateGreeks(spotPrice, strike, T, 0.068, sigma, 'CE');
    const peGreeks = calculateGreeks(spotPrice, strike, T, 0.068, sigma, 'PE');

    totalCallOI += ceOI;
    totalPutOI += peOI;
    totalCallVolume += ceVolume;
    totalPutVolume += peVolume;

    strikes.push({
      strike,
      isAtm,
      isItmCE,
      isItmPE,
      ce: {
        ltp: ceLtp,
        change: ceChange,
        pChange: Number(((ceChange / (ceLtp || 1)) * 100).toFixed(2)),
        oi: ceOI,
        oiChange: ceOiChange,
        pOiChange: Number(((ceOiChange / (ceOI || 1)) * 100).toFixed(2)),
        volume: ceVolume,
        bid: ceBid,
        ask: ceAsk,
        spread: Number((ceAsk - ceBid).toFixed(2)),
        iv: Number(strikeIV.toFixed(2)),
        greeks: ceGreeks,
        buildup: classifyBuildup(ceChange, ceOiChange),
      },
      pe: {
        ltp: peLtp,
        change: peChange,
        pChange: Number(((peChange / (peLtp || 1)) * 100).toFixed(2)),
        oi: peOI,
        oiChange: peOiChange,
        pOiChange: Number(((peOiChange / (peOI || 1)) * 100).toFixed(2)),
        volume: peVolume,
        bid: peBid,
        ask: peAsk,
        spread: Number((peAsk - peBid).toFixed(2)),
        iv: Number(strikeIV.toFixed(2)),
        greeks: peGreeks,
        buildup: classifyBuildup(peChange, peOiChange),
      },
    });
  }

  const pcr = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(3)) : 1.0;
  const maxPain = calculateMaxPain(strikes);

  // Highest Call and Put OI strikes
  let maxCallOI = -1;
  let highestCallOIStrike = atm;
  let maxPutOI = -1;
  let highestPutOIStrike = atm;

  for (const s of strikes) {
    if (s.ce.oi > maxCallOI) {
      maxCallOI = s.ce.oi;
      highestCallOIStrike = s.strike;
    }
    if (s.pe.oi > maxPutOI) {
      maxPutOI = s.pe.oi;
      highestPutOIStrike = s.strike;
    }
  }

  const now = new Date();
  const nextThursday = new Date();
  nextThursday.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7 || 7));
  const expiryDate = nextThursday.toISOString().split('T')[0];

  return {
    underlying,
    spotPrice,
    atmStrike: atm,
    expiryDate,
    availableExpiries: [
      expiryDate,
      new Date(nextThursday.getTime() + 7 * 86400000).toISOString().split('T')[0],
      new Date(nextThursday.getTime() + 14 * 86400000).toISOString().split('T')[0],
    ],
    strikes,
    totalCallOI,
    totalPutOI,
    totalCallVolume,
    totalPutVolume,
    pcr,
    maxPain,
    highestCallOIStrike,
    highestPutOIStrike,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    dataSource,
  };
}
