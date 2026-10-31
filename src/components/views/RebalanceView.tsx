import React, { useState } from 'react';
import { computeRebalancePlan, RebalancePlan, AllocationBucket } from '../../lib/engine/rebalanceEngine';
import { Scale, AlertTriangle, ShieldCheck, PieChart, ArrowRight, RefreshCw } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const RebalanceView: React.FC = () => {
  const [totalCapital, setTotalCapital] = useState<number>(500000);
  const [deployedMargin, setDeployedMargin] = useState<number>(180000);
  const [optionBuyingValue, setOptionBuyingValue] = useState<number>(25000);
  const [netDelta, setNetDelta] = useState<number>(0.18);

  const plan: RebalancePlan = computeRebalancePlan(totalCapital, deployedMargin, optionBuyingValue, netDelta);

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Portfolio & Derivatives Capital Rebalancing
            </h2>
            <p className="text-xs text-slate-400">
              Maintain optimal cash buffer, avoid leverage traps, and balance portfolio net Delta for overnight index protection.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="Risk Parity Engine" />
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Total Capital</span>
          <div className="text-xl font-black text-slate-100 mt-1">
            ₹{plan.totalCapital.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Portfolio Base</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Liquid Cash Buffer</span>
          <div className="text-xl font-black text-emerald-400 mt-1">
            ₹{plan.freeCash.toLocaleString('en-IN')} ({((plan.freeCash / plan.totalCapital) * 100).toFixed(1)}%)
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Target: 50%</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Deployed Option Margin</span>
          <div className="text-xl font-black text-amber-400 mt-1">
            ₹{plan.deployedMargin.toLocaleString('en-IN')} ({((plan.deployedMargin / plan.totalCapital) * 100).toFixed(1)}%)
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Target: 35%</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase">Net Portfolio Delta</span>
          <div className="text-xl font-black text-cyan-400 mt-1">
            {plan.netPortfolioDelta > 0 ? '+' : ''}{plan.netPortfolioDelta}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{plan.deltaBias}</span>
        </div>
      </div>

      {/* Buckets Table & Action Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800">
            <h3 className="font-bold text-xs text-slate-200">Asset & Derivatives Allocation Buckets</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans uppercase text-[10px]">
                <tr>
                  <th className="p-3">Bucket Category</th>
                  <th className="p-3 text-right">Target %</th>
                  <th className="p-3 text-right">Current Amount</th>
                  <th className="p-3 text-right">Current %</th>
                  <th className="p-3 text-right">Rebalance Delta</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {plan.buckets.map((b) => (
                  <tr key={b.category} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-200">
                      {b.category.replace(/_/g, ' ')}
                    </td>

                    <td className="p-3 text-right text-slate-400">{b.targetPercent}%</td>

                    <td className="p-3 text-right font-bold text-slate-100">
                      ₹{b.currentAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3 text-right text-slate-300">{b.currentPercent}%</td>

                    <td className={`p-3 text-right font-bold ${b.deltaAmount > 0 ? 'text-emerald-400' : b.deltaAmount < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {b.deltaAmount > 0 ? '+' : ''}₹{b.deltaAmount.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          b.recommendation === 'ALLOCATE'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : b.recommendation === 'TRIM'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {b.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Directives */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-xs text-slate-200 border-b border-slate-800 pb-2">
            Rebalancing Directives
          </h3>

          <div className="space-y-2.5 text-xs">
            {plan.actionNotes.map((note, idx) => (
              <div key={idx} className="p-3 rounded bg-slate-950 border border-slate-800/80 leading-relaxed font-sans text-slate-300">
                {note}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
