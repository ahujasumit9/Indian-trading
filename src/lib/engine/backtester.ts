import { Candle, MarketIndex } from '../../types/market';
import { calculateIndianOptionCharges } from './riskEngine';
import { getDefaultLotSize } from './optionsEngine';

export interface BacktestTrade {
  tradeId: string;
  entryDate: string;
  exitDate: string;
  index: MarketIndex;
  direction: 'LONG_CE' | 'LONG_PE';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  grossPnL: number;
  charges: number;
  netPnL: number;
  returnPct: number;
  exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT';
  holdingBars: number;
}

export interface BacktestResult {
  strategyName: string;
  index: MarketIndex;
  initialCapital: number;
  endingCapital: number;
  totalPnL: number;
  totalReturnPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  maxDrawdownINR: number;
  avgTradePnL: number;
  avgWin: number;
  avgLoss: number;
  riskRewardAchieved: number;
  equityCurve: { date: string; equity: number; drawdown: number }[];
  trades: BacktestTrade[];
}

export interface BacktestParams {
  candles: Candle[];
  index: MarketIndex;
  strategyId: string;
  initialCapital?: number;
  riskPerTradePct?: number;
  slippagePct?: number; // e.g. 0.3%
}

/**
 * Historical Backtester for Indian Index Options
 * Runs through historical candles sequentially to prevent look-ahead bias.
 */
export function runBacktest({
  candles,
  index,
  strategyId,
  initialCapital = 100000,
  riskPerTradePct = 1.5,
  slippagePct = 0.4,
}: BacktestParams): BacktestResult {
  if (candles.length < 25) {
    return createEmptyBacktest(index, initialCapital);
  }

  const lotSize = getDefaultLotSize(index);
  let currentCapital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdownINR = 0;
  let maxDrawdownPct = 0;

  const trades: BacktestTrade[] = [];
  const equityCurve: { date: string; equity: number; drawdown: number }[] = [];

  equityCurve.push({
    date: String(candles[0].timestamp),
    equity: initialCapital,
    drawdown: 0,
  });

  let inPosition = false;
  let currentTrade: {
    direction: 'LONG_CE' | 'LONG_PE';
    entryBar: number;
    entryDate: string;
    entryPrice: number;
    stopLoss: number;
    target: number;
    quantity: number;
  } | null = null;

  // Run bar-by-bar
  for (let i = 20; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];

    // 1. Manage open position
    if (inPosition && currentTrade) {
      const barsHeld = i - currentTrade.entryBar;
      let exitPrice: number | null = null;
      let exitReason: 'TARGET' | 'STOP_LOSS' | 'TIME_EXIT' | null = null;

      // Approximate option price movement from index points (Delta approx 0.5)
      const delta = 0.5;
      const indexMove = c.close - prev.close;
      const estimatedOptionLtp = Math.max(
        0.5,
        currentTrade.entryPrice + (currentTrade.direction === 'LONG_CE' ? indexMove * delta : -indexMove * delta)
      );

      // Check Target or Stop
      if (estimatedOptionLtp >= currentTrade.target) {
        exitPrice = currentTrade.target * (1 - slippagePct / 100);
        exitReason = 'TARGET';
      } else if (estimatedOptionLtp <= currentTrade.stopLoss) {
        exitPrice = currentTrade.stopLoss * (1 - slippagePct / 100);
        exitReason = 'STOP_LOSS';
      } else if (barsHeld >= 12) {
        // Time-based intraday exit after 12 bars (e.g., end of session)
        exitPrice = estimatedOptionLtp * (1 - slippagePct / 100);
        exitReason = 'TIME_EXIT';
      }

      if (exitPrice !== null && exitReason !== null) {
        const grossPnL = (exitPrice - currentTrade.entryPrice) * currentTrade.quantity;
        const charges = calculateIndianOptionCharges(currentTrade.entryPrice, currentTrade.quantity) +
          calculateIndianOptionCharges(exitPrice, currentTrade.quantity);
        const netPnL = grossPnL - charges;

        currentCapital += netPnL;
        if (currentCapital > peakCapital) peakCapital = currentCapital;
        const currentDrawdown = peakCapital - currentCapital;
        const currentDrawdownPct = (currentDrawdown / peakCapital) * 100;

        if (currentDrawdown > maxDrawdownINR) maxDrawdownINR = currentDrawdown;
        if (currentDrawdownPct > maxDrawdownPct) maxDrawdownPct = currentDrawdownPct;

        trades.push({
          tradeId: `bt_${trades.length + 1}`,
          entryDate: currentTrade.entryDate,
          exitDate: String(c.timestamp),
          index,
          direction: currentTrade.direction,
          entryPrice: Number(currentTrade.entryPrice.toFixed(2)),
          exitPrice: Number(exitPrice.toFixed(2)),
          quantity: currentTrade.quantity,
          grossPnL: Number(grossPnL.toFixed(2)),
          charges: Number(charges.toFixed(2)),
          netPnL: Number(netPnL.toFixed(2)),
          returnPct: Number(((netPnL / (currentTrade.entryPrice * currentTrade.quantity)) * 100).toFixed(2)),
          exitReason,
          holdingBars: barsHeld,
        });

        equityCurve.push({
          date: String(c.timestamp),
          equity: Number(currentCapital.toFixed(2)),
          drawdown: Number(currentDrawdownPct.toFixed(2)),
        });

        inPosition = false;
        currentTrade = null;
      }
      continue;
    }

    // 2. Evaluate Strategy Entry condition
    let signal: 'LONG_CE' | 'LONG_PE' | null = null;

    if (strategyId === 'strat_1' || strategyId === 'all') {
      // EMA 15/20 Crossover + VWAP
      const emaCrossUp = (prev.ema15 || 0) <= (prev.ema20 || 0) && (c.ema15 || 0) > (c.ema20 || 0);
      const emaCrossDown = (prev.ema15 || 0) >= (prev.ema20 || 0) && (c.ema15 || 0) < (c.ema20 || 0);

      if (emaCrossUp && c.close > (c.vwap || c.close)) {
        signal = 'LONG_CE';
      } else if (emaCrossDown && c.close < (c.vwap || c.close)) {
        signal = 'LONG_PE';
      }
    } else if (strategyId === 'strat_2') {
      // VWAP Breakout
      const brokeVwapUp = prev.close < (prev.vwap || 0) && c.close > (c.vwap || 0) && (c.volume || 0) > (c.volumeMA || 1) * 1.2;
      const brokeVwapDown = prev.close > (prev.vwap || 0) && c.close < (c.vwap || 0) && (c.volume || 0) > (c.volumeMA || 1) * 1.2;
      if (brokeVwapUp) signal = 'LONG_CE';
      if (brokeVwapDown) signal = 'LONG_PE';
    } else {
      // Trend continuation via Supertrend & EMA
      if (c.supertrendDir === 'UP' && c.close > (c.ema20 || 0) && (c.rsi14 || 50) > 55) {
        signal = 'LONG_CE';
      } else if (c.supertrendDir === 'DOWN' && c.close < (c.ema20 || 0) && (c.rsi14 || 50) < 45) {
        signal = 'LONG_PE';
      }
    }

    if (signal) {
      // Calculate realistic option premium & position sizing
      const estimatedOptionLtp = 110 * (1 + slippagePct / 100);
      const atr = c.atr14 || 60;
      const optionStopDelta = Math.max(15, atr * 0.45);
      const stopLoss = Math.max(5, estimatedOptionLtp - optionStopDelta);
      const target = estimatedOptionLtp + optionStopDelta * 1.7;

      const riskPerLot = (estimatedOptionLtp - stopLoss) * lotSize;
      const allowedRisk = (currentCapital * riskPerTradePct) / 100;
      const lots = Math.max(1, Math.min(6, Math.floor(allowedRisk / riskPerLot)));
      const quantity = lots * lotSize;

      inPosition = true;
      currentTrade = {
        direction: signal,
        entryBar: i,
        entryDate: String(c.timestamp),
        entryPrice: estimatedOptionLtp,
        stopLoss,
        target,
        quantity,
      };
    }
  }

  // Calculate summary metrics
  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.netPnL > 0).length;
  const losingTrades = trades.filter((t) => t.netPnL <= 0).length;
  const winRatePct = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;

  const totalWinsINR = trades.filter((t) => t.netPnL > 0).reduce((acc, t) => acc + t.netPnL, 0);
  const totalLossesINR = Math.abs(trades.filter((t) => t.netPnL <= 0).reduce((acc, t) => acc + t.netPnL, 0));
  const profitFactor = totalLossesINR > 0 ? Number((totalWinsINR / totalLossesINR).toFixed(2)) : totalWinsINR > 0 ? 99 : 0;

  const avgWin = winningTrades > 0 ? Number((totalWinsINR / winningTrades).toFixed(2)) : 0;
  const avgLoss = losingTrades > 0 ? Number((totalLossesINR / losingTrades).toFixed(2)) : 0;
  const avgTradePnL = totalTrades > 0 ? Number(((currentCapital - initialCapital) / totalTrades).toFixed(2)) : 0;
  const totalPnL = Number((currentCapital - initialCapital).toFixed(2));
  const totalReturnPct = Number(((totalPnL / initialCapital) * 100).toFixed(2));

  return {
    strategyName: strategyId === 'strat_1' ? 'EMA 15/20 + VWAP' : strategyId === 'strat_2' ? 'VWAP Breakout' : 'Trend Continuation',
    index,
    initialCapital,
    endingCapital: Number(currentCapital.toFixed(2)),
    totalPnL,
    totalReturnPct,
    totalTrades,
    winningTrades,
    losingTrades,
    winRatePct,
    profitFactor,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownINR: Number(maxDrawdownINR.toFixed(2)),
    avgTradePnL,
    avgWin,
    avgLoss,
    riskRewardAchieved: avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : 1.5,
    equityCurve,
    trades,
  };
}

function createEmptyBacktest(index: MarketIndex, capital: number): BacktestResult {
  return {
    strategyName: 'None',
    index,
    initialCapital: capital,
    endingCapital: capital,
    totalPnL: 0,
    totalReturnPct: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRatePct: 0,
    profitFactor: 0,
    maxDrawdownPct: 0,
    maxDrawdownINR: 0,
    avgTradePnL: 0,
    avgWin: 0,
    avgLoss: 0,
    riskRewardAchieved: 0,
    equityCurve: [{ date: '0', equity: capital, drawdown: 0 }],
    trades: [],
  };
}
