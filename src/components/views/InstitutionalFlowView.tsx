import React from 'react';
import { RECENT_INSTITUTIONAL_DATA, DailyInstitutionalActivity } from '../../lib/engine/institutionalFlowEngine';
import { Landmark, TrendingUp, TrendingDown, Users, Compass, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const InstitutionalFlowView: React.FC = () => {
  const latest = RECENT_INSTITUTIONAL_DATA[0];

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              FII & DII Institutional Activity & Derivatives Positioning
            </h2>
            <p className="text-xs text-slate-400">
              Exchange disclosures of Foreign Institutional Investors (FIIs) & Domestic Mutual Funds (DIIs). Cash net flows and Index Futures positioning.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="NSE / NSDL Disclosures" />
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">FII Cash Net (Latest)</span>
          <div className={`text-xl font-black ${latest.fiiCashNetCr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {latest.fiiCashNetCr >= 0 ? '+' : ''}₹{latest.fiiCashNetCr.toLocaleString('en-IN')} Cr
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Gross Buy: ₹{latest.fiiCashBuyCr} Cr</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">DII Cash Net (Latest)</span>
          <div className={`text-xl font-black ${latest.diiCashNetCr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {latest.diiCashNetCr >= 0 ? '+' : ''}₹{latest.diiCashNetCr.toLocaleString('en-IN')} Cr
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Gross Buy: ₹{latest.diiCashBuyCr} Cr</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">FII Index Futures L/S Ratio</span>
          <div className="text-xl font-black text-cyan-400">
            {latest.fiiFuturesLongShortRatio}
          </div>
          <span className="text-[10px] text-slate-400">
            {latest.fiiFuturesLongShortRatio > 1.25 ? 'Heavy Long Dominance' : 'Balanced'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Institutional Bias</span>
          <div className="text-base font-black text-emerald-400">
            {latest.institutionalBias.replace('_', ' ')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Both FII & DII Inflows Positive</span>
        </div>
      </div>

      {/* Historical Disclosures Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">Daily Cash & Index Futures Settlement Ledger</span>
          <span className="text-[10px] text-slate-500">All values in ₹ Crores (Cr) / Contracts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans uppercase text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">FII Cash Net</th>
                <th className="p-3 text-right">DII Cash Net</th>
                <th className="p-3 text-right">Total Net Cash</th>
                <th className="p-3 text-right">FII Futures Long</th>
                <th className="p-3 text-right">FII Futures Short</th>
                <th className="p-3 text-center">FII Ratio</th>
                <th className="p-3 text-center">Macro Bias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {RECENT_INSTITUTIONAL_DATA.map((row) => (
                <tr key={row.date} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-200">{row.date}</td>

                  <td className={`p-3 text-right font-bold ${row.fiiCashNetCr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.fiiCashNetCr >= 0 ? '+' : ''}₹{row.fiiCashNetCr.toLocaleString('en-IN')}
                  </td>

                  <td className={`p-3 text-right font-bold ${row.diiCashNetCr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.diiCashNetCr >= 0 ? '+' : ''}₹{row.diiCashNetCr.toLocaleString('en-IN')}
                  </td>

                  <td className={`p-3 text-right font-bold ${row.totalCashNetCr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.totalCashNetCr >= 0 ? '+' : ''}₹{row.totalCashNetCr.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-right text-cyan-400 font-mono">
                    {row.fiiIndexFuturesLongContracts.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-right text-rose-400 font-mono">
                    {row.fiiIndexFuturesShortContracts.toLocaleString('en-IN')}
                  </td>

                  <td className="p-3 text-center font-bold text-slate-200">
                    {row.fiiFuturesLongShortRatio}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        row.institutionalBias.includes('BULLISH')
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : row.institutionalBias.includes('BEARISH')
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {row.institutionalBias.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
