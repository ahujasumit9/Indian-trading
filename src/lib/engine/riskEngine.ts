import { RiskSettings, RiskValidationResult } from '../../types/trade';

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  accountCapital: 100000, // ₹1,00,000 standard starter capital
  maxRiskPerTradePercent: 1.5, // 1.5% max risk per trade (₹1,500)
  maxDailyLoss: 4500, // ₹4,500 daily loss circuit breaker
  maxOpenPositions: 3,
  maxLotsPerTrade: {
    NIFTY: 6, // 6 lots (300 qty)
    SENSEX: 10, // 10 lots (200 qty)
  },
  lotSizes: {
    NIFTY: 50,
    SENSEX: 20,
  },
  maxConsecutiveLosses: 3,
  expiryDayRiskTightening: true,
  killSwitchActive: false,
  minRiskRewardRatio: 1.25,
};

export interface ValidateTradeParams {
  capital: number;
  riskPct: number;
  entry: number;
  stop: number;
  quantity: number;
  lotSize: number;
  maxLots?: number;
  currentSpread?: number;
  isExpiryDay?: boolean;
  killSwitchActive?: boolean;
  dailyAccumulatedLoss?: number;
  maxDailyLoss?: number;
}

/**
 * Validates proposed trade against institutional risk rules
 * Ported from and substantially hardened beyond trader/risk.py
 */
export function validateTrade({
  capital,
  riskPct,
  entry,
  stop,
  quantity,
  lotSize = 50,
  maxLots,
  currentSpread = 0.5,
  isExpiryDay = false,
  killSwitchActive = false,
  dailyAccumulatedLoss = 0,
  maxDailyLoss = 4500,
}: ValidateTradeParams): RiskValidationResult {
  const reasons: string[] = [];
  let status: 'PASS' | 'BLOCK' | 'WARNING' = 'PASS';

  if (killSwitchActive) {
    reasons.push('CRITICAL: Emergency Kill Switch is ACTIVE. All new orders are strictly blocked.');
    status = 'BLOCK';
  }

  if (dailyAccumulatedLoss >= maxDailyLoss) {
    reasons.push(`DAILY LOSS LIMIT BREACHED: Today's loss of ₹${dailyAccumulatedLoss.toLocaleString('en-IN')} has reached maximum allowed daily cap ₹${maxDailyLoss.toLocaleString('en-IN')}. Trading paused.`);
    status = 'BLOCK';
  }

  if (minPositive(capital, riskPct, entry, stop, quantity, lotSize) <= 0) {
    reasons.push('All numeric inputs (capital, risk %, entry, stop, quantity, lot size) must be positive numbers.');
    status = 'BLOCK';
  }

  if (Math.abs(entry - stop) < 0.05) {
    reasons.push('Entry price and stop-loss cannot be identical.');
    status = 'BLOCK';
  }

  const riskPerUnit = Math.abs(entry - stop);
  const totalRisk = riskPerUnit * quantity;
  const allowedRisk = (capital * riskPct) / 100;

  if (totalRisk > allowedRisk) {
    reasons.push(
      `Estimated trade risk of ₹${totalRisk.toLocaleString('en-IN', { maximumFractionDigits: 2 })} exceeds your configured maximum risk of ₹${allowedRisk.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (${riskPct}% of capital).`
    );
    status = 'BLOCK';
  }

  if (quantity % lotSize !== 0) {
    reasons.push(`Quantity (${quantity}) must be an exact multiple of the exchange lot size (${lotSize}).`);
    status = 'BLOCK';
  }

  const numLots = Math.floor(quantity / lotSize);
  if (maxLots !== undefined && numLots > maxLots) {
    reasons.push(`Quantity (${numLots} lots) exceeds your configured limit of ${maxLots} lots per order.`);
    status = 'BLOCK';
  }

  // Bid-Ask Spread check
  if (currentSpread > 3.0) {
    reasons.push(`High bid-ask spread (₹${currentSpread.toFixed(2)}) indicates poor strike liquidity and high entry slippage.`);
    if (status !== 'BLOCK') status = 'WARNING';
  }

  // Expiry day risk alert
  if (isExpiryDay) {
    reasons.push('EXPIRY DAY NOTICE: Rapid theta decay and gamma spikes active. Position sizing should be halved.');
    if (status !== 'BLOCK') status = 'WARNING';
  }

  const maxLotsAllowed = Math.max(1, Math.floor(allowedRisk / (riskPerUnit * lotSize)));
  const capitalAtRiskPercent = (totalRisk / capital) * 100;

  return {
    status,
    estimatedRisk: Number(totalRisk.toFixed(2)),
    allowedRisk: Number(allowedRisk.toFixed(2)),
    reasons,
    maxLotsAllowed,
    capitalAtRiskPercent: Number(capitalAtRiskPercent.toFixed(2)),
  };
}

function minPositive(...args: number[]): number {
  return Math.min(...args);
}

/**
 * Calculates estimated Indian statutory and broker transaction charges
 * Includes STT (0.0625% on sell side option premium or 0.125% exercised),
 * Exchange turnover charges (NSE 0.05% / BSE 0.005%), SEBI turnover fees, GST 18%, Stamp duty
 */
export function calculateIndianOptionCharges(
  premium: number,
  quantity: number,
  brokeragePerOrder: number = 20
): number {
  const turnover = premium * quantity;
  const brokerage = brokeragePerOrder;
  const stt = turnover * 0.000625; // STT on option premium turnover
  const exchangeTxn = turnover * 0.0005; // ~0.05%
  const sebiCharges = turnover * 0.000001;
  const stampDuty = turnover * 0.00003;
  const gst = (brokerage + exchangeTxn + sebiCharges) * 0.18;

  const total = brokerage + stt + exchangeTxn + sebiCharges + stampDuty + gst;
  return Number(total.toFixed(2));
}
