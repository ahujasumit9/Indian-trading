import { Candle, MarketIndex, OptionChainData, VolumeProfileData } from '../../types/market';
import { enrichCandlesWithIndicators } from '../math/technicals';
import { calculateVolumeProfile } from '../math/volumeProfile';
import { buildSyntheticOptionChain } from '../engine/optionsEngine';
import { generateAISignal } from '../engine/signalEngine';
import { AISignal } from '../../types/signals';

export interface MarketSnapshot {
  index: MarketIndex;
  spotPrice: number;
  priceChange: number;
  priceChangePct: number;
  dayHigh: number;
  dayLow: number;
  dayOpen: number;
  candles: Candle[];
  optionChain: OptionChainData;
  volumeProfile: VolumeProfileData;
  aiSignal: AISignal;
  indiaVix: number;
  vixChange: number;
  lastTickTime: string;
}

/**
 * Creates an initial state for either NIFTY or SENSEX
 */
export function createInitialMarketSnapshot(
  index: MarketIndex,
  initialCandles: Candle[],
  baseVix: number = 14.25
): MarketSnapshot {
  const lastCandle = initialCandles[initialCandles.length - 1];
  const spotPrice = lastCandle.close;
  const dayOpen = initialCandles[0].open;
  const priceChange = spotPrice - dayOpen;
  const priceChangePct = (priceChange / dayOpen) * 100;

  let dayHigh = -Infinity;
  let dayLow = Infinity;
  for (const c of initialCandles) {
    if (c.high > dayHigh) dayHigh = c.high;
    if (c.low < dayLow) dayLow = c.low;
  }

  const volumeProfile = calculateVolumeProfile(initialCandles, 24);
  const optionChain = buildSyntheticOptionChain(index, spotPrice, baseVix, 3.5, 'SIMULATED DATA (DEMO MODE)');
  const aiSignal = generateAISignal(index, initialCandles, optionChain, volumeProfile, baseVix);

  return {
    index,
    spotPrice: Number(spotPrice.toFixed(2)),
    priceChange: Number(priceChange.toFixed(2)),
    priceChangePct: Number(priceChangePct.toFixed(2)),
    dayHigh: Number(dayHigh.toFixed(2)),
    dayLow: Number(dayLow.toFixed(2)),
    dayOpen: Number(dayOpen.toFixed(2)),
    candles: initialCandles,
    optionChain,
    volumeProfile,
    aiSignal,
    indiaVix: baseVix,
    vixChange: -0.15,
    lastTickTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
  };
}

/**
 * Advances the market state by one realistic simulated tick (e.g. every 2-3 seconds)
 */
export function advanceMarketTick(
  prevSnapshot: MarketSnapshot,
  tickVolatility: number = 0.8
): MarketSnapshot {
  const { index, candles, dayOpen, indiaVix } = prevSnapshot;
  const lastIdx = candles.length - 1;
  const lastCandle = candles[lastIdx];

  // Random realistic price delta (Brownian motion with slight momentum persistence)
  const maxMove = index === 'NIFTY' ? 3.5 : 9.5;
  const delta = (Math.random() - 0.49) * maxMove * tickVolatility;
  const newClose = Number((lastCandle.close + delta).toFixed(2));
  const newHigh = Math.max(lastCandle.high, newClose);
  const newLow = Math.min(lastCandle.low, newClose);
  const addedVol = Math.round(50 + Math.random() * 250);
  const newVol = lastCandle.volume + addedVol;

  const updatedCandles = [...candles];
  updatedCandles[lastIdx] = {
    ...lastCandle,
    close: newClose,
    high: newHigh,
    low: newLow,
    volume: newVol,
  };

  const enrichedCandles = enrichCandlesWithIndicators(updatedCandles);
  const spotPrice = newClose;
  const priceChange = spotPrice - dayOpen;
  const priceChangePct = (priceChange / dayOpen) * 100;

  const dayHigh = Math.max(prevSnapshot.dayHigh, newClose);
  const dayLow = Math.min(prevSnapshot.dayLow, newClose);

  // Slight VIX inverse correlation
  const vixMove = delta > 0 ? -0.02 * Math.random() : 0.02 * Math.random();
  const newVix = Number(Math.max(10, Math.min(30, indiaVix + vixMove)).toFixed(2));

  const volumeProfile = calculateVolumeProfile(enrichedCandles, 24);
  const optionChain = buildSyntheticOptionChain(index, spotPrice, newVix, 3.5, 'SIMULATED DATA (DEMO MODE)');
  const aiSignal = generateAISignal(index, enrichedCandles, optionChain, volumeProfile, newVix);

  return {
    index,
    spotPrice,
    priceChange: Number(priceChange.toFixed(2)),
    priceChangePct: Number(priceChangePct.toFixed(2)),
    dayHigh: Number(dayHigh.toFixed(2)),
    dayLow: Number(dayLow.toFixed(2)),
    dayOpen,
    candles: enrichedCandles,
    optionChain,
    volumeProfile,
    aiSignal,
    indiaVix: newVix,
    vixChange: Number((newVix - 14.25).toFixed(2)),
    lastTickTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
  };
}
