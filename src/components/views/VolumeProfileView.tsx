import React from 'react';
import { VolumeProfileData, MarketIndex } from '../../types/market';
import { Layers, Activity, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface VolumeProfileViewProps {
  volumeProfile: VolumeProfileData;
  spotPrice: number;
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
}

export const VolumeProfileView: React.FC<VolumeProfileViewProps> = ({
  volumeProfile,
  spotPrice,
  selectedUnderlying,
  onSelectUnderlying,
}) => {
  const { poc, vah, val, totalVolume, valueAreaVolume, levels, acceptanceStatus, migrationDirection } =
    volumeProfile;

  const maxLevelVolume = Math.max(...levels.map((l) => l.volume), 1);

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Advanced Institutional Volume Profile
            </h2>
            <p className="text-xs text-slate-400">
              Point of Control (POC), 70% Value Area (VAH/VAL), High/Low Volume Nodes, and Acceptance Signals
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
          label="POINT OF CONTROL (POC)"
          value={`₹${poc}`}
          subValue="Highest Traded Volume Price"
          badge="MAGNET LEVEL"
          badgeColor="blue"
        />

        <MetricCard
          label="VALUE AREA HIGH (VAH)"
          value={`₹${vah}`}
          subValue="70% Upper Volume Boundary"
          badge="RESISTANCE"
          badgeColor="yellow"
        />

        <MetricCard
          label="VALUE AREA LOW (VAL)"
          value={`₹${val}`}
          subValue="70% Lower Volume Boundary"
          badge="SUPPORT"
          badgeColor="yellow"
        />

        <MetricCard
          label="POC MIGRATION"
          value={migrationDirection}
          subValue={`Acceptance: ${acceptanceStatus}`}
          badge={acceptanceStatus}
          badgeColor={acceptanceStatus === 'ACCEPTED' ? 'green' : 'red'}
        />
      </div>

      {/* Main Volume Profile Distribution Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200 uppercase">
              Horizontal Volume Distribution by Price Node
            </span>
            <span className="text-slate-500">
              (Total Vol: {(totalVolume / 1000).toFixed(1)}k | Value Area: {(valueAreaVolume / 1000).toFixed(1)}k)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm inline-block" /> Buy Volume
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm inline-block" /> Sell Volume
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm inline-block" /> POC
            </span>
          </div>
        </div>

        {/* Levels Bars */}
        <div className="space-y-1.5">
          {levels.map((lvl) => {
            const isPoc = lvl.isPOC;
            const isVah = lvl.isVAH;
            const isVal = lvl.isVAL;
            const isNearSpot = Math.abs(lvl.price - spotPrice) < 15;
            const totalPct = (lvl.volume / maxLevelVolume) * 100;
            const buyPct = (lvl.buyVolume / (lvl.volume || 1)) * totalPct;
            const sellPct = totalPct - buyPct;

            return (
              <div
                key={lvl.price}
                className={`flex items-center gap-3 px-2 py-1 rounded transition-colors text-xs ${
                  isPoc
                    ? 'bg-cyan-950/40 border border-cyan-500/40'
                    : isNearSpot
                    ? 'bg-slate-800/80'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                {/* Price Label */}
                <div className="w-24 shrink-0 font-bold flex items-center justify-between">
                  <span className={isPoc ? 'text-cyan-400 font-extrabold' : 'text-slate-300'}>
                    ₹{lvl.price}
                  </span>
                  {isNearSpot && (
                    <span className="text-[9px] px-1 rounded bg-amber-500 text-black font-extrabold">
                      SPOT
                    </span>
                  )}
                </div>

                {/* Level Marker Badge */}
                <div className="w-16 shrink-0 text-right">
                  {isPoc && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      POC
                    </span>
                  )}
                  {isVah && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      VAH
                    </span>
                  )}
                  {isVal && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      VAL
                    </span>
                  )}
                  {lvl.isHVN && !isPoc && !isVah && !isVal && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      HVN
                    </span>
                  )}
                </div>

                {/* Horizontal Volume Bar */}
                <div className="flex-1 bg-slate-950/80 rounded h-4 overflow-hidden flex relative">
                  <div
                    className="bg-emerald-500/70 h-full transition-all"
                    style={{ width: `${buyPct}%` }}
                    title={`Buy Volume: ${lvl.buyVolume}`}
                  />
                  <div
                    className="bg-rose-500/70 h-full transition-all"
                    style={{ width: `${sellPct}%` }}
                    title={`Sell Volume: ${lvl.sellVolume}`}
                  />
                  {isPoc && (
                    <div className="absolute right-2 top-0 bottom-0 flex items-center text-[9px] text-cyan-300 font-bold">
                      POC (Highest Volume)
                    </div>
                  )}
                </div>

                {/* Numeric Volume */}
                <div className="w-20 shrink-0 text-right text-[11px] text-slate-400">
                  {lvl.volume.toLocaleString('en-IN')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
