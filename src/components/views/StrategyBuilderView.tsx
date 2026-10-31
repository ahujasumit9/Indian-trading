import React from 'react';
import { TradingStrategy } from '../../types/signals';
import { Sliders, CheckSquare, Square, Info } from 'lucide-react';
import { Candle, OptionChainData, VolumeProfileData } from '../../types/market';
import { evaluateStrategies } from '../../lib/engine/strategies';

interface StrategyBuilderViewProps {
  strategies: TradingStrategy[];
  onToggleStrategy: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
  candles: Candle[];
  optionChain: OptionChainData;
  volumeProfile: VolumeProfileData;
}

export const StrategyBuilderView: React.FC<StrategyBuilderViewProps> = ({
  strategies,
  onToggleStrategy,
  onUpdateWeight,
  candles,
  optionChain,
  volumeProfile,
}) => {
  const evaluations = evaluateStrategies(strategies, candles, optionChain, volumeProfile);

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Algorithmic Strategy Builder (10 Core Setups)
            </h2>
            <p className="text-xs text-slate-400">
              Customize, activate, and weight quantitative index option strategies
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Active Setups:{' '}
          <span className="font-bold text-cyan-400">
            {strategies.filter((s) => s.enabled).length} / {strategies.length}
          </span>
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((strat) => {
          const evalResult = evaluations.find((e) => e.strategyId === strat.id);

          return (
            <div
              key={strat.id}
              className={`p-4 rounded-lg border transition-all ${
                strat.enabled
                  ? 'bg-slate-900 border-slate-700/80'
                  : 'bg-slate-950/60 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Top Controls */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStrategy(strat.id)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {strat.enabled ? (
                      <CheckSquare className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </button>
                  <h3 className="font-bold text-sm text-slate-100 font-sans">{strat.name}</h3>
                </div>

                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {strat.category}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 font-sans mb-3">{strat.description}</p>

              {/* Strategy Rules */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 mb-3 space-y-1 text-[11px]">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Trigger Parameters
                </span>
                {strat.rules.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                    <span className="text-cyan-400">•</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>

              {/* Live Status & Weighting */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Live Status:</span>
                  {evalResult && evalResult.active ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        evalResult.direction === 'BULLISH'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {evalResult.direction} ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">Waiting for trigger</span>
                  )}
                </div>

                {/* Weight slider */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Weight:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={strat.weight}
                    onChange={(e) => onUpdateWeight(strat.id, parseFloat(e.target.value))}
                    disabled={!strat.enabled}
                    className="w-16 accent-cyan-500"
                  />
                  <span className="font-bold text-slate-200">{strat.weight.toFixed(1)}x</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
