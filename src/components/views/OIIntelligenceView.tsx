import React, { useState } from 'react';
import { OptionChainData, MarketIndex } from '../../types/market';
import { PieChart, ArrowUpRight, ArrowDownRight, Layers, HelpCircle } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface OIIntelligenceViewProps {
  optionChain: OptionChainData;
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
}

export const OIIntelligenceView: React.FC<OIIntelligenceViewProps> = ({
  optionChain,
  selectedUnderlying,
  onSelectUnderlying,
}) => {
  const [viewMode, setViewMode] = useState<'TOTAL_OI' | 'CHANGE_OI'>('TOTAL_OI');

  const { spotPrice, atmStrike, strikes, pcr, totalCallOI, totalPutOI, highestCallOIStrike, highestPutOIStrike } =
    optionChain;

  // Top 10 strikes around ATM
  const atmIdx = strikes.findIndex((s) => s.strike === atmStrike);
  const nearStrikes = strikes.slice(Math.max(0, atmIdx - 7), Math.min(strikes.length, atmIdx + 8));

  const maxOiVal = Math.max(
    ...nearStrikes.map((s) =>
      viewMode === 'TOTAL_OI' ? Math.max(s.ce.oi, s.pe.oi) : Math.max(Math.abs(s.ce.oiChange), Math.abs(s.pe.oiChange))
    ),
    1
  );

  // Aggregated buildup stats
  let longBuildupCount = 0;
  let shortBuildupCount = 0;
  let shortCoveringCount = 0;
  let longUnwindingCount = 0;

  strikes.forEach((s) => {
    if (s.ce.buildup === 'Long Buildup' || s.pe.buildup === 'Long Buildup') longBuildupCount++;
    if (s.ce.buildup === 'Short Buildup' || s.pe.buildup === 'Short Buildup') shortBuildupCount++;
    if (s.ce.buildup === 'Short Covering' || s.pe.buildup === 'Short Covering') shortCoveringCount++;
    if (s.ce.buildup === 'Long Unwinding' || s.pe.buildup === 'Long Unwinding') longUnwindingCount++;
  });

  return (
    <div className="space-y-4 font-mono">
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Open Interest (OI) & Buildup Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Strike-by-strike Call vs Put OI distribution, net OI shifts, and institutional positioning
            </p>
          </div>
        </div>

        {/* Index Switcher */}
        <div className="flex rounded-md p-0.5 bg-slate-950 border border-slate-800 text-xs font-bold">
          <button
            onClick={() => onSelectUnderlying('NIFTY')}
            className={`px-3 py-1.5 rounded transition-all ${
              selectedUnderlying === 'NIFTY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            NIFTY 50
          </button>
          <button
            onClick={() => onSelectUnderlying('SENSEX')}
            className={`px-3 py-1.5 rounded transition-all ${
              selectedUnderlying === 'SENSEX'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            BSE SENSEX
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <MetricCard
          label="PUT-CALL RATIO (PCR)"
          value={pcr.toFixed(3)}
          subValue={pcr >= 1.15 ? 'Bullish Put Writing' : pcr <= 0.85 ? 'Bearish Call Writing' : 'Neutral Range'}
          badge={pcr >= 1.0 ? 'BULLISH' : 'BEARISH'}
          badgeColor={pcr >= 1.0 ? 'green' : 'red'}
        />

        <MetricCard
          label="TOTAL CALL OI vs PUT OI"
          value={`${(totalCallOI / 100000).toFixed(1)}L / ${(totalPutOI / 100000).toFixed(1)}L`}
          subValue={`Net Diff: ${Math.abs(totalPutOI - totalCallOI).toLocaleString('en-IN')}`}
          badge={totalPutOI > totalCallOI ? 'PUT DOMINANT' : 'CALL DOMINANT'}
          badgeColor="blue"
        />

        <MetricCard
          label="RESISTANCE (HIGHEST CE OI)"
          value={highestCallOIStrike}
          subValue="Primary Supply Barrier"
          badge="CALL WALL"
          badgeColor="red"
        />

        <MetricCard
          label="SUPPORT (HIGHEST PE OI)"
          value={highestPutOIStrike}
          subValue="Primary Demand Cushion"
          badge="PUT WALL"
          badgeColor="green"
        />
      </div>

      {/* Buildup Breakdown Pill Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded p-2.5">
          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Long Buildup</span>
          <span className="text-base font-bold text-slate-100">{longBuildupCount} Strikes</span>
          <span className="text-[10px] text-slate-400 block">Price ↑ + OI ↑ (Bullish)</span>
        </div>

        <div className="bg-rose-950/20 border border-rose-500/30 rounded p-2.5">
          <span className="text-[10px] text-rose-400 uppercase font-bold block">Short Buildup</span>
          <span className="text-base font-bold text-slate-100">{shortBuildupCount} Strikes</span>
          <span className="text-[10px] text-slate-400 block">Price ↓ + OI ↑ (Bearish)</span>
        </div>

        <div className="bg-cyan-950/20 border border-cyan-500/30 rounded p-2.5">
          <span className="text-[10px] text-cyan-400 uppercase font-bold block">Short Covering</span>
          <span className="text-base font-bold text-slate-100">{shortCoveringCount} Strikes</span>
          <span className="text-[10px] text-slate-400 block">Price ↑ + OI ↓ (Squeeze)</span>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/30 rounded p-2.5">
          <span className="text-[10px] text-amber-400 uppercase font-bold block">Long Unwinding</span>
          <span className="text-base font-bold text-slate-100">{longUnwindingCount} Strikes</span>
          <span className="text-[10px] text-slate-400 block">Price ↓ + OI ↓ (Profit Taking)</span>
        </div>
      </div>

      {/* Main Dual OI Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-200 uppercase">
              Call OI (Left) vs Put OI (Right) by Strike
            </span>
            <span className="text-slate-500">(Spot: ₹{spotPrice})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('TOTAL_OI')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'TOTAL_OI'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Total OI
            </button>
            <button
              onClick={() => setViewMode('CHANGE_OI')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'CHANGE_OI'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Change in OI
            </button>
          </div>
        </div>

        {/* Dual Bars List */}
        <div className="space-y-2">
          {nearStrikes.map((s) => {
            const isAtm = s.isAtm;
            const ceVal = viewMode === 'TOTAL_OI' ? s.ce.oi : Math.max(0, s.ce.oiChange);
            const peVal = viewMode === 'TOTAL_OI' ? s.pe.oi : Math.max(0, s.pe.oiChange);

            const cePct = (ceVal / maxOiVal) * 100;
            const pePct = (peVal / maxOiVal) * 100;

            return (
              <div
                key={s.strike}
                className={`flex items-center gap-3 px-2 py-1.5 rounded text-xs transition-all ${
                  isAtm ? 'bg-cyan-950/30 border border-cyan-500/40 font-bold' : 'hover:bg-slate-800/30'
                }`}
              >
                {/* Call OI Bar (Growing from right to left) */}
                <div className="flex-1 flex items-center justify-end gap-2">
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {(ceVal / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full bg-slate-950 rounded h-4 overflow-hidden flex justify-end">
                    <div
                      className="bg-rose-500/80 h-full rounded-l transition-all"
                      style={{ width: `${cePct}%` }}
                      title={`Call OI: ${s.ce.oi}`}
                    />
                  </div>
                </div>

                {/* Center Strike Label */}
                <div className="w-20 shrink-0 text-center font-bold">
                  <span className={isAtm ? 'text-cyan-400' : 'text-slate-200'}>{s.strike}</span>
                  {isAtm && <span className="text-[9px] text-cyan-400 block font-normal">ATM</span>}
                </div>

                {/* Put OI Bar (Growing from left to right) */}
                <div className="flex-1 flex items-center justify-start gap-2">
                  <div className="w-full bg-slate-950 rounded h-4 overflow-hidden flex justify-start">
                    <div
                      className="bg-emerald-500/80 h-full rounded-r transition-all"
                      style={{ width: `${pePct}%` }}
                      title={`Put OI: ${s.pe.oi}`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {(peVal / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
