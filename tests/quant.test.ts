/**
 * Comprehensive Quantitative & Security Test Suite for INDIA AI TRADER
 * Validates:
 * 1. Black-Scholes Options Pricing & Greeks Engine
 * 2. Technical Indicators (EMA, VWAP, RSI, ATR, Supertrend)
 * 3. Volume Profile (POC, VAH, VAL, HVN/LVN)
 * 4. Dynamic Instrument Master (Strike Steps & Lot Sizes)
 * 5. Indian F&O Margin Calculator (SEBI SPAN + Exposure)
 * 6. Indian F&O Tax Engine (Section 43(5) & Section 44AB Turnover)
 * 7. Webhook Idempotency & Duplicate Protection Filter
 * 8. Cryptographic Ticket Fingerprinting & Approval Gate
 */

import { calculateBSPrice, calculateGreeks } from '../src/lib/math/blackScholes';
import { calculateEMA, calculateRSI, calculateVWAP, enrichCandlesWithIndicators } from '../src/lib/math/technicals';
import { calculateVolumeProfile } from '../src/lib/math/volumeProfile';
import { validateStrike, validateLotQuantity, calculateAtmStrike } from '../src/lib/data/instrumentMaster';
import { calculateFoMargin } from '../src/lib/engine/budgetEngine';
import { calculateIndianFoTax, TradeForTax } from '../src/lib/engine/taxEngine';
import { isDuplicatePayload } from '../src/server/security';
import { createTicketFingerprint } from '../src/lib/engine/approvalLedger';
import { Candle } from '../src/types/market';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetail?: any) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✘ FAIL:\x1b[0m ${testName}`);
    if (errorDetail) console.error('    Details:', errorDetail);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  INDIA AI TRADER – AUTOMATED TEST SUITE EXECUTION');
  console.log('======================================================\n');

  // --- 1. Black-Scholes Pricing & Greeks ---
  console.log('1. Black-Scholes Options Pricing & Greeks:');
  const callPrice = calculateBSPrice(24200, 24200, 5 / 365, 0.07, 0.15, 'CE');
  assert(callPrice > 50 && callPrice < 250, 'ATM Call price in realistic range (~100-150)', { callPrice });

  const putPrice = calculateBSPrice(24200, 24200, 5 / 365, 0.07, 0.15, 'PE');
  assert(putPrice > 50 && putPrice < 250, 'ATM Put price in realistic range (~100-150)', { putPrice });

  const greeks = calculateGreeks(24200, 24200, 5 / 365, 0.07, 0.15, 'CE');
  assert(greeks.delta >= 0.45 && greeks.delta <= 0.55, 'ATM Call Delta is approx 0.50', { delta: greeks.delta });
  assert(greeks.gamma > 0, 'Call Gamma is positive', { gamma: greeks.gamma });
  assert(greeks.theta < 0, 'Call Theta is negative (time decay)', { theta: greeks.theta });
  assert(greeks.vega > 0, 'Call Vega is positive', { vega: greeks.vega });


  // --- 2. Technical Indicators ---
  console.log('\n2. Technical Indicators Engine:');
  const samplePrices = [100, 102, 104, 103, 105, 108, 110, 112, 111, 115, 118, 120, 122, 125, 128, 130];
  const emaValues = calculateEMA(samplePrices, 5);
  assert(emaValues.length === samplePrices.length, 'EMA returns equal length array');
  assert(emaValues[emaValues.length - 1] > emaValues[0], 'EMA correctly captures upward trend');

  const rsiValues = calculateRSI(samplePrices, 14);
  assert(rsiValues.length === samplePrices.length, 'RSI returns equal length array');
  const lastRsi = rsiValues[rsiValues.length - 1];
  assert(lastRsi > 60 && lastRsi <= 100, 'Strong upward trend gives RSI > 60', { lastRsi });

  // --- 3. Volume Profile ---
  console.log('\n3. Institutional Volume Profile (POC, VAH, VAL):');
  const sampleCandles: Candle[] = [];
  for (let i = 0; i < 30; i++) {
    const base = 24000 + Math.sin(i / 3) * 50;
    sampleCandles.push({
      timestamp: Date.now() + i * 300000,
      open: base,
      high: base + 20,
      low: base - 20,
      close: base + 5,
      volume: 1000 + (i === 15 ? 10000 : 500), // High volume node in the middle
    });
  }
  const vp = calculateVolumeProfile(sampleCandles, 20);
  assert(vp.poc > 23900 && vp.poc < 24150, 'POC detected near peak volume distribution', { poc: vp.poc });
  assert(vp.vah >= vp.val, 'Value Area High >= Value Area Low', { vah: vp.vah, val: vp.val });
  assert(vp.levels.length > 0, 'Volume profile levels generated');

  // --- 4. Dynamic Instrument Master ---
  console.log('\n4. Dynamic Instrument Master (NSE / BSE Rules):');
  const niftyStrikeCheck = validateStrike('NIFTY', 24250);
  assert(niftyStrikeCheck.valid, 'NIFTY 24250 is a valid strike (step = 50)');

  const niftyInvalidStrike = validateStrike('NIFTY', 24233);
  assert(!niftyInvalidStrike.valid && niftyInvalidStrike.normalizedStrike === 24250, 'NIFTY 24233 rejected and normalized to 24250');

  const sensexStrikeCheck = validateStrike('SENSEX', 79800);
  assert(sensexStrikeCheck.valid, 'SENSEX 79800 is a valid strike (step = 100)');

  const niftyLotCheck = validateLotQuantity('NIFTY', 150); // 2 lots of 75
  assert(niftyLotCheck.valid && niftyLotCheck.lotCount === 2, 'NIFTY 150 qty validated as exactly 2 lots');

  const niftyInvalidLot = validateLotQuantity('NIFTY', 80);
  assert(!niftyInvalidLot.valid, 'NIFTY 80 qty rejected (not a multiple of 75)');

  // --- 5. Indian F&O Margin Engine ---
  console.log('\n5. Indian F&O Margin & Capital Allocation:');
  const buyMargin = calculateFoMargin('NIFTY', 24200, 150, 2, 'BUY');
  assert(buyMargin.totalMarginRequired === 150 * 2 * 75, 'Option Buyer requires 100% upfront premium (₹22,500)', { required: buyMargin.totalMarginRequired });

  const sellMargin = calculateFoMargin('NIFTY', 24200, 150, 2, 'SELL_NAKED');
  assert(sellMargin.totalMarginRequired > 300000, 'Naked Option Seller requires SPAN + Exposure (>₹3.0 Lakh)', { required: sellMargin.totalMarginRequired });

  const spreadMargin = calculateFoMargin('NIFTY', 24200, 150, 2, 'HEDGED_SPREAD');
  assert(spreadMargin.totalMarginRequired < sellMargin.totalMarginRequired * 0.4, 'Hedged spread receives ~70% margin reduction', { required: spreadMargin.totalMarginRequired });

  // --- 6. Indian F&O Tax Engine ---
  console.log('\n6. Indian F&O Tax Engine (Section 43(5) & Section 44AB):');
  const sampleTaxTrades: TradeForTax[] = [
    { id: '1', ticker: 'NIFTY 24200 CE', pnl: 5000, brokeragePaid: 40, sttPaid: 15, exchangeCharges: 10, gstPaid: 9 },
    { id: '2', ticker: 'SENSEX 79800 PE', pnl: -3000, brokeragePaid: 40, sttPaid: 12, exchangeCharges: 8, gstPaid: 8.64 },
  ];
  const taxReport = calculateIndianFoTax(sampleTaxTrades, 5000);
  // ICAI Turnover = |5000| + |-3000| = 8000
  assert(taxReport.icaiTurnover === 8000, 'ICAI Section 44AB Turnover is absolute sum of gains and losses (₹8,000)', { turnover: taxReport.icaiTurnover });
  assert(taxReport.netTradingIncome === 2000, 'Net Trading Profit is ₹2,000', { net: taxReport.netTradingIncome });
  assert(!taxReport.isAuditRequired, 'Turnover < ₹10 Cr does not require mandatory tax audit');

  // --- 7. Security: Webhook Idempotency & Duplicate Rejection ---
  console.log('\n7. Security: Webhook Idempotency & Duplicate Filter:');
  const alertPayload = { ticker: 'NSE:NIFTY50', price: 24285.5, timeframe: '5m', action: 'BUY' };
  const firstSeen = isDuplicatePayload(alertPayload, 30);
  assert(!firstSeen, 'First webhook payload accepted');

  const secondSeen = isDuplicatePayload(alertPayload, 30);
  assert(secondSeen, 'Duplicate webhook payload within 30s detected and rejected');

  // --- 8. Cryptographic Ticket Fingerprinting ---
  console.log('\n8. Cryptographic Ticket Fingerprinting & Approval Gate:');
  const ticket1 = {
    ticketId: 'TKT-101',
    timestamp: '2026-10-31T09:30:00Z',
    index: 'NIFTY' as const,
    optionType: 'CE' as const,
    strike: 24200,
    expiry: '2026-11-05',
    orderType: 'LIMIT' as const,
    limitPrice: 125,
    quantity: 75,
    lotSize: 75,
    lots: 1,
    stopLoss: 95,
    target1: 155,
    target2: 185,
    estimatedRisk: 2250,
    allowedRisk: 5000,
    estimatedCharges: 40,
    signalScore: 84,
    strategy: 'EMA Pullback',
  };

  const fp1 = await createTicketFingerprint(ticket1);
  const fp2 = await createTicketFingerprint(ticket1);
  assert(fp1 === fp2, 'Fingerprint generation is strictly deterministic', { fp1 });

  const tamperedTicket = { ...ticket1, limitPrice: 135 }; // Price changed
  const fpTampered = await createTicketFingerprint(tamperedTicket);
  assert(fp1 !== fpTampered, 'Tampered ticket yields completely different cryptographic fingerprint');

  // --- Summary ---
  console.log('\n------------------------------------------------------');
  console.log(`TEST RUN COMPLETED: \x1b[32m${passedTests} PASSED\x1b[0m, \x1b[31m${failedTests} FAILED\x1b[0m`);
  console.log('------------------------------------------------------\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
