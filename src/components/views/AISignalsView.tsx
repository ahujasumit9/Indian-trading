import React, { useState } from 'react';
import { AISignal } from '../../types/signals';
import { MarketIndex } from '../../types/market';
import { PaperOrderTicket } from '../../types/trade';
import {
  BrainCircuit,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  PieChart,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { requestGeminiSignalAnalysis } from '../../lib/ai/geminiService';

interface AISignalsViewProps {
  signal: AISignal;
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
  spotPrice: number;
  pcr: number;
  indiaVix: number;
  pocPrice: number;
  onRequestApproval: (ticket: PaperOrderTicket) => void;
}

export const AISignalsView: React.FC<AISignalsViewProps> = ({
  signal,
  selectedUnderlying,
  onSelectUnderlying,
  spotPrice,
  pcr,
  indiaVix,
  pocPrice,
  onRequestApproval,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  const { breakdown } = signal;

  const handleFetchAiBrief = async () => {
    setIsLoadingAnalysis(true);
    try {
      const result = await requestGeminiSignalAnalysis({
        index: selectedUnderlying,
        spotPrice,
        aiSignal: signal,
        pcr,
        indiaVix,
        pocPrice,
      });
      setAiAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleProposeTrade = () => {
    const lotSize = selectedUnderlying === 'NIFTY' ? 50 : 20;
    const ticket: PaperOrderTicket = {
      ticketId: `TKT-SIG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      index: selectedUnderlying,
      optionType: signal.optionType,
      strike: signal.strike,
      expiry: signal.expiry,
      orderType: 'LIMIT',
      limitPrice: signal.suggestedEntry.current,
      quantity: lotSize * 2,
      lotSize,
      lots: 2,
      stopLoss: signal.stopLoss,
      target1: signal.target1,
      target2: signal.target2,
      estimatedRisk: (signal.suggestedEntry.current - signal.stopLoss) * lotSize * 2,
      allowedRisk: 1500,
      estimatedCharges: 42,
      signalScore: signal.score,
      strategy: signal.strategyName,
    };
    onRequestApproval(ticket);
  };

  const getPillarColor = (score: number, max: number) => {
    const ratio = score / max;
    if (ratio >= 0.7) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (ratio >= 0.45) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">
                0–100 Explainable AI Trading Signal Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                MULTI-PILLAR QUANT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Independent scoring across Trend, Momentum, Volume, Options OI, and Greeks
            </p>
          </div>
        </div>

        {/* Index Switcher */}
        <div className="flex rounded-md p-0.5 bg-slate-950 border border-slate-800 font-mono text-xs font-bold">
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

      {/* Main Signal Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Score Dial */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-lg text-center">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              COMPOSITE AI SCORE
            </span>
            <div className="relative flex items-center justify-center w-28 h-28 my-1">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div
                className={`absolute inset-0 rounded-full border-4 border-transparent ${
                  signal.score >= 75
                    ? 'border-t-emerald-400 border-r-emerald-400'
                    : signal.score <= 35
                    ? 'border-t-rose-400 border-r-rose-400'
                    : 'border-t-amber-400 border-r-amber-400'
                }`}
                style={{ transform: `rotate(${(signal.score / 100) * 360}deg)` }}
              />
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black font-mono text-slate-100">{signal.score}</span>
                <span className="text-[10px] font-mono text-slate-500">OUT OF 100</span>
              </div>
            </div>

            <div className="mt-2 text-xs font-mono">
              <span className="text-slate-500">Confidence: </span>
              <span className="text-cyan-400 font-bold">{signal.confidence}%</span>
              <span className="text-slate-500 ml-2">Uncertainty: </span>
              <span className="text-slate-400">{signal.uncertainty}%</span>
            </div>
          </div>

          {/* 2. Recommendation & Parameters */}
          <div className="space-y-3 font-mono">
            <div
              className={`p-3 rounded-lg border ${
                signal.type === 'BUY CE'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : signal.type === 'BUY PE'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              <div className="text-xs uppercase font-bold text-slate-400">Directional Signal</div>
              <div className="text-xl font-extrabold tracking-tight mt-0.5">
                {signal.type} • {signal.strike} {signal.optionType}
              </div>
              <div className="text-xs opacity-90 mt-1">Expiry: {signal.expiry}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Entry Zone:</span>
                <span className="text-slate-100 font-bold">
                  ₹{signal.suggestedEntry.min} - ₹{signal.suggestedEntry.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-400">Stop Loss:</span>
                <span className="text-rose-400 font-bold">₹{signal.stopLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Target 1 / Target 2:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{signal.target1} / ₹{signal.target2}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800/80 pt-1 text-slate-300">
                <span>Risk / Reward:</span>
                <span className="font-bold text-cyan-400">1 : {signal.riskRewardRatio}</span>
              </div>
            </div>
          </div>

          {/* 3. Action & Execution Trigger */}
          <div className="flex flex-col justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="space-y-2 text-xs font-mono">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Execution Status
              </span>
              <div className="flex justify-between text-slate-300">
                <span>Market Regime:</span>
                <span className="text-amber-400 font-bold">{signal.regime}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Primary Strategy:</span>
                <span className="text-slate-100 font-bold truncate max-w-[150px]">
                  {signal.strategyName}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Generated At:</span>
                <span>{signal.timestamp}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleProposeTrade}
                disabled={signal.type === 'NO TRADE' || signal.type === 'WAIT'}
                className={`w-full py-2.5 rounded font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  signal.type === 'BUY CE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                    : signal.type === 'BUY PE'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <span>Propose Paper Trade</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleFetchAiBrief}
                disabled={isLoadingAnalysis}
                className="w-full py-2 bg-gradient-to-r from-purple-900/40 to-cyan-900/40 hover:from-purple-900/60 hover:to-cyan-900/60 border border-purple-500/30 text-purple-200 rounded font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {isLoadingAnalysis ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>Generate Gemini AI Rationale</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Briefing Panel (if generated) */}
      {aiAnalysis && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-4 font-mono text-xs text-slate-200 shadow-md">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800 text-purple-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Gemini AI Quantitative Analyst Briefing</span>
          </div>
          <div className="prose prose-invert max-w-none text-slate-300 space-y-2 whitespace-pre-line leading-relaxed">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* 5 Pillar Breakdown Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          5-Pillar Explainable Quantitative Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
          {/* Trend 25pts */}
          <div className={`p-3 rounded-lg border ${getPillarColor(breakdown.trendScore, 25)}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">1. Trend (25 pts)</div>
            <div className="text-xl font-bold mt-1">
              {breakdown.trendScore} <span className="text-xs opacity-75">/ 25</span>
            </div>
            <div className="text-[10px] mt-1 text-slate-300">EMA 15/20 & VWAP alignment</div>
          </div>

          {/* Momentum 15pts */}
          <div className={`p-3 rounded-lg border ${getPillarColor(breakdown.momentumScore, 15)}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">2. Momentum (15 pts)</div>
            <div className="text-xl font-bold mt-1">
              {breakdown.momentumScore} <span className="text-xs opacity-75">/ 15</span>
            </div>
            <div className="text-[10px] mt-1 text-slate-300">RSI 14, MACD, Supertrend</div>
          </div>

          {/* Volume 20pts */}
          <div className={`p-3 rounded-lg border ${getPillarColor(breakdown.volumeScore, 20)}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">3. Volume (20 pts)</div>
            <div className="text-xl font-bold mt-1">
              {breakdown.volumeScore} <span className="text-xs opacity-75">/ 20</span>
            </div>
            <div className="text-[10px] mt-1 text-slate-300">Volume Surge & POC Breakout</div>
          </div>

          {/* Options OI 25pts */}
          <div className={`p-3 rounded-lg border ${getPillarColor(breakdown.oiScore, 25)}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">4. Options OI (25 pts)</div>
            <div className="text-xl font-bold mt-1">
              {breakdown.oiScore} <span className="text-xs opacity-75">/ 25</span>
            </div>
            <div className="text-[10px] mt-1 text-slate-300">PCR & Institutional Buildup</div>
          </div>

          {/* Greeks 15pts */}
          <div className={`p-3 rounded-lg border ${getPillarColor(breakdown.greeksScore, 15)}`}>
            <div className="text-[10px] uppercase font-bold text-slate-400">5. Greeks & IV (15 pts)</div>
            <div className="text-xl font-bold mt-1">
              {breakdown.greeksScore} <span className="text-xs opacity-75">/ 15</span>
            </div>
            <div className="text-[10px] mt-1 text-slate-300">VIX, Delta & Bid/Ask Spread</div>
          </div>
        </div>
      </div>

      {/* Supporting vs Contradictory Evidence Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporting */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-emerald-400 font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>Supporting Quantitative Evidence ({signal.supportingEvidence.length})</span>
          </div>
          <div className="space-y-2">
            {signal.supportingEvidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-2 text-slate-200">
                <span className="text-emerald-400 shrink-0">✔</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contradictory */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-rose-400 font-bold">
            <XCircle className="w-4 h-4" />
            <span>Contradictory / Risk Caveats ({signal.contradictoryEvidence.length})</span>
          </div>
          <div className="space-y-2">
            {signal.contradictoryEvidence.length === 0 ? (
              <div className="text-slate-500 italic">No significant conflicting indicators detected.</div>
            ) : (
              signal.contradictoryEvidence.map((ev, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-rose-400 shrink-0">✖</span>
                  <span>{ev}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
