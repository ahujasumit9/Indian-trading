import React from 'react';
import { MarketSnapshot } from '../../lib/data/marketSimulator';
import { ChartCanvas } from '../common/ChartCanvas';
import { PaperOrderTicket, PaperPosition } from '../../types/trade';
import {
  BrainCircuit,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface MarketOverviewProps {
  niftySnapshot: MarketSnapshot;
  sensexSnapshot: MarketSnapshot;
  selectedUnderlying: 'NIFTY' | 'SENSEX';
  onSelectUnderlying: (idx: 'NIFTY' | 'SENSEX') => void;
  onRequestApproval: (ticket: PaperOrderTicket) => void;
  openPositions: PaperPosition[];
  onNavigate: (view: any) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  niftySnapshot,
  sensexSnapshot,
  selectedUnderlying,
  onSelectUnderlying,
  onRequestApproval,
  openPositions,
  onNavigate,
}) => {
  const activeSnapshot = selectedUnderlying === 'NIFTY' ? niftySnapshot : sensexSnapshot;
  const { spotPrice, candles, volumeProfile, aiSignal, optionChain } = activeSnapshot;

  const srLevels = [
    { price: volumeProfile.vah, label: 'VAH', color: '#f59e0b' },
    { price: volumeProfile.poc, label: 'POC', color: '#06b6d4' },
    { price: volumeProfile.val, label: 'VAL', color: '#f59e0b' },
    { price: optionChain.highestCallOIStrike, label: 'CE Wall (Res)', color: '#f43f5e' },
    { price: optionChain.highestPutOIStrike, label: 'PE Wall (Sup)', color: '#10b981' },
  ];

  const handleQuickTrade = () => {
    const lotSize = selectedUnderlying === 'NIFTY' ? 50 : 20;
    const ticket: PaperOrderTicket = {
      ticketId: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      index: selectedUnderlying,
      optionType: aiSignal.optionType,
      strike: aiSignal.strike,
      expiry: aiSignal.expiry,
      orderType: 'LIMIT',
      limitPrice: aiSignal.suggestedEntry.current,
      quantity: lotSize * 2,
      lotSize,
      lots: 2,
      stopLoss: aiSignal.stopLoss,
      target1: aiSignal.target1,
      target2: aiSignal.target2,
      estimatedRisk: (aiSignal.suggestedEntry.current - aiSignal.stopLoss) * lotSize * 2,
      allowedRisk: 1500,
      estimatedCharges: 45,
      signalScore: aiSignal.score,
      strategy: aiSignal.strategyName,
    };
    onRequestApproval(ticket);
  };

  return (
    <div className="space-y-4">
      {/* Underlying Index Switcher & Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">ACTIVE INDEX:</span>
          <div className="flex rounded-md p-0.5 bg-slate-950 border border-slate-800 font-mono text-xs font-bold">
            <button
              onClick={() => onSelectUnderlying('NIFTY')}
              className={`px-3 py-1.5 rounded transition-all ${
                selectedUnderlying === 'NIFTY'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NIFTY 50 (₹{niftySnapshot.spotPrice})
            </button>
            <button
              onClick={() => onSelectUnderlying('SENSEX')}
              className={`px-3 py-1.5 rounded transition-all ${
                selectedUnderlying === 'SENSEX'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BSE SENSEX (₹{sensexSnapshot.spotPrice})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Market Regime:</span>
            <span className="font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
              {aiSignal.regime}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Data Source:</span>
            <span className="text-slate-300 font-bold">{optionChain.dataSource}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart + Live AI Signal Setup Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: High-Res Interactive Candlestick Chart */}
        <div className="lg:col-span-2 space-y-3">
          <ChartCanvas
            candles={candles}
            height={380}
            title={`${selectedUnderlying} Intraday Price Action & Indicators`}
            supportResistanceLevels={srLevels}
          />

          {/* Quick Key Levels Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">POC (Point of Control)</span>
              <span className="font-bold text-cyan-400">{volumeProfile.poc}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Value Area (VAH / VAL)</span>
              <span className="font-bold text-amber-400">
                {volumeProfile.vah} / {volumeProfile.val}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Max Pain Strike</span>
              <span className="font-bold text-purple-400">{optionChain.maxPain}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 text-center">
              <span className="text-[10px] text-slate-500 block uppercase">Call/Put OI Walls</span>
              <span className="font-bold text-slate-200">
                {optionChain.highestCallOIStrike} / {optionChain.highestPutOIStrike}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: AI Signal & Direct Paper Action Proposal */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-sm relative overflow-hidden">
            {/* Top Score Banner */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm text-slate-100">Live AI Signal Score</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-cyan-400 font-mono">{aiSignal.score}</span>
                <span className="text-xs text-slate-500 font-mono">/100</span>
              </div>
            </div>

            {/* Action Badge & Recommendation */}
            <div
              className={`rounded-lg p-3 mb-3 border font-mono ${
                aiSignal.type === 'BUY CE'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : aiSignal.type === 'BUY PE'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Setup Recommendation</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/40">
                  {aiSignal.confidence}% Confidence
                </span>
              </div>
              <div className="text-lg font-black tracking-tight">
                {aiSignal.type} • {aiSignal.strike} {aiSignal.optionType}
              </div>
              <div className="text-xs opacity-90 mt-1">
                Strategy: {aiSignal.strategyName}
              </div>
            </div>

            {/* Price Targets & Stops */}
            <div className="space-y-2 text-xs font-mono mb-4 bg-slate-950 p-3 rounded border border-slate-800/80">
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Range:</span>
                <span className="font-bold text-slate-200">
                  ₹{aiSignal.suggestedEntry.min} - ₹{aiSignal.suggestedEntry.max} (Cur: ₹
                  {aiSignal.suggestedEntry.current})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Stop Loss:</span>
                <span className="font-bold text-rose-400">₹{aiSignal.stopLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Target 1 / Target 2:</span>
                <span className="font-bold text-emerald-400">
                  ₹{aiSignal.target1} / ₹{aiSignal.target2}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5 text-slate-300">
                <span>Risk / Reward:</span>
                <span className="font-bold text-cyan-400">1 : {aiSignal.riskRewardRatio}</span>
              </div>
            </div>

            {/* Quick Evidence Highlight */}
            <div className="space-y-1 mb-4">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                Primary Supporting Logic
              </span>
              {aiSignal.supportingEvidence.slice(0, 2).map((ev, i) => (
                <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 font-mono">
                  <span className="text-emerald-400">✔</span>
                  <span className="truncate">{ev}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleQuickTrade}
                disabled={aiSignal.type === 'NO TRADE' || aiSignal.type === 'WAIT'}
                className={`w-full py-2.5 rounded font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  aiSignal.type === 'BUY CE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : aiSignal.type === 'BUY PE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>Propose Paper Trade</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('signals')}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-cyan-400 rounded font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Full 0-100 Score Breakdown</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
