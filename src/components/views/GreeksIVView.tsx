import React, { useState } from 'react';
import { OptionChainData, MarketIndex } from '../../types/market';
import { Activity, Calculator, TrendingUp, Sliders } from 'lucide-react';
import { calculateBSPrice, calculateGreeks } from '../../lib/math/blackScholes';
import { MetricCard } from '../common/MetricCard';

interface GreeksIVViewProps {
  optionChain: OptionChainData;
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
}

export const GreeksIVView: React.FC<GreeksIVViewProps> = ({
  optionChain,
  selectedUnderlying,
  onSelectUnderlying,
}) => {
  const { spotPrice, atmStrike, strikes } = optionChain;

  // Option Calculator State
  const [calcSpot, setCalcSpot] = useState<number>(spotPrice);
  const [calcStrike, setCalcStrike] = useState<number>(atmStrike);
  const [calcDTE, setCalcDTE] = useState<number>(4);
  const [calcIV, setCalcIV] = useState<number>(14.5);
  const [calcType, setCalcType] = useState<'CE' | 'PE'>('CE');

  const T = Math.max(0.1, calcDTE) / 365;
  const theoreticalPrice = calculateBSPrice(calcSpot, calcStrike, T, 0.068, calcIV / 100, calcType);
  const calculatedGreeks = calculateGreeks(calcSpot, calcStrike, T, 0.068, calcIV / 100, calcType);

  // Near ATM strikes for IV Skew table
  const atmIdx = strikes.findIndex((s) => s.strike === atmStrike);
  const nearStrikes = strikes.slice(Math.max(0, atmIdx - 5), Math.min(strikes.length, atmIdx + 6));

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Option Greeks & Implied Volatility (IV) Surface
            </h2>
            <p className="text-xs text-slate-400">
              Black-Scholes analytical model: Delta, Gamma, Theta, Vega, and dynamic IV smile curve
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

      {/* Main Grid: Greeks Definition & Matrix + Interactive Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Greeks Matrix Across Strikes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase">
                Greeks Matrix by Strike (Current Expiry)
              </span>
              <span className="text-xs text-slate-400">Underlying Spot: ₹{spotPrice}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Strike</th>
                    <th className="py-2.5 px-2 text-emerald-400">CE IV</th>
                    <th className="py-2.5 px-2 text-emerald-400">CE Delta</th>
                    <th className="py-2.5 px-2 text-emerald-400">CE Theta</th>
                    <th className="py-2.5 px-2 text-purple-400">Gamma</th>
                    <th className="py-2.5 px-2 text-blue-400">Vega</th>
                    <th className="py-2.5 px-2 text-rose-400">PE Theta</th>
                    <th className="py-2.5 px-2 text-rose-400">PE Delta</th>
                    <th className="py-2.5 px-2 text-rose-400">PE IV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {nearStrikes.map((s) => {
                    const isAtm = s.isAtm;
                    return (
                      <tr
                        key={s.strike}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isAtm ? 'bg-cyan-950/20 font-bold border-l-2 border-cyan-400' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-200">
                          {s.strike} {isAtm && <span className="text-cyan-400 text-[10px]">[ATM]</span>}
                        </td>
                        <td className="py-2.5 px-2 text-slate-400">{s.ce.iv}%</td>
                        <td className="py-2.5 px-2 text-emerald-400 font-semibold">{s.ce.greeks?.delta}</td>
                        <td className="py-2.5 px-2 text-rose-400/80">{s.ce.greeks?.theta}</td>
                        <td className="py-2.5 px-2 text-purple-300 font-mono text-[11px]">{s.ce.greeks?.gamma}</td>
                        <td className="py-2.5 px-2 text-blue-300 font-semibold">{s.ce.greeks?.vega}</td>
                        <td className="py-2.5 px-2 text-rose-400/80">{s.pe.greeks?.theta}</td>
                        <td className="py-2.5 px-2 text-rose-400 font-semibold">{s.pe.greeks?.delta}</td>
                        <td className="py-2.5 px-2 text-slate-400">{s.pe.iv}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Greek Explanations Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
              <span className="text-emerald-400 font-bold block mb-1">DELTA (Δ)</span>
              <p className="text-[11px] text-slate-400">
                Rate of change of option price per ₹1 move in index spot. ATM is ~0.50.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
              <span className="text-purple-400 font-bold block mb-1">GAMMA (Γ)</span>
              <p className="text-[11px] text-slate-400">
                Rate of change of Delta. Highest at ATM near expiry (causes sudden gamma spikes).
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
              <span className="text-rose-400 font-bold block mb-1">THETA (Θ)</span>
              <p className="text-[11px] text-slate-400">
                Expected daily premium loss due to time decay. Accelerates non-linearly in final 48h.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2.5">
              <span className="text-blue-400 font-bold block mb-1">VEGA (ν)</span>
              <p className="text-[11px] text-slate-400">
                Option price sensitivity to a 1% change in Implied Volatility (IV).
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Black-Scholes Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              Black-Scholes Greek Calculator
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Option Type Switcher */}
            <div className="flex rounded-md p-0.5 bg-slate-950 border border-slate-800">
              <button
                onClick={() => setCalcType('CE')}
                className={`flex-1 py-1.5 rounded transition-all font-bold ${
                  calcType === 'CE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400'
                }`}
              >
                CALL (CE)
              </button>
              <button
                onClick={() => setCalcType('PE')}
                className={`flex-1 py-1.5 rounded transition-all font-bold ${
                  calcType === 'PE'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400'
                }`}
              >
                PUT (PE)
              </button>
            </div>

            {/* Spot Input */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Spot Price (₹)</label>
              <input
                type="number"
                value={calcSpot}
                onChange={(e) => setCalcSpot(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Strike Input */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Strike Price (₹)</label>
              <input
                type="number"
                value={calcStrike}
                onChange={(e) => setCalcStrike(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* DTE Input */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Days to Expiry (DTE): {calcDTE} days
              </label>
              <input
                type="range"
                min="0.2"
                max="30"
                step="0.5"
                value={calcDTE}
                onChange={(e) => setCalcDTE(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* IV Input */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">
                Implied Volatility (IV): {calcIV}%
              </label>
              <input
                type="range"
                min="8"
                max="45"
                step="0.5"
                value={calcIV}
                onChange={(e) => setCalcIV(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Calculated Output Box */}
            <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex justify-between items-baseline border-b border-slate-800 pb-2">
                <span className="text-slate-400">Theoretical BS Premium:</span>
                <span className="text-lg font-black text-cyan-400">
                  ₹{theoreticalPrice.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delta:</span>
                  <span className="font-bold text-slate-200">{calculatedGreeks.delta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gamma:</span>
                  <span className="font-bold text-slate-200">{calculatedGreeks.gamma}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Theta / Day:</span>
                  <span className="font-bold text-rose-400">₹{calculatedGreeks.theta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vega / 1%:</span>
                  <span className="font-bold text-blue-400">₹{calculatedGreeks.vega}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
