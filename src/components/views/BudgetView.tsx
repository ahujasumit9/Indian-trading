import React, { useState } from 'react';
import { MarketIndex } from '../../types/market';
import { calculateFoMargin } from '../../lib/engine/budgetEngine';
import { DollarSign, ShieldAlert, PieChart, Layers, CheckCircle, HelpCircle } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const BudgetView: React.FC = () => {
  const [index, setIndex] = useState<MarketIndex>('NIFTY');
  const [lotCount, setLotCount] = useState<number>(2);
  const [optionAction, setOptionAction] = useState<'BUY' | 'SELL_NAKED' | 'HEDGED_SPREAD'>('BUY');
  const [premiumPrice, setPremiumPrice] = useState<number>(145.0);
  const [accountCapital, setAccountCapital] = useState<number>(500000);
  const [riskPct, setRiskPct] = useState<number>(1.5);

  const spotPrice = index === 'NIFTY' ? 24250 : 79800;

  const result = calculateFoMargin(
    index,
    spotPrice,
    premiumPrice,
    lotCount,
    optionAction,
    accountCapital,
    riskPct
  );

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Indian F&O Margin & Capital Allocation Calculator
            </h2>
            <p className="text-xs text-slate-400">
              SEBI peak margin compliance, SPAN + Exposure calculator, multi-leg spread hedge benefits, and position sizing.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="SEBI Peak Margin Rules" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Input Parameters Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
            Contract & Execution Parameters
          </h3>

          <div className="space-y-3 text-xs">
            {/* Index Selection */}
            <div>
              <label className="text-slate-400 block mb-1">Underlying Contract</label>
              <div className="grid grid-cols-2 gap-2">
                {(['NIFTY', 'SENSEX'] as MarketIndex[]).map((idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIndex(idx);
                      if (idx === 'SENSEX') setPremiumPrice(280.0);
                      else setPremiumPrice(145.0);
                    }}
                    className={`py-2 rounded font-bold border transition-all ${
                      index === idx
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {idx} ({idx === 'NIFTY' ? 'Lot: 75' : 'Lot: 20'})
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy Style */}
            <div>
              <label className="text-slate-400 block mb-1">Option Action & Structure</label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => setOptionAction('BUY')}
                  className={`p-2 rounded font-bold border text-center ${
                    optionAction === 'BUY'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Option Buy
                </button>
                <button
                  onClick={() => setOptionAction('SELL_NAKED')}
                  className={`p-2 rounded font-bold border text-center ${
                    optionAction === 'SELL_NAKED'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Naked Write
                </button>
                <button
                  onClick={() => setOptionAction('HEDGED_SPREAD')}
                  className={`p-2 rounded font-bold border text-center ${
                    optionAction === 'HEDGED_SPREAD'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Spread Hedge
                </button>
              </div>
            </div>

            {/* Lots Count */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400">Order Size (Lots)</label>
                <span className="text-slate-200 font-bold">{lotCount} Lots ({lotCount * result.lotSize} Qty)</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={lotCount}
                onChange={(e) => setLotCount(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Premium Price */}
            <div>
              <label className="text-slate-400 block mb-1">Estimated Option Premium (₹)</label>
              <input
                type="number"
                step="5"
                value={premiumPrice}
                onChange={(e) => setPremiumPrice(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Total Account Capital */}
            <div>
              <label className="text-slate-400 block mb-1">Total Trading Capital (₹)</label>
              <input
                type="number"
                step="50000"
                value={accountCapital}
                onChange={(e) => setAccountCapital(Math.max(10000, parseFloat(e.target.value) || 10000))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Results & Breakdown */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-100 font-sans">
                SEBI Margin & Position Sizing Output
              </h3>
              <p className="text-xs text-slate-400">
                100% upfront premium rule for buyers; SPAN + Exposure for option writers.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Upfront Margin</span>
              <div className="text-2xl font-black text-emerald-400">
                ₹{result.totalMarginRequired.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Cards Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400">Notional Contract Value</span>
              <div className="text-sm font-bold text-slate-100 mt-1">
                ₹{(result.contractNotionalValue / 100000).toFixed(2)} Lakh
              </div>
              <span className="text-[10px] text-slate-500">Underlying Spot Exposure</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400">SPAN Margin</span>
              <div className="text-sm font-bold text-cyan-400 mt-1">
                ₹{result.spanMargin.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500">Exchange VaR Risk</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400">Exposure Margin</span>
              <div className="text-sm font-bold text-amber-400 mt-1">
                ₹{result.exposureMargin.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500">Tail Risk Reserve</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400">Max Affordable Lots</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {result.maxAffordableLots} Lots
              </div>
              <span className="text-[10px] text-slate-500">Based on ₹{(accountCapital / 100000).toFixed(1)}L Capital</span>
            </div>
          </div>

          {/* Safety & Prudence Guideline */}
          <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>Capital Preservation & Risk Rule (1.5% Hard Cap)</span>
            </div>
            <p className="text-slate-400 font-sans leading-relaxed">
              For your account capital of <strong className="text-slate-200">₹{accountCapital.toLocaleString('en-IN')}</strong>, the maximum risk allocation per single options trade is <strong className="text-emerald-400">₹{result.recommendedRiskPerTrade.toLocaleString('en-IN')}</strong>. If buying options, set your stop-loss distance such that total loss does not exceed this amount.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
