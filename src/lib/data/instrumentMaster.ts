/**
 * Dynamic Instrument Master for Indian Equity Derivatives (NSE / BSE)
 * Provides dynamic contract specifications, lot sizes, strike intervals, and settlement expiries.
 */
import { MarketIndex } from '../../types/market';

export interface InstrumentSpec {
  symbol: MarketIndex | 'BANKNIFTY';
  displayName: string;
  exchange: 'NSE' | 'BSE';
  strikeStep: number;
  lotSize: number;
  tickSize: number;
  underlyingAsset: string;
  weeklyExpiryDay: number; // 0 = Sunday, 1 = Monday, 4 = Thursday, 5 = Friday
  monthlySettlementType: 'LAST_THURSDAY' | 'LAST_FRIDAY';
}

export const INSTRUMENT_MASTER: Record<string, InstrumentSpec> = {
  NIFTY: {
    symbol: 'NIFTY',
    displayName: 'NIFTY 50',
    exchange: 'NSE',
    strikeStep: 50,
    lotSize: 75, // Updated NSE index lot size
    tickSize: 0.05,
    underlyingAsset: 'NIFTY 50 INDEX',
    weeklyExpiryDay: 4, // Thursday
    monthlySettlementType: 'LAST_THURSDAY',
  },
  SENSEX: {
    symbol: 'SENSEX',
    displayName: 'BSE SENSEX',
    exchange: 'BSE',
    strikeStep: 100,
    lotSize: 20, // BSE SENSEX lot size
    tickSize: 0.05,
    underlyingAsset: 'BSE SENSEX 30 INDEX',
    weeklyExpiryDay: 5, // Friday
    monthlySettlementType: 'LAST_FRIDAY',
  },
};

/**
 * Returns instrument specifications for an index
 */
export function getInstrumentSpec(index: MarketIndex): InstrumentSpec {
  const spec = INSTRUMENT_MASTER[index];
  if (!spec) {
    throw new Error(`Unsupported index derivative: ${index}`);
  }
  return spec;
}

/**
 * Validates if a proposed strike price adheres to exchange strike step rules
 */
export function validateStrike(index: MarketIndex, strike: number): { valid: boolean; normalizedStrike: number; error?: string } {
  const spec = getInstrumentSpec(index);
  const remainder = strike % spec.strikeStep;
  if (remainder !== 0) {
    const normalized = Math.round(strike / spec.strikeStep) * spec.strikeStep;
    return {
      valid: false,
      normalizedStrike: normalized,
      error: `Invalid strike ${strike} for ${index}. Must be a multiple of ${spec.strikeStep}. Closest valid strike is ${normalized}.`,
    };
  }
  return { valid: true, normalizedStrike: strike };
}

/**
 * Validates if order quantity is an exact multiple of the exchange contract lot size
 */
export function validateLotQuantity(index: MarketIndex, quantity: number): { valid: boolean; lotCount: number; error?: string } {
  const spec = getInstrumentSpec(index);
  if (quantity <= 0) {
    return { valid: false, lotCount: 0, error: 'Quantity must be greater than zero.' };
  }
  const lotCount = quantity / spec.lotSize;
  if (!Number.isInteger(lotCount)) {
    return {
      valid: false,
      lotCount: Math.floor(lotCount),
      error: `Quantity ${quantity} is not a multiple of ${index} lot size (${spec.lotSize}). Minimum order is 1 lot (${spec.lotSize}).`,
    };
  }
  return { valid: true, lotCount };
}

/**
 * Calculates nearest At-The-Money (ATM) strike price based on current spot
 */
export function calculateAtmStrike(index: MarketIndex, spotPrice: number): number {
  const spec = getInstrumentSpec(index);
  return Math.round(spotPrice / spec.strikeStep) * spec.strikeStep;
}

/**
 * Generates an array of equidistant strikes around the spot price
 */
export function generateStrikesGrid(index: MarketIndex, spotPrice: number, strikesCount: number = 10): number[] {
  const spec = getInstrumentSpec(index);
  const atm = calculateAtmStrike(index, spotPrice);
  const strikes: number[] = [];

  for (let i = -strikesCount; i <= strikesCount; i++) {
    strikes.push(atm + i * spec.strikeStep);
  }

  return strikes;
}

/**
 * Generates upcoming derivative expiry dates according to exchange calendar
 */
export function getUpcomingExpiryDates(index: MarketIndex, count: number = 4): string[] {
  const spec = getInstrumentSpec(index);
  const targetDay = spec.weeklyExpiryDay;
  const expiries: string[] = [];

  const cursor = new Date();
  cursor.setHours(15, 30, 0, 0);

  // Find next target weekday
  while (expiries.length < count) {
    const currentDay = cursor.getDay();
    let daysUntil = (targetDay - currentDay + 7) % 7;
    // If today is expiry day and past 15:30 IST, roll to next week
    if (daysUntil === 0 && new Date() > cursor) {
      daysUntil = 7;
    }

    cursor.setDate(cursor.getDate() + (daysUntil === 0 ? 7 : daysUntil));
    
    // Format YYYY-MM-DD
    const isoDate = cursor.toISOString().split('T')[0];
    if (!expiries.includes(isoDate)) {
      expiries.push(isoDate);
    }
    // Advance to search next week
    cursor.setDate(cursor.getDate() + 1);
  }

  return expiries;
}

/**
 * Generates official NSE/BSE contract symbol representation
 * e.g., NIFTY24OCT24200CE or SENSEX24OCT79800PE
 */
export function generateContractSymbol(
  index: MarketIndex,
  expiryIso: string,
  strike: number,
  optionType: 'CE' | 'PE'
): string {
  const expiry = new Date(expiryIso);
  const year = String(expiry.getFullYear()).slice(-2);
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = monthNames[expiry.getMonth()];
  const day = String(expiry.getDate()).padStart(2, '0');

  return `${index}${year}${month}${day}${strike}${optionType}`;
}
