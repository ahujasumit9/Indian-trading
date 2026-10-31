import React from 'react';
import { MarketDataState } from '../../types/dataSources';
import { Radio, Database, History, Cpu, WifiOff } from 'lucide-react';

interface MarketDataBadgeProps {
  state: MarketDataState;
  sourceLabel?: string;
  lastUpdated?: string;
  showTime?: boolean;
  className?: string;
}

export const MarketDataBadge: React.FC<MarketDataBadgeProps> = ({
  state,
  sourceLabel,
  lastUpdated,
  showTime = true,
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          ping: 'bg-emerald-400',
          icon: Radio,
          label: 'LIVE',
          desc: 'Real-time verified exchange stream',
        };
      case 'DELAYED':
        return {
          bg: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
          dot: 'bg-yellow-400',
          ping: 'bg-yellow-400',
          icon: Radio,
          label: 'DELAYED 15M',
          desc: 'Delayed exchange feed (SEBI compliance)',
        };
      case 'HISTORICAL':
        return {
          bg: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
          dot: 'bg-blue-400',
          ping: '',
          icon: History,
          label: 'HISTORICAL',
          desc: 'Imported historical CSV dataset',
        };
      case 'DISCONNECTED':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-500',
          ping: '',
          icon: WifiOff,
          label: 'DISCONNECTED',
          desc: 'No active data provider connection',
        };
      case 'SIMULATED':
      default:
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          ping: 'bg-amber-400',
          icon: Cpu,
          label: 'SIMULATED',
          desc: 'High-fidelity Brownian motion simulator for testing',
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[11px] border ${config.bg} ${className}`}
      title={`${config.label}: ${config.desc}${sourceLabel ? ` | Source: ${sourceLabel}` : ''}`}
    >
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>

      <span className="font-black tracking-wider">{config.label}</span>

      {sourceLabel && (
        <span className="text-slate-400 font-normal border-l border-slate-700/80 pl-1.5 hidden sm:inline truncate max-w-[140px]">
          {sourceLabel}
        </span>
      )}

      {showTime && (
        <span className="text-slate-500 text-[10px] hidden md:inline border-l border-slate-700/80 pl-1.5">
          {lastUpdated || new Date().toLocaleTimeString('en-IN', { hour12: false })}
        </span>
      )}
    </div>
  );
};
