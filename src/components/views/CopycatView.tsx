import React, { useState } from 'react';
import { SUPER_INVESTOR_PROFILES, SuperInvestorProfile } from '../../lib/engine/copycatEngine';
import { Eye, Award, ExternalLink, TrendingUp, Briefcase, ChevronRight, Shield } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const CopycatView: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<SuperInvestorProfile>(SUPER_INVESTOR_PROFILES[0]);

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Indian Super-Investors Public Portfolio Tracker ("Copycat")
            </h2>
            <p className="text-xs text-slate-400">
              Mandatory disclosures under SEBI LODR Regulations (&gt;1% equity shareholding). Radhakishan Damani, Rare Enterprises, Ashish Kacholia & Vijay Kedia.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="SEBI LODR Disclosures" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Investor Selectors */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Prominent Indian Market Icons
          </h3>

          <div className="space-y-2">
            {SUPER_INVESTOR_PROFILES.map((profile) => {
              const isSelected = selectedProfile.id === profile.id;

              return (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-100">{profile.name}</div>
                      <div className="text-[11px] text-slate-400">{profile.firm}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-purple-400">
                        ₹{(profile.publicNetWorthCr / 1000).toFixed(1)}k Cr
                      </div>
                      <span className="text-[10px] text-slate-500">Public Equity</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Holdings Dossier */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-bold font-sans text-white">{selectedProfile.name}</h3>
              <p className="text-xs text-slate-400">{selectedProfile.firm} • {selectedProfile.lastUpdated}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase">Estimated Public Equity Portfolio</span>
              <div className="text-2xl font-black text-purple-400">
                ₹{selectedProfile.publicNetWorthCr.toLocaleString('en-IN')} Cr
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 text-xs">
            <span className="font-bold text-slate-300">Investment Philosophy:</span>
            <p className="text-slate-400 leading-relaxed font-sans">{selectedProfile.investmentStyle}</p>
          </div>

          {/* Holdings Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Top Publicly Disclosed Holdings (&gt;1% Stake)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Company</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3 text-right">Stake %</th>
                    <th className="p-3 text-right">Value (₹ Cr)</th>
                    <th className="p-3 text-center">Quarterly Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {selectedProfile.topHoldings.map((h) => (
                    <tr key={h.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-100">{h.company}</div>
                        <div className="text-[10px] text-purple-400 font-mono">{h.symbol}</div>
                      </td>

                      <td className="p-3 text-slate-400">{h.sector}</td>

                      <td className="p-3 text-right font-bold text-slate-100">
                        {h.holdingPct}%
                      </td>

                      <td className="p-3 text-right font-bold text-purple-300">
                        ₹{h.holdingValueCr.toLocaleString('en-IN')} Cr
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            h.changeLastQuarter === 'INCREASED' || h.changeLastQuarter === 'NEW_ENTRY'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : h.changeLastQuarter === 'DECREASED'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {h.changeLastQuarter.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
