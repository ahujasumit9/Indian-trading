import { Candle } from '../../types/market';

/**
 * Calculates Exponential Moving Average (EMA) for an array of numbers
 */
export function calculateEMA(data: number[], span: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (span + 1);
  const emaValues: number[] = new Array(data.length);
  
  // First value initialized to first item
  let ema = data[0];
  emaValues[0] = ema;

  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    emaValues[i] = ema;
  }
  return emaValues;
}

/**
 * Calculate Relative Strength Index (RSI) using standard Wilder's smoothing
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += -diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }

  return rsi;
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const atr: number[] = new Array(closes.length).fill(0);
  if (closes.length === 0) return atr;

  const tr: number[] = new Array(closes.length).fill(0);
  tr[0] = highs[0] - lows[0];

  for (let i = 1; i < closes.length; i++) {
    const hL = highs[i] - lows[i];
    const hC = Math.abs(highs[i] - closes[i - 1]);
    const lC = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(hL, hC, lC);
  }

  let sum = 0;
  for (let i = 0; i < Math.min(period, tr.length); i++) {
    sum += tr[i];
  }
  let currentAtr = sum / Math.min(period, tr.length);
  atr[Math.min(period - 1, tr.length - 1)] = currentAtr;

  for (let i = period; i < tr.length; i++) {
    currentAtr = (currentAtr * (period - 1) + tr[i]) / period;
    atr[i] = currentAtr;
  }

  return atr;
}

/**
 * Calculate Supertrend (10, 3)
 */
export function calculateSupertrend(
  highs: number[],
  lows: number[],
  closes: number[],
  atr: number[],
  multiplier: number = 3
): { supertrend: number[]; direction: ('UP' | 'DOWN')[] } {
  const len = closes.length;
  const supertrend: number[] = new Array(len).fill(0);
  const direction: ('UP' | 'DOWN')[] = new Array(len).fill('UP');

  if (len === 0) return { supertrend, direction };

  const upperBand: number[] = new Array(len).fill(0);
  const lowerBand: number[] = new Array(len).fill(0);

  for (let i = 0; i < len; i++) {
    const hl2 = (highs[i] + lows[i]) / 2;
    const basicUpper = hl2 + multiplier * (atr[i] || 1);
    const basicLower = hl2 - multiplier * (atr[i] || 1);

    if (i === 0) {
      upperBand[i] = basicUpper;
      lowerBand[i] = basicLower;
      direction[i] = 'UP';
      supertrend[i] = lowerBand[i];
    } else {
      // Upper band ratchet
      upperBand[i] = basicUpper < upperBand[i - 1] || closes[i - 1] > upperBand[i - 1] ? basicUpper : upperBand[i - 1];
      // Lower band ratchet
      lowerBand[i] = basicLower > lowerBand[i - 1] || closes[i - 1] < lowerBand[i - 1] ? basicLower : lowerBand[i - 1];

      if (direction[i - 1] === 'UP') {
        if (closes[i] < lowerBand[i]) {
          direction[i] = 'DOWN';
          supertrend[i] = upperBand[i];
        } else {
          direction[i] = 'UP';
          supertrend[i] = lowerBand[i];
        }
      } else {
        if (closes[i] > upperBand[i]) {
          direction[i] = 'UP';
          supertrend[i] = lowerBand[i];
        } else {
          direction[i] = 'DOWN';
          supertrend[i] = upperBand[i];
        }
      }
    }
  }

  return { supertrend, direction };
}

/**
 * Calculate Bollinger Bands (20, 2)
 */
export function calculateBollingerBands(closes: number[], period: number = 20, multiplier: number = 2) {
  const upper: number[] = new Array(closes.length).fill(0);
  const lower: number[] = new Array(closes.length).fill(0);
  const middle: number[] = new Array(closes.length).fill(0);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle[i] = closes[i];
      upper[i] = closes[i];
      lower[i] = closes[i];
      continue;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, v) => acc + v, 0) / period;
    const variance = slice.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle[i] = mean;
    upper[i] = mean + multiplier * stdDev;
    lower[i] = mean - multiplier * stdDev;
  }

  return { upper, lower, middle };
}

/**
 * Calculate Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): number[] {
  let cumVol = 0;
  let cumTypicalVol = 0;
  const vwapValues: number[] = new Array(closes.length).fill(0);

  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    const vol = Math.max(1, volumes[i]);
    cumVol += vol;
    cumTypicalVol += typicalPrice * vol;
    vwapValues[i] = Number((cumTypicalVol / cumVol).toFixed(2));
  }
  return vwapValues;
}

/**
 * Enrich raw candles with full technical indicators
 * Ported from and substantially enhancing trader/indicators.py
 */
export function enrichCandlesWithIndicators(rawCandles: Candle[]): Candle[] {
  if (!rawCandles || rawCandles.length === 0) return [];

  const closes = rawCandles.map((c) => c.close);
  const highs = rawCandles.map((c) => c.high);
  const lows = rawCandles.map((c) => c.low);
  const volumes = rawCandles.map((c) => c.volume);

  const ema9 = calculateEMA(closes, 9);
  const ema15 = calculateEMA(closes, 15);
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);

  const rsi14 = calculateRSI(closes, 14);
  const atr14 = calculateATR(highs, lows, closes, 14);
  const { supertrend, direction: supertrendDir } = calculateSupertrend(highs, lows, closes, atr14, 3);
  const { upper: bbUpper, lower: bbLower, middle: bbMiddle } = calculateBollingerBands(closes, 20, 2);

  // MACD (12, 26, 9)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((val, idx) => val - ema26[idx]);
  const macdSignal = calculateEMA(macdLine, 9);
  const macdHist = macdLine.map((val, idx) => val - macdSignal[idx]);

  // Volume Moving Average
  const volumeMA = calculateEMA(volumes, 20);

  // Cumulative VWAP (Typical Price * Volume / Cumulative Volume)
  const vwapValues = calculateVWAP(highs, lows, closes, volumes);



  return rawCandles.map((c, i) => ({
    ...c,
    ema9: Number(ema9[i]?.toFixed(2)),
    ema15: Number(ema15[i]?.toFixed(2)),
    ema20: Number(ema20[i]?.toFixed(2)),
    ema50: Number(ema50[i]?.toFixed(2)),
    vwap: Number(vwapValues[i]?.toFixed(2)),
    rsi14: Number(rsi14[i]?.toFixed(2)),
    macd: Number(macdLine[i]?.toFixed(2)),
    macdSignal: Number(macdSignal[i]?.toFixed(2)),
    macdHist: Number(macdHist[i]?.toFixed(2)),
    atr14: Number(atr14[i]?.toFixed(2)),
    supertrend: Number(supertrend[i]?.toFixed(2)),
    supertrendDir: supertrendDir[i],
    bbUpper: Number(bbUpper[i]?.toFixed(2)),
    bbLower: Number(bbLower[i]?.toFixed(2)),
    bbMiddle: Number(bbMiddle[i]?.toFixed(2)),
    volumeMA: Number(volumeMA[i]?.toFixed(0)),
  }));
}
