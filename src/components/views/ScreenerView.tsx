import React, { useState } from 'react';
import { SCREENER_UNIVERSE, ScreenerFilter, filterScreenerItems } from '../../lib/engine/screenerEngine';
import { Filter, ArrowUpRight, ArrowDownRight, Layers, Activity, Volume2, TrendingUp, Zap } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const ScreenerView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ScreenerFilter>('ALL');

  const filteredItems = filterScreenerItems(SCREENER_UNIVERSE, activeFilter);

  const filters: { id: ScreenerFilter; label: string; count: number }[] = [
    { id: 'ALL', label: 'All F&O Watchlist', count: SCREENER_UNIVERSE.length },
    { id: 'LONG_BUILDUP', label: 'Long Buildup', count: filterScreenerItems(SCREENER_UNIVERSE, 'LONG_BUILDUP').length },
    { id: 'SHORT_BUILDUP', label: 'Short Buildup', count: filterScreenerItems(SCREENER_UNIVERSE, 'SHORT_BUILDUP').length },
    { id: 'SHORT_COVERING', label: 'Short Covering', count: filterScreenerItems(SCREENER_UNIVERSE, 'SHORT_COVERING').length },
    { id: 'LONG_UNWINDING', label: 'Long Unwinding', count: filterScreenerItems(SCREENER_UNIVERSE, 'LONG_UNWINDING').length },
    { id: 'VOLUME_SHOCKERS', label: 'Volume Shockers (>2x)', count: filterScreenerItems(SCREENER_UNIVERSE, 'VOLUME_SHOCKERS').length },
    { id: 'VWAP_RECLAIM', label: 'VWAP & 20 EMA Above', count: filterScreenerItems(SCREENER_UNIVERSE, 'VWAP_RECLAIM').length },
    { id: 'RSI_BULLISH', label: 'RSI > 60', count: filterScreenerItems(SCREENER_UNIVERSE, 'RSI_BULLISH').length },
  ];

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Indian F&O Open Interest & Technical Screener
            </h2>
            <p className="text-xs text-slate-400">
              Live scan of NIFTY 50, SENSEX, and top liquid derivatives for institutional accumulation, short covering, and volume breakouts.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="NSE F&O Ticks" />
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap gap-2 bg-slate-900 border border-slate-800 rounded-lg p-3">
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded ${isActive ? 'bg-black/30 text-black' : 'bg-slate-800 text-slate-400'}`}>
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Screener Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans uppercase text-[10px]">
              <tr>
                <th className="p-3">Symbol / Instrument</th>
                <th className="p-3 text-right">LTP (₹)</th>
                <th className="p-3 text-right">Change %</th>
                <th className="p-3 text-center">F&O Buildup</th>
                <th className="p-3 text-right">OI Chg %</th>
                <th className="p-3 text-right">Vol Mult</th>
                <th className="p-3 text-center">RSI (14)</th>
                <th className="p-3 text-center">VWAP</th>
                <th className="p-3 text-center">IV Rank</th>
                <th className="p-3">AI Technical Catalyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isPositive = item.changePct >= 0;

                return (
                  <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{item.symbol}</div>
                      <div className="text-[10px] text-slate-500">{item.sector}</div>
                    </td>

                    <td className="p-3 text-right font-bold text-slate-100">
                      ₹{item.ltp.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isPositive ? '+' : ''}{item.changePct.toFixed(2)}%
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                          item.buildup === 'LONG_BUILDUP'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.buildup === 'SHORT_COVERING'
                            ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            : item.buildup === 'SHORT_BUILDUP'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {item.buildup.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3 text-right font-bold text-slate-200">
                      {item.oiChangePct >= 0 ? '+' : ''}{item.oiChangePct}%
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`font-bold ${
                          item.volumeMultiplier >= 2.0 ? 'text-amber-400 flex items-center justify-end gap-1' : 'text-slate-300'
                        }`}
                      >
                        {item.volumeMultiplier >= 2.0 && <Zap className="w-3 h-3" />}
                        {item.volumeMultiplier}x
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`font-bold ${
                          item.rsi14 >= 60 ? 'text-emerald-400' : item.rsi14 <= 40 ? 'text-rose-400' : 'text-slate-300'
                        }`}
                      >
                        {item.rsi14.toFixed(1)}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          item.aboveVwap
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {item.aboveVwap ? 'ABOVE' : 'BELOW'}
                      </span>
                    </td>

                    <td className="p-3 text-center font-bold text-slate-300">
                      {item.ivRank}%
                    </td>

                    <td className="p-3 text-slate-400 text-[11px] font-sans">
                      {item.signalTag}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
