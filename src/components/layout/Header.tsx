import React from 'react';
import { MarketSnapshot } from '../../lib/data/marketSimulator';
import { Power, Activity, Menu, Play, Pause, Flame } from 'lucide-react';
import { DataSourceStatus } from '../../types/dataSources';

interface HeaderProps {
  niftySnapshot: MarketSnapshot;
  sensexSnapshot: MarketSnapshot;
  dataSourceStatus: DataSourceStatus;
  isSimulating: boolean;
  onToggleSimulating: () => void;
  killSwitchActive: boolean;
  onToggleKillSwitch: () => void;
  onOpenMobileNav: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  niftySnapshot,
  sensexSnapshot,
  dataSourceStatus,
  isSimulating,
  onToggleSimulating,
  killSwitchActive,
  onToggleKillSwitch,
  onOpenMobileNav,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="flex items-center justify-between px-3 md:px-5 py-2.5">
        {/* Left: Brand & Mobile Nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center font-black text-black text-sm shadow-md shadow-emerald-500/20">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm md:text-base tracking-tight text-white">INDIA AI TRADER</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  PRO TERMINAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-mono">
                BSE SENSEX & NSE NIFTY Options Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Ticker Strip (SENSEX, NIFTY, INDIA VIX) */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-900/80 border border-slate-800/80 rounded-lg px-4 py-1.5 font-mono text-xs">
          {/* NIFTY */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">NIFTY 50:</span>
            <span className="font-bold text-slate-100">{niftySnapshot.spotPrice.toLocaleString('en-IN')}</span>
            <span
              className={`text-[11px] font-semibold ${
                niftySnapshot.priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {niftySnapshot.priceChange >= 0 ? '+' : ''}
              {niftySnapshot.priceChange.toFixed(2)} ({niftySnapshot.priceChangePct.toFixed(2)}%)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* SENSEX */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">SENSEX:</span>
            <span className="font-bold text-slate-100">{sensexSnapshot.spotPrice.toLocaleString('en-IN')}</span>
            <span
              className={`text-[11px] font-semibold ${
                sensexSnapshot.priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {sensexSnapshot.priceChange >= 0 ? '+' : ''}
              {sensexSnapshot.priceChange.toFixed(2)} ({sensexSnapshot.priceChangePct.toFixed(2)}%)
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* INDIA VIX */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">INDIA VIX:</span>
            <span className="font-bold text-amber-400">{niftySnapshot.indiaVix.toFixed(2)}</span>
            <span className="text-[10px] text-slate-500">
              ({niftySnapshot.vixChange >= 0 ? '+' : ''}
              {niftySnapshot.vixChange.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Right Controls: Data Source, Simulation Live Toggle, Kill Switch */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Data Source Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  dataSourceStatus.activeSource === 'SIMULATOR' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  dataSourceStatus.activeSource === 'SIMULATOR' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-slate-300 font-semibold truncate max-w-[120px] sm:max-w-none">
              {dataSourceStatus.activeSource === 'SIMULATOR'
                ? 'SIMULATED DATA'
                : dataSourceStatus.activeSource === 'CSV_FILE'
                ? 'CSV DATA'
                : 'WEBHOOK LIVE'}
            </span>
          </div>

          {/* Simulation Toggle */}
          <button
            onClick={onToggleSimulating}
            title={isSimulating ? 'Pause tick simulation' : 'Start realistic market tick simulation'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-medium transition-all ${
              isSimulating
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{isSimulating ? 'Live Ticks ON' : 'Paused'}</span>
          </button>

          {/* Emergency Kill Switch */}
          <button
            onClick={onToggleKillSwitch}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all shadow-sm ${
              killSwitchActive
                ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-rose-900/50'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
            title="Emergency Kill Switch - Immediately halts all new trade proposals and locks order placement"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{killSwitchActive ? 'KILL SWITCH ENGAGED' : 'KILL SWITCH'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
