import React, { useState } from 'react';
import { Candle, MarketIndex } from '../../types/market';
import { ChartCanvas } from '../common/ChartCanvas';
import { MetricCard } from '../common/MetricCard';
import { CandlestickChart, Activity, Sliders, CheckSquare, Square } from 'lucide-react';

interface TechnicalAnalysisViewProps {
  candles: Candle[];
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
}

export const TechnicalAnalysisView: React.FC<TechnicalAnalysisViewProps> = ({
  candles,
  selectedUnderlying,
  onSelectUnderlying,
}) => {
  const [indicators, setIndicators] = useState({
    ema15: true,
    ema20: true,
    ema50: true,
    vwap: true,
  });

  const last = candles[candles.length - 1] || ({} as Candle);
  const prev = candles[candles.length - 2] || ({} as Candle);

  // EMA 15/20 Crossover calculation
  const emaCrossedUp = (prev.ema15 || 0) <= (prev.ema20 || 0) && (last.ema15 || 0) > (last.ema20 || 0);
  const emaCrossedDown = (prev.ema15 || 0) >= (prev.ema20 || 0) && (last.ema15 || 0) < (last.ema20 || 0);
  const emaBullishAligned = (last.ema15 || 0) > (last.ema20 || 0);

  // VWAP confirmation
  const isAboveVwap = last.close > (last.vwap || last.close);

  // Volume Expansion
  const isVolExpanding = (last.volume || 0) > (last.volumeMA || 1) * 1.25;

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CandlestickChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Technical Analysis & Indicator Engine</h2>
            <p className="text-xs text-slate-400 font-mono">
              Multi-indicator confluence: EMA 9/15/20/50, VWAP, RSI 14, MACD, Supertrend, ATR, Bollinger Bands
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

      {/* Indicator Visibility Toggles */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 border border-slate-800 px-4 py-2.5 rounded-lg text-xs font-mono">
        <span className="text-slate-400 flex items-center gap-1 font-bold">
          <Sliders className="w-3.5 h-3.5" /> Toggle Overlays:
        </span>

        <button
          onClick={() => setIndicators((p) => ({ ...p, vwap: !p.vwap }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            indicators.vwap
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          {indicators.vwap ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          <span>VWAP (₹{last.vwap || '-'})</span>
        </button>

        <button
          onClick={() => setIndicators((p) => ({ ...p, ema15: !p.ema15 }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            indicators.ema15
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          {indicators.ema15 ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          <span>EMA 15 (₹{last.ema15 || '-'})</span>
        </button>

        <button
          onClick={() => setIndicators((p) => ({ ...p, ema20: !p.ema20 }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            indicators.ema20
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          {indicators.ema20 ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          <span>EMA 20 (₹{last.ema20 || '-'})</span>
        </button>

        <button
          onClick={() => setIndicators((p) => ({ ...p, ema50: !p.ema50 }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
            indicators.ema50
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          {indicators.ema50 ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
          <span>EMA 50 (₹{last.ema50 || '-'})</span>
        </button>
      </div>

      {/* Main Chart */}
      <ChartCanvas
        candles={candles}
        height={400}
        showIndicators={indicators}
        title={`${selectedUnderlying} Institutional Technical Matrix`}
      />

      {/* Indicator Dashboard KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
        <MetricCard
          label="EMA 15 / 20 STATE"
          value={emaBullishAligned ? 'BULLISH' : 'BEARISH'}
          subValue={`EMA15: ${last.ema15} | EMA20: ${last.ema20}`}
          badge={emaCrossedUp ? 'BULL CROSS' : emaCrossedDown ? 'BEAR CROSS' : 'ALIGNED'}
          badgeColor={emaBullishAligned ? 'green' : 'red'}
        />

        <MetricCard
          label="VWAP CONFIRMATION"
          value={isAboveVwap ? 'ABOVE VWAP' : 'BELOW VWAP'}
          subValue={`VWAP: ₹${last.vwap} (Diff: ${(last.close - (last.vwap || last.close)).toFixed(1)})`}
          badge={isAboveVwap ? 'BUYER DOMINANCE' : 'SELLER DOMINANCE'}
          badgeColor={isAboveVwap ? 'green' : 'red'}
        />

        <MetricCard
          label="RSI 14"
          value={last.rsi14 || '-'}
          subValue={
            (last.rsi14 || 50) > 70
              ? 'Overbought (>70)'
              : (last.rsi14 || 50) < 30
              ? 'Oversold (<30)'
              : 'Healthy Momentum'
          }
          badge={(last.rsi14 || 50) >= 55 ? 'EXPANSION' : 'CONTRACTION'}
          badgeColor={(last.rsi14 || 50) >= 55 ? 'green' : 'yellow'}
        />

        <MetricCard
          label="MACD (12, 26, 9)"
          value={`${last.macd || '-'}`}
          subValue={`Signal: ${last.macdSignal || '-'} | Hist: ${last.macdHist || '-'}`}
          badge={(last.macd || 0) > (last.macdSignal || 0) ? 'BULLISH' : 'BEARISH'}
          badgeColor={(last.macd || 0) > (last.macdSignal || 0) ? 'green' : 'red'}
        />

        <MetricCard
          label="SUPERTREND (10, 3)"
          value={`₹${last.supertrend || '-'}`}
          subValue={`Trailing Stop Cushion`}
          badge={last.supertrendDir || 'UP'}
          badgeColor={last.supertrendDir === 'UP' ? 'green' : 'red'}
        />

        <MetricCard
          label="ATR 14 VOLATILITY"
          value={`₹${last.atr14 || '-'}`}
          subValue={`Dynamic Target/Stop Basis`}
          badge="INTRADAY"
          badgeColor="blue"
        />
      </div>
    </div>
  );
};
