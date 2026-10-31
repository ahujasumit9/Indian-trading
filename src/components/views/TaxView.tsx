import React, { useState } from 'react';
import { calculateIndianFoTax, TradeForTax, TaxReportSummary } from '../../lib/engine/taxEngine';
import { FileText, Calculator, ShieldCheck, AlertCircle, Calendar, Download } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

const SAMPLE_TAX_TRADES: TradeForTax[] = [
  { id: 't1', ticker: 'NIFTY 24200 CE', pnl: 4850, brokeragePaid: 40, sttPaid: 12, exchangeCharges: 8, gstPaid: 8.64 },
  { id: 't2', ticker: 'NIFTY 24300 PE', pnl: -1650, brokeragePaid: 40, sttPaid: 9, exchangeCharges: 6, gstPaid: 8.28 },
  { id: 't3', ticker: 'SENSEX 79800 CE', pnl: 9200, brokeragePaid: 40, sttPaid: 24, exchangeCharges: 14, gstPaid: 9.72 },
  { id: 't4', ticker: 'NIFTY 24150 CE', pnl: -2400, brokeragePaid: 40, sttPaid: 11, exchangeCharges: 7, gstPaid: 8.46 },
  { id: 't5', ticker: 'SENSEX 79500 PE', pnl: 6100, brokeragePaid: 40, sttPaid: 18, exchangeCharges: 11, gstPaid: 9.18 },
  { id: 't6', ticker: 'NIFTY 24400 CE', pnl: 3450, brokeragePaid: 40, sttPaid: 10, exchangeCharges: 7, gstPaid: 8.46 },
];

export const TaxView: React.FC = () => {
  const [softwareExpenses, setSoftwareExpenses] = useState<number>(18000);
  const [taxSlabRate, setTaxSlabRate] = useState<number>(30);

  const report: TaxReportSummary = calculateIndianFoTax(SAMPLE_TAX_TRADES, softwareExpenses, taxSlabRate);

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Indian F&O Tax Engine (Section 43(5) & Section 44AB)
            </h2>
            <p className="text-xs text-slate-400">
              Tax audit turnover calculation, deductible expenses (STT & Brokerage), and advance tax quarterly schedule.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="IT Act, 1961 Compliance" />
      </div>

      {/* Statutory Banner Notice */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-4 text-xs text-slate-300 space-y-1">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>Statutory Classification & Income Tax Provisions</span>
        </div>
        <p className="text-slate-400 leading-relaxed font-sans">
          Under Section 43(5) of the Income Tax Act 1961, transactions in eligible equity derivatives (NSE/BSE futures & options) are deemed <strong>Non-Speculative Business Income</strong>. Profits are taxed at applicable individual income tax slab rates, and business expenses (including STT, brokerage, exchange turnover fees, and trading software/APIs) are fully deductible against trading profits.
        </p>
      </div>

      {/* Turnover and Tax Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">ICAI Audit Turnover (Sec 44AB)</span>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            ₹{report.icaiTurnover.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Absolute sum: |Profit| + |Loss|</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Tax Audit Applicability</span>
          <div className="text-base font-black text-emerald-400 mt-1">
            {report.isAuditRequired ? 'AUDIT MANDATORY' : 'AUDIT NOT REQUIRED'}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Threshold: ₹10 Cr (100% digital)</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Net Trading Profit</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            ₹{report.netTradingIncome.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Gross Gain: ₹{report.grossProfit}</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Net Taxable Business Income</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            ₹{report.netTaxableBusinessIncome.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">After ₹{report.deductibleExpenses.totalDeductions} deductions</span>
        </div>
      </div>

      {/* Expenses & Advance Tax Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deductible Expenses Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-200">Deductible Business Expenses (Sec 37(1))</h3>
            <span className="text-xs font-bold text-emerald-400">
              Total: ₹{report.deductibleExpenses.totalDeductions.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <span className="text-slate-400">Securities Transaction Tax (STT) on F&O</span>
              <span className="font-bold text-slate-200">₹{report.deductibleExpenses.stt.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <span className="text-slate-400">Brokerage Paid to Broker</span>
              <span className="font-bold text-slate-200">₹{report.deductibleExpenses.brokerage.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <span className="text-slate-400">Exchange Turnover & Regulatory Fees</span>
              <span className="font-bold text-slate-200">₹{report.deductibleExpenses.exchangeCharges.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <span className="text-slate-400">GST on Brokerage & Exchange Fees (18%)</span>
              <span className="font-bold text-slate-200">₹{report.deductibleExpenses.gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <span className="text-slate-400">Trading Terminal Software / Data Subscriptions</span>
              <span className="font-bold text-slate-200">₹{report.deductibleExpenses.softwareAndDataFeed.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Advance Tax Calendar */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-slate-200">Advance Tax Calendar (Sec 208)</h3>
            <span className="text-xs text-slate-400">{report.financialYear}</span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans">
            If your net estimated tax liability exceeds ₹10,000, advance tax must be paid in four installments to avoid interest under Section 234B/234C.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">15th June (15%)</span>
              </div>
              <span className="font-bold text-slate-200">₹{report.advanceTaxSchedule.q1June15.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">15th September (45% cumulative)</span>
              </div>
              <span className="font-bold text-slate-200">₹{report.advanceTaxSchedule.q2Sept15.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">15th December (75% cumulative)</span>
              </div>
              <span className="font-bold text-slate-200">₹{report.advanceTaxSchedule.q3Dec15.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">15th March (100% cumulative)</span>
              </div>
              <span className="font-bold text-slate-200">₹{report.advanceTaxSchedule.q4March15.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
