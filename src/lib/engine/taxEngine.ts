/**
 * Indian F&O Tax Engine under Income Tax Act, 1961
 * Computes:
 * 1. Non-speculative business income under Section 43(5)
 * 2. Section 44AB Tax Audit Turnover (ICAI Guidance Note absolute sum of profits & losses)
 * 3. Business expense deductions (STT, Brokerage, GST, Exchange fees, Data Subscriptions)
 * 4. Advance Tax quarterly installment schedule
 */

export interface TradeForTax {
  id: string;
  ticker: string;
  pnl: number;
  premiumReceived?: number;
  brokeragePaid: number;
  sttPaid: number;
  exchangeCharges: number;
  gstPaid: number;
}

export interface TaxReportSummary {
  financialYear: string;
  assessmentYear: string;
  classification: string; // "Non-Speculative Business Income (Sec 43(5))"
  grossProfit: number;
  grossLoss: number;
  netTradingIncome: number;
  icaiTurnover: number; // Absolute sum of profits + losses
  isAuditRequired: boolean; // Sec 44AB threshold: ₹10 Cr if >= 95% digital
  auditThresholdCr: number;
  deductibleExpenses: {
    brokerage: number;
    stt: number;
    exchangeCharges: number;
    gst: number;
    softwareAndDataFeed: number;
    totalDeductions: number;
  };
  netTaxableBusinessIncome: number;
  advanceTaxSchedule: {
    q1June15: number; // 15%
    q2Sept15: number; // 45% cumulative
    q3Dec15: number; // 75% cumulative
    q4March15: number; // 100% cumulative
  };
  statutoryDisclaimer: string;
}

export function calculateIndianFoTax(
  trades: TradeForTax[],
  softwareExpenses: number = 18000,
  taxSlabRatePct: number = 30
): TaxReportSummary {
  let grossProfit = 0;
  let grossLoss = 0;
  let icaiTurnover = 0;
  let totalBrokerage = 0;
  let totalStt = 0;
  let totalExchange = 0;
  let totalGst = 0;

  for (const t of trades) {
    if (t.pnl >= 0) {
      grossProfit += t.pnl;
    } else {
      grossLoss += Math.abs(t.pnl);
    }

    // ICAI Guidance note: Absolute difference of profit and loss
    icaiTurnover += Math.abs(t.pnl);

    totalBrokerage += t.brokeragePaid || 0;
    totalStt += t.sttPaid || 0;
    totalExchange += t.exchangeCharges || 0;
    totalGst += t.gstPaid || 0;
  }

  const netTradingIncome = grossProfit - grossLoss;
  const totalDeductions = totalBrokerage + totalStt + totalExchange + totalGst + softwareExpenses;
  const netTaxableBusinessIncome = Math.max(0, netTradingIncome - totalDeductions);

  // Section 44AB turnover threshold is ₹10 Crore for digital transactions (F&O is 100% electronic)
  const isAuditRequired = icaiTurnover > 100000000;

  // Estimated tax for advance tax schedule
  const estimatedTax = (netTaxableBusinessIncome * taxSlabRatePct) / 100;

  return {
    financialYear: 'FY 2025-26',
    assessmentYear: 'AY 2026-27',
    classification: 'Non-Speculative Business Income u/s 43(5)',
    grossProfit: Math.round(grossProfit),
    grossLoss: Math.round(grossLoss),
    netTradingIncome: Math.round(netTradingIncome),
    icaiTurnover: Math.round(icaiTurnover),
    isAuditRequired,
    auditThresholdCr: 10,
    deductibleExpenses: {
      brokerage: Math.round(totalBrokerage),
      stt: Math.round(totalStt),
      exchangeCharges: Math.round(totalExchange),
      gst: Math.round(totalGst),
      softwareAndDataFeed: softwareExpenses,
      totalDeductions: Math.round(totalDeductions),
    },
    netTaxableBusinessIncome: Math.round(netTaxableBusinessIncome),
    advanceTaxSchedule: {
      q1June15: Math.round(estimatedTax * 0.15),
      q2Sept15: Math.round(estimatedTax * 0.45),
      q3Dec15: Math.round(estimatedTax * 0.75),
      q4March15: Math.round(estimatedTax * 1.0),
    },
    statutoryDisclaimer:
      'STATUTORY NOTICE: Derivatives (F&O) income is classified as Non-Speculative Business Income under Section 43(5) of the Income Tax Act, 1961. This calculation is for educational and estimation purposes only. Please consult a qualified Chartered Accountant (CA) for filing ITR-3 or ITR-4.',
  };
}
