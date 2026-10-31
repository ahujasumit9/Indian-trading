import { Candle, MarketIndex, OptionChainData, VolumeProfileData } from '../../types/market';
import { AISignal, MarketRegimeType, ScoreComponent, SignalType } from '../../types/signals';
import { getDefaultLotSize, getStrikeStep } from './optionsEngine';

/**
 * Detects Market Regime from Price Action, ATR, and Bollinger Bands
 */
export function detectMarketRegime(candles: Candle[], indiaVix: number = 14.5): MarketRegimeType {
  if (candles.length < 5) return 'Sideways / Consolidation';

  const last = candles[candles.length - 1];
  const prev5 = candles[Math.max(0, candles.length - 6)];

  const priceChangePct = ((last.close - prev5.close) / prev5.close) * 100;
  const isSupertrendUp = last.supertrendDir === 'UP';
  const isAboveEma50 = last.ema50 ? last.close > last.ema50 : true;

  if (indiaVix >= 20) {
    return 'High Volatility Expansion';
  }

  if (last.bbUpper && last.bbLower) {
    const bandwidth = ((last.bbUpper - last.bbLower) / last.close) * 100;
    if (bandwidth < 0.8) {
      return 'Low Volatility Squeeze';
    }
  }

  if (priceChangePct > 0.6 && isSupertrendUp && isAboveEma50 && last.close > (last.vwap || last.close)) {
    return 'Strong Bullish Trend';
  }

  if (priceChangePct < -0.6 && !isSupertrendUp && !isAboveEma50 && last.close < (last.vwap || last.close)) {
    return 'Strong Bearish Trend';
  }

  if (Math.abs(priceChangePct) > 0.4) {
    return 'Breakout Environment';
  }

  return 'Sideways / Consolidation';
}

/**
 * 0 to 100 Explainable Quantitative Scoring Engine
 * Combines Technicals, Volume Profile, Options Open Interest, and Greeks
 */
export function generateAISignal(
  index: MarketIndex,
  candles: Candle[],
  optionChain: OptionChainData,
  volumeProfile: VolumeProfileData,
  indiaVix: number = 14.5
): AISignal {
  if (!candles || candles.length === 0) {
    return createEmptySignal(index);
  }

  const last = candles[candles.length - 1];
  const spot = last.close;
  const regime = detectMarketRegime(candles, indiaVix);

  const supportingEvidence: string[] = [];
  const contradictoryEvidence: string[] = [];
  const components: ScoreComponent[] = [];

  // ==========================================
  // 1. TREND PILLAR (Max 25 pts)
  // ==========================================
  let trendScore = 0;

  // EMA 15 vs EMA 20 (Core filter)
  if (last.ema15 && last.ema20) {
    if (last.ema15 > last.ema20) {
      trendScore += 9;
      supportingEvidence.push('EMA15 > EMA20 confirms bullish short-term moving average alignment');
      components.push({
        name: 'EMA 15/20 Crossover',
        category: 'Trend',
        maxPoints: 9,
        score: 9,
        detail: `EMA15 (${last.ema15}) is trending above EMA20 (${last.ema20})`,
      });
    } else {
      contradictoryEvidence.push('EMA15 < EMA20 indicates bearish moving average alignment');
      components.push({
        name: 'EMA 15/20 Crossover',
        category: 'Trend',
        maxPoints: 9,
        score: 1,
        detail: `EMA15 (${last.ema15}) is trailing below EMA20 (${last.ema20})`,
      });
    }
  }

  // Price vs VWAP
  if (last.vwap) {
    if (last.close > last.vwap) {
      trendScore += 8;
      supportingEvidence.push('Price is trading above intraday institutional VWAP');
      components.push({
        name: 'VWAP Positioning',
        category: 'Trend',
        maxPoints: 8,
        score: 8,
        detail: `Close ${last.close} > VWAP ${last.vwap} demonstrates institutional buyer acceptance`,
      });
    } else {
      contradictoryEvidence.push('Price is below intraday VWAP, indicating seller control');
      components.push({
        name: 'VWAP Positioning',
        category: 'Trend',
        maxPoints: 8,
        score: 2,
        detail: `Close ${last.close} < VWAP ${last.vwap} reflects intraday supply overhead`,
      });
    }
  }

  // Multi-period EMA 50 & 9 Alignment
  if (last.ema9 && last.ema50) {
    if (last.close > last.ema50 && last.ema9 > last.ema50) {
      trendScore += 8;
      supportingEvidence.push('Higher timeframe EMA50 cushion supports continuation');
      components.push({
        name: 'EMA 50 Regime',
        category: 'Trend',
        maxPoints: 8,
        score: 8,
        detail: 'Price & fast EMA9 are well above baseline EMA50',
      });
    } else {
      components.push({
        name: 'EMA 50 Regime',
        category: 'Trend',
        maxPoints: 8,
        score: 2,
        detail: 'Price hovering below or near EMA50 baseline',
      });
    }
  }

  // ==========================================
  // 2. MOMENTUM PILLAR (Max 15 pts)
  // ==========================================
  let momentumScore = 0;

  // RSI 14
  if (last.rsi14 !== undefined) {
    if (last.rsi14 >= 55 && last.rsi14 <= 68) {
      momentumScore += 6;
      supportingEvidence.push(`RSI 14 at ${last.rsi14} in strong expansion zone (healthy bull momentum)`);
      components.push({
        name: 'RSI 14 Zone',
        category: 'Momentum',
        maxPoints: 6,
        score: 6,
        detail: `RSI ${last.rsi14} supports continuation without exhaustion`,
      });
    } else if (last.rsi14 > 72) {
      contradictoryEvidence.push(`RSI 14 at ${last.rsi14} is in overbought zone (>70), caution on long entries`);
      components.push({
        name: 'RSI 14 Zone',
        category: 'Momentum',
        maxPoints: 6,
        score: 2,
        detail: `Overbought RSI ${last.rsi14} increases risk of pullback`,
      });
    } else if (last.rsi14 <= 42) {
      components.push({
        name: 'RSI 14 Zone',
        category: 'Momentum',
        maxPoints: 6,
        score: 1,
        detail: `RSI ${last.rsi14} shows dominant selling pressure`,
      });
    } else {
      momentumScore += 3;
      components.push({
        name: 'RSI 14 Zone',
        category: 'Momentum',
        maxPoints: 6,
        score: 3,
        detail: `RSI ${last.rsi14} is neutral`,
      });
    }
  }

  // MACD Crossover
  if (last.macd !== undefined && last.macdSignal !== undefined) {
    if (last.macd > last.macdSignal && (last.macdHist || 0) > 0) {
      momentumScore += 5;
      supportingEvidence.push('MACD line above Signal with expanding positive histogram');
      components.push({
        name: 'MACD Momentum',
        category: 'Momentum',
        maxPoints: 5,
        score: 5,
        detail: `MACD (${last.macd}) > Signal (${last.macdSignal})`,
      });
    } else {
      contradictoryEvidence.push('MACD line below signal or showing negative histogram divergence');
      components.push({
        name: 'MACD Momentum',
        category: 'Momentum',
        maxPoints: 5,
        score: 1,
        detail: `MACD (${last.macd}) <= Signal (${last.macdSignal})`,
      });
    }
  }

  // Supertrend (10, 3)
  if (last.supertrendDir === 'UP') {
    momentumScore += 4;
    supportingEvidence.push('Supertrend (10, 3) is GREEN trailing below price');
    components.push({
      name: 'Supertrend Status',
      category: 'Momentum',
      maxPoints: 4,
      score: 4,
      detail: `Supertrend level ${last.supertrend} provides dynamic trailing support`,
    });
  } else {
    contradictoryEvidence.push('Supertrend (10, 3) is RED, indicating active downtrend');
    components.push({
      name: 'Supertrend Status',
      category: 'Momentum',
      maxPoints: 4,
      score: 0,
      detail: `Supertrend level ${last.supertrend} overhead resistance`,
    });
  }

  // ==========================================
  // 3. VOLUME & VOLUME PROFILE PILLAR (Max 20 pts)
  // ==========================================
  let volumeScore = 0;

  // Volume vs Volume MA
  if (last.volumeMA && last.volume) {
    if (last.volume > last.volumeMA * 1.25) {
      volumeScore += 8;
      supportingEvidence.push(`Surge volume: ${last.volume.toLocaleString('en-IN')} vs 20-MA ${last.volumeMA.toLocaleString('en-IN')}`);
      components.push({
        name: 'Volume Expansion',
        category: 'Volume',
        maxPoints: 8,
        score: 8,
        detail: 'Volume > 1.25x 20-candle moving average',
      });
    } else if (last.volume > last.volumeMA) {
      volumeScore += 5;
      components.push({
        name: 'Volume Expansion',
        category: 'Volume',
        maxPoints: 8,
        score: 5,
        detail: 'Volume above average',
      });
    } else {
      contradictoryEvidence.push('Below-average trading volume on current candle; breakout lack of conviction');
      components.push({
        name: 'Volume Expansion',
        category: 'Volume',
        maxPoints: 8,
        score: 2,
        detail: 'Volume below 20-period moving average',
      });
    }
  }

  // Volume Profile POC & Value Area
  if (volumeProfile.poc > 0) {
    if (last.close > volumeProfile.poc) {
      volumeScore += 7;
      supportingEvidence.push(`Trading above Point of Control (POC: ${volumeProfile.poc})`);
      components.push({
        name: 'POC Acceptance',
        category: 'Volume',
        maxPoints: 7,
        score: 7,
        detail: `Price cleared high-volume node ${volumeProfile.poc}`,
      });
    } else {
      contradictoryEvidence.push(`Trading below POC (${volumeProfile.poc}), heavy institutional volume resistance`);
      components.push({
        name: 'POC Acceptance',
        category: 'Volume',
        maxPoints: 7,
        score: 2,
        detail: `Price trapped below POC ${volumeProfile.poc}`,
      });
    }

    if (volumeProfile.acceptanceStatus === 'ACCEPTED') {
      volumeScore += 5;
      supportingEvidence.push('Volume profile confirms breakout acceptance outside Value Area');
      components.push({
        name: 'Value Area Status',
        category: 'Volume',
        maxPoints: 5,
        score: 5,
        detail: `Sustained outside Value Area (VAH: ${volumeProfile.vah}, VAL: ${volumeProfile.val})`,
      });
    } else {
      components.push({
        name: 'Value Area Status',
        category: 'Volume',
        maxPoints: 5,
        score: 2,
        detail: 'Testing internal Value Area range',
      });
    }
  }

  // ==========================================
  // 4. OPTIONS OI & POSITIONING (Max 25 pts)
  // ==========================================
  let oiScore = 0;

  // PCR (Put-Call Ratio)
  const pcr = optionChain.pcr;
  if (pcr >= 1.15) {
    oiScore += 10;
    supportingEvidence.push(`Bullish PCR at ${pcr.toFixed(3)}: Aggressive Put writing indicates strong floor`);
    components.push({
      name: 'Put-Call Ratio (PCR)',
      category: 'Options OI',
      maxPoints: 10,
      score: 10,
      detail: `PCR ${pcr.toFixed(3)} demonstrates institutional put writer dominance`,
    });
  } else if (pcr >= 0.95 && pcr < 1.15) {
    oiScore += 6;
    components.push({
      name: 'Put-Call Ratio (PCR)',
      category: 'Options OI',
      maxPoints: 10,
      score: 6,
      detail: `PCR ${pcr.toFixed(3)} is balanced / slightly constructive`,
    });
  } else if (pcr < 0.75) {
    contradictoryEvidence.push(`Bearish PCR at ${pcr.toFixed(3)}: Heavy call writing resistance overhead`);
    components.push({
      name: 'Put-Call Ratio (PCR)',
      category: 'Options OI',
      maxPoints: 10,
      score: 1,
      detail: `PCR ${pcr.toFixed(3)} highlights severe call overhead supply`,
    });
  } else {
    oiScore += 3;
    components.push({
      name: 'Put-Call Ratio (PCR)',
      category: 'Options OI',
      maxPoints: 10,
      score: 3,
      detail: `PCR ${pcr.toFixed(3)} in neutral zone`,
    });
  }

  // Max Pain Pull
  if (optionChain.maxPain > 0) {
    if (spot < optionChain.maxPain) {
      oiScore += 8;
      supportingEvidence.push(`Spot (${spot.toFixed(0)}) is below Max Pain strike (${optionChain.maxPain}), upward gravitational pull expected`);
      components.push({
        name: 'Max Pain Positioning',
        category: 'Options OI',
        maxPoints: 8,
        score: 8,
        detail: `Max Pain strike is higher at ${optionChain.maxPain}`,
      });
    } else {
      components.push({
        name: 'Max Pain Positioning',
        category: 'Options OI',
        maxPoints: 8,
        score: 3,
        detail: `Spot above Max Pain ${optionChain.maxPain}`,
      });
    }
  }

  // ATM Option Buildup
  const atmStrike = optionChain.atmStrike;
  const atmObj = optionChain.strikes.find((s) => s.strike === atmStrike);
  if (atmObj) {
    if (atmObj.ce.buildup === 'Long Buildup' || atmObj.pe.buildup === 'Short Buildup') {
      oiScore += 7;
      supportingEvidence.push(`ATM Strike ${atmStrike}: CE Long Buildup & PE Short Buildup detected`);
      components.push({
        name: 'ATM OI Buildup',
        category: 'Options OI',
        maxPoints: 7,
        score: 7,
        detail: 'Institutional CE buying and PE writing confirmed',
      });
    } else if (atmObj.ce.buildup === 'Short Buildup') {
      contradictoryEvidence.push(`ATM Strike ${atmStrike}: Active CE Short Buildup (Call writers blocking upside)`);
      components.push({
        name: 'ATM OI Buildup',
        category: 'Options OI',
        maxPoints: 7,
        score: 1,
        detail: 'Call writers defending ATM strike',
      });
    } else {
      oiScore += 3;
      components.push({
        name: 'ATM OI Buildup',
        category: 'Options OI',
        maxPoints: 7,
        score: 3,
        detail: 'Mixed or neutral buildup at ATM',
      });
    }
  }

  // ==========================================
  // 5. IV & GREEKS LIQUIDITY (Max 15 pts)
  // ==========================================
  let greeksScore = 0;

  // India VIX stability
  if (indiaVix < 16) {
    greeksScore += 6;
    supportingEvidence.push(`India VIX at ${indiaVix.toFixed(2)} is low to moderate, favorable premium decay risk`);
    components.push({
      name: 'India VIX Regime',
      category: 'IV & Greeks',
      maxPoints: 6,
      score: 6,
      detail: `VIX ${indiaVix.toFixed(2)} maintains stable implied volatility environment`,
    });
  } else if (indiaVix > 21) {
    contradictoryEvidence.push(`India VIX at ${indiaVix.toFixed(2)} is elevated; rapid IV crush hazard on reversals`);
    components.push({
      name: 'India VIX Regime',
      category: 'IV & Greeks',
      maxPoints: 6,
      score: 1,
      detail: `Elevated VIX ${indiaVix.toFixed(2)} carries severe Vega contraction hazard`,
    });
  } else {
    greeksScore += 4;
    components.push({
      name: 'India VIX Regime',
      category: 'IV & Greeks',
      maxPoints: 6,
      score: 4,
      detail: `VIX ${indiaVix.toFixed(2)} is standard`,
    });
  }

  // Delta & Spread Quality
  if (atmObj) {
    const ceDelta = atmObj.ce.greeks?.delta || 0.5;
    const spread = atmObj.ce.spread;
    if (spread <= 1.0) {
      greeksScore += 5;
      components.push({
        name: 'Execution Liquidity',
        category: 'IV & Greeks',
        maxPoints: 5,
        score: 5,
        detail: `Tight bid-ask spread (₹${spread.toFixed(2)}) minimizes entry slippage`,
      });
    } else {
      components.push({
        name: 'Execution Liquidity',
        category: 'IV & Greeks',
        maxPoints: 5,
        score: 2,
        detail: `Wider spread (₹${spread.toFixed(2)})`,
      });
    }

    if (ceDelta >= 0.45 && ceDelta <= 0.6) {
      greeksScore += 4;
      components.push({
        name: 'ATM Delta Sensitivity',
        category: 'IV & Greeks',
        maxPoints: 4,
        score: 4,
        detail: `Clean ATM Delta (${ceDelta.toFixed(2)}) for directional option participation`,
      });
    } else {
      greeksScore += 2;
      components.push({
        name: 'ATM Delta Sensitivity',
        category: 'IV & Greeks',
        maxPoints: 4,
        score: 2,
        detail: `Delta ${ceDelta.toFixed(2)}`,
      });
    }
  }

  // ==========================================
  // TOTAL SCORE & SIGNAL CLASSIFICATION
  // ==========================================
  const totalScore = Math.min(100, Math.max(0, trendScore + momentumScore + volumeScore + oiScore + greeksScore));

  let type: SignalType = 'WAIT';
  let targetOptionType: 'CE' | 'PE' = 'CE';

  if (totalScore >= 75) {
    type = 'BUY CE';
    targetOptionType = 'CE';
  } else if (totalScore <= 35) {
    type = 'BUY PE';
    targetOptionType = 'PE';
  } else if (totalScore >= 55 && totalScore < 75) {
    type = 'WAIT';
  } else {
    type = 'NO TRADE';
  }

  // Strike selection: Slightly ITM or exact ATM
  const step = getStrikeStep(index);
  const selectedStrike = targetOptionType === 'CE' ? optionChain.atmStrike : optionChain.atmStrike + step;

  const selectedStrikeData = optionChain.strikes.find((s) => s.strike === selectedStrike) || atmObj;
  const currentOptionLtp = targetOptionType === 'CE' ? selectedStrikeData?.ce.ltp || 120 : selectedStrikeData?.pe.ltp || 120;

  // Dynamic Stop Loss & Targets based on ATR
  const atr = last.atr14 || (spot * 0.0035);
  const optionDelta = 0.52;
  const estimatedStopPoints = Math.max(12, Number((atr * optionDelta * 0.9).toFixed(1)));
  const stopLoss = Math.max(0.5, Number((currentOptionLtp - estimatedStopPoints).toFixed(1)));
  const target1 = Number((currentOptionLtp + estimatedStopPoints * 1.5).toFixed(1));
  const target2 = Number((currentOptionLtp + estimatedStopPoints * 2.5).toFixed(1));

  const riskRewardRatio = Number(((target1 - currentOptionLtp) / Math.max(1, currentOptionLtp - stopLoss)).toFixed(2));
  const lotSize = getDefaultLotSize(index);
  const estimatedRiskPerLot = Number(((currentOptionLtp - stopLoss) * lotSize).toFixed(0));

  const confidence = Math.round(Math.abs(totalScore - 50) * 1.9);
  const uncertainty = 100 - confidence;

  return {
    id: `sig_${Date.now()}`,
    index,
    type,
    score: totalScore,
    regime,
    confidence: Math.min(95, Math.max(30, confidence)),
    uncertainty: Math.max(5, Math.min(70, uncertainty)),
    strike: selectedStrike,
    optionType: targetOptionType,
    expiry: optionChain.expiryDate,
    spotPrice: spot,
    suggestedEntry: {
      min: Number((currentOptionLtp * 0.98).toFixed(1)),
      max: Number((currentOptionLtp * 1.02).toFixed(1)),
      current: currentOptionLtp,
    },
    stopLoss,
    target1,
    target2,
    riskRewardRatio,
    estimatedRiskPerLot,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    dataSource: optionChain.dataSource,
    breakdown: {
      trendScore,
      momentumScore,
      volumeScore,
      oiScore,
      greeksScore,
      components,
    },
    supportingEvidence,
    contradictoryEvidence,
    strategyName: totalScore >= 75 ? 'EMA 15/20 + VWAP Breakout' : totalScore <= 35 ? 'VAH Rejection & Short Buildup' : 'Neutral Range Consolidation',
  };
}

function createEmptySignal(index: MarketIndex): AISignal {
  return {
    id: `sig_${Date.now()}`,
    index,
    type: 'NO TRADE',
    score: 50,
    regime: 'Sideways / Consolidation',
    confidence: 0,
    uncertainty: 100,
    strike: index === 'NIFTY' ? 24000 : 79000,
    optionType: 'CE',
    expiry: '2026-11-05',
    spotPrice: index === 'NIFTY' ? 24000 : 79000,
    suggestedEntry: { min: 100, max: 105, current: 102 },
    stopLoss: 80,
    target1: 135,
    target2: 165,
    riskRewardRatio: 1.5,
    estimatedRiskPerLot: 1100,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    dataSource: 'NONE',
    breakdown: {
      trendScore: 0,
      momentumScore: 0,
      volumeScore: 0,
      oiScore: 0,
      greeksScore: 0,
      components: [],
    },
    supportingEvidence: ['Awaiting market data upload or feed initialization'],
    contradictoryEvidence: ['No valid market candles loaded'],
    strategyName: 'None',
  };
}
