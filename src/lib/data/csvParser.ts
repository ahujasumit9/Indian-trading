import { Candle, OptionChainData, OptionStrike } from '../../types/market';
import { enrichCandlesWithIndicators } from '../math/technicals';
import { calculateBSPrice, calculateGreeks } from '../math/blackScholes';
import { calculateMaxPain, classifyBuildup } from '../engine/optionsEngine';

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rowCount?: number;
}

/**
 * Validates and parses index candle CSV content
 * Required columns: timestamp, open, high, low, close, volume (or aliases)
 */
export function parseCandleCSV(csvText: string): ParseResult<Candle[]> {
  try {
    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'CSV file contains no data rows.' };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const findCol = (aliases: string[]) => headers.findIndex((h) => aliases.some((a) => h.includes(a)));

    const timeIdx = findCol(['time', 'date', 'timestamp']);
    const openIdx = findCol(['open']);
    const highIdx = findCol(['high']);
    const lowIdx = findCol(['low']);
    const closeIdx = findCol(['close']);
    const volIdx = findCol(['volume', 'vol', 'qty']);

    if (openIdx === -1 || highIdx === -1 || lowIdx === -1 || closeIdx === -1) {
      return {
        success: false,
        error: `Missing mandatory price columns. Required: open, high, low, close. Found: ${headers.join(', ')}`,
      };
    }

    const candles: Candle[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 4) continue;

      const open = parseFloat(parts[openIdx]);
      const high = parseFloat(parts[highIdx]);
      const low = parseFloat(parts[lowIdx]);
      const close = parseFloat(parts[closeIdx]);
      const volume = volIdx !== -1 ? parseFloat(parts[volIdx]) || 1000 : 1000;
      const timestamp = timeIdx !== -1 ? parts[timeIdx] : `Row ${i}`;

      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    if (candles.length === 0) {
      return { success: false, error: 'No valid numeric candle rows could be parsed from CSV.' };
    }

    const enriched = enrichCandlesWithIndicators(candles);
    return { success: true, data: enriched, rowCount: enriched.length };
  } catch (err: any) {
    return { success: false, error: `CSV Parsing Exception: ${err.message}` };
  }
}

/**
 * Validates and parses Option Chain CSV content
 * Required columns: strike, option_type, ltp, volume, oi (or aliases)
 */
export function parseOptionChainCSV(
  csvText: string,
  spotPrice: number = 24150,
  underlying: 'NIFTY' | 'SENSEX' = 'NIFTY'
): ParseResult<OptionChainData> {
  try {
    const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'Option chain CSV contains no data rows.' };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const findCol = (aliases: string[]) => headers.findIndex((h) => aliases.some((a) => h.includes(a)));

    const strikeIdx = findCol(['strike', 'strike_price', 'strikeprice']);
    const typeIdx = findCol(['option_type', 'type', 'opt_type', 'instrument']);
    const ltpIdx = findCol(['ltp', 'close', 'last_price', 'price']);
    const oiIdx = findCol(['oi', 'open_interest', 'openinterest']);
    const oiChgIdx = findCol(['oi_change', 'chng_in_oi', 'change_oi']);
    const volIdx = findCol(['volume', 'vol', 'total_traded_volume']);
    const ivIdx = findCol(['iv', 'implied_volatility']);

    if (strikeIdx === -1 || typeIdx === -1 || ltpIdx === -1) {
      return {
        success: false,
        error: `Missing mandatory option-chain columns. Required: strike, option_type, ltp. Found: ${headers.join(', ')}`,
      };
    }

    const strikeMap = new Map<number, { ce?: any; pe?: any }>();

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 3) continue;

      const strike = parseFloat(parts[strikeIdx]);
      const optType = parts[typeIdx].toUpperCase().includes('C') ? 'CE' : 'PE';
      const ltp = parseFloat(parts[ltpIdx]);
      const oi = oiIdx !== -1 ? parseFloat(parts[oiIdx]) || 0 : 0;
      const oiChg = oiChgIdx !== -1 ? parseFloat(parts[oiChgIdx]) || 0 : 0;
      const vol = volIdx !== -1 ? parseFloat(parts[volIdx]) || 0 : 0;
      const iv = ivIdx !== -1 ? parseFloat(parts[ivIdx]) || 14.0 : 14.0;

      if (isNaN(strike) || isNaN(ltp)) continue;

      if (!strikeMap.has(strike)) {
        strikeMap.set(strike, {});
      }
      strikeMap.get(strike)![optType === 'CE' ? 'ce' : 'pe'] = {
        ltp,
        oi,
        oiChg,
        vol,
        iv,
      };
    }

    const sortedStrikes = Array.from(strikeMap.keys()).sort((a, b) => a - b);
    if (sortedStrikes.length === 0) {
      return { success: false, error: 'No valid strikes found in CSV.' };
    }

    const strikes: OptionStrike[] = [];
    let totalCallOI = 0;
    let totalPutOI = 0;
    let totalCallVolume = 0;
    let totalPutVolume = 0;

    // Determine nearest strike to spot
    let closestStrike = sortedStrikes[0];
    let minDiff = Math.abs(spotPrice - closestStrike);
    for (const s of sortedStrikes) {
      if (Math.abs(spotPrice - s) < minDiff) {
        minDiff = Math.abs(spotPrice - s);
        closestStrike = s;
      }
    }

    for (const s of sortedStrikes) {
      const entry = strikeMap.get(s)!;
      const ceData = entry.ce || { ltp: 10, oi: 100, oiChg: 0, vol: 50, iv: 14 };
      const peData = entry.pe || { ltp: 10, oi: 100, oiChg: 0, vol: 50, iv: 14 };

      const ceGreeks = calculateGreeks(spotPrice, s, 4 / 365, 0.068, (ceData.iv || 14) / 100, 'CE');
      const peGreeks = calculateGreeks(spotPrice, s, 4 / 365, 0.068, (peData.iv || 14) / 100, 'PE');

      totalCallOI += ceData.oi;
      totalPutOI += peData.oi;
      totalCallVolume += ceData.vol;
      totalPutVolume += peData.vol;

      strikes.push({
        strike: s,
        isAtm: s === closestStrike,
        isItmCE: s < spotPrice,
        isItmPE: s > spotPrice,
        ce: {
          ltp: ceData.ltp,
          change: 0,
          pChange: 0,
          oi: ceData.oi,
          oiChange: ceData.oiChg,
          pOiChange: 0,
          volume: ceData.vol,
          bid: Number((ceData.ltp * 0.99).toFixed(2)),
          ask: Number((ceData.ltp * 1.01).toFixed(2)),
          spread: Number((ceData.ltp * 0.02).toFixed(2)),
          iv: ceData.iv,
          greeks: ceGreeks,
          buildup: classifyBuildup(0, ceData.oiChg),
        },
        pe: {
          ltp: peData.ltp,
          change: 0,
          pChange: 0,
          oi: peData.oi,
          oiChange: peData.oiChg,
          pOiChange: 0,
          volume: peData.vol,
          bid: Number((peData.ltp * 0.99).toFixed(2)),
          ask: Number((peData.ltp * 1.01).toFixed(2)),
          spread: Number((peData.ltp * 0.02).toFixed(2)),
          iv: peData.iv,
          greeks: peGreeks,
          buildup: classifyBuildup(0, peData.oiChg),
        },
      });
    }

    const pcr = totalCallOI > 0 ? Number((totalPutOI / totalCallOI).toFixed(3)) : 1.0;
    const maxPain = calculateMaxPain(strikes);

    let maxCallOI = -1;
    let highestCallOIStrike = closestStrike;
    let maxPutOI = -1;
    let highestPutOIStrike = closestStrike;

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

    const optionChain: OptionChainData = {
      underlying,
      spotPrice,
      atmStrike: closestStrike,
      expiryDate: new Date().toISOString().split('T')[0],
      availableExpiries: [new Date().toISOString().split('T')[0]],
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
      dataSource: 'CSV_IMPORT',
    };

    return { success: true, data: optionChain, rowCount: strikes.length };
  } catch (err: any) {
    return { success: false, error: `Option Chain CSV Parsing Exception: ${err.message}` };
  }
}
