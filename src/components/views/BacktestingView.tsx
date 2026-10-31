import React, { useState } from 'react';
import { Candle, MarketIndex } from '../../types/market';
import { BacktestResult, runBacktest } from '../../lib/engine/backtester';
import { History, Play, TrendingUp, AlertTriangle, ArrowDownRight, Layers } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface BacktestingViewProps {
  candles: Candle[];
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({
  candles,
  selectedUnderlying,
  onSelectUnderlying,
}) => {
  const [strategyId, setStrategyId] = useState<string>('strat_1');
  const [capital, setCapital] = useState<number>(100000);
  const [riskPct, setRiskPct] = useState<number>(1.5);
  const [slippagePct, setSlippagePct] = useState<number>(0.4);

  const [result, setResult] = useState<BacktestResult>(() =>
    runBacktest({
      candles,
      index: selectedUnderlying,
      strategyId: 'strat_1',
      initialCapital: 100000,
      riskPerTradePct: 1.5,
      slippagePct: 0.4,
    })
  );

  const handleRunTest = () => {
    const res = runBacktest({
      candles,
      index: selectedUnderlying,
      strategyId,
      initialCapital: capital,
      riskPerTradePct: riskPct,
      slippagePct,
    });
    setResult(res);
  };

  // Equity Curve Canvas
  const maxEquity = Math.max(...result.equityCurve.map((e) => e.equity), capital * 1.05);
  const minEquity = Math.min(...result.equityCurve.map((e) => e.equity), capital * 0.95);
  const eqRange = maxEquity - minEquity || 1;

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Quantitative Options Backtester
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates historical candle sessions with realistic slippage, STT/exchange fees, and equity drawdown
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

      {/* Configuration Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1">Strategy</label>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="strat_1">EMA 15/20 + VWAP Confirmation</option>
            <option value="strat_2">VWAP Breakout + Volume Expansion</option>
            <option value="strat_7">Trend Continuation (Supertrend)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1">Starting Capital (₹)</label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(parseFloat(e.target.value) || 100000)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1">Risk Per Trade (%)</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="5"
            value={riskPct}
            onChange={(e) => setRiskPct(parseFloat(e.target.value) || 1.5)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 uppercase block mb-1">Slippage & Impact (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={slippagePct}
            onChange={(e) => setSlippagePct(parseFloat(e.target.value) || 0.4)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleRunTest}
            className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Run Backtest</span>
          </button>
        </div>
      </div>

      {/* Backtest KPI Result Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <MetricCard
          label="TOTAL NET P&L"
          value={`₹${result.totalPnL.toLocaleString('en-IN')}`}
          subValue={`ROI: ${result.totalReturnPct}%`}
          trend={result.totalPnL >= 0 ? 'up' : 'down'}
          badge={result.totalPnL >= 0 ? 'PROFIT' : 'LOSS'}
          badgeColor={result.totalPnL >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="WIN RATE"
          value={`${result.winRatePct}%`}
          subValue={`${result.winningTrades} W / ${result.losingTrades} L (${result.totalTrades} Total)`}
          badge={`${result.totalTrades} TRADES`}
          badgeColor={result.winRatePct >= 50 ? 'green' : 'yellow'}
        />

        <MetricCard
          label="PROFIT FACTOR"
          value={result.profitFactor.toFixed(2)}
          subValue="Gross Gains / Gross Losses"
          badge={result.profitFactor >= 1.5 ? 'SOLID' : 'MARGINAL'}
          badgeColor={result.profitFactor >= 1.5 ? 'green' : 'yellow'}
        />

        <MetricCard
          label="MAX DRAWDOWN"
          value={`-${result.maxDrawdownPct}%`}
          subValue={`-₹${result.maxDrawdownINR.toLocaleString('en-IN')}`}
          badge="RISK PROFILE"
          badgeColor={result.maxDrawdownPct < 8 ? 'green' : 'red'}
        />

        <MetricCard
          label="AVG WIN / LOSS"
          value={`₹${result.avgWin.toFixed(0)}`}
          subValue={`Loss: ₹${result.avgLoss.toFixed(0)}`}
          badge={`1:${result.riskRewardAchieved}`}
          badgeColor="blue"
        />

        <MetricCard
          label="ENDING CAPITAL"
          value={`₹${result.endingCapital.toLocaleString('en-IN')}`}
          subValue={`Start: ₹${result.initialCapital.toLocaleString('en-IN')}`}
          badge="CAPITAL"
          badgeColor="blue"
        />
      </div>

      {/* Simulated Equity Curve */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-xs">
          <span className="font-bold text-slate-200 uppercase">
            Equity Growth Curve ({selectedUnderlying} - {result.strategyName})
          </span>
          <span className="text-slate-500">
            {result.equityCurve.length} checkpoints recorded
          </span>
        </div>

        {/* SVG Equity Chart */}
        <div className="h-44 w-full bg-slate-950 rounded p-2 relative flex items-end">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Grid baseline at capital */}
            <line
              x1="0"
              y1={100 - ((capital - minEquity) / eqRange) * 100}
              x2="100"
              y2={100 - ((capital - minEquity) / eqRange) * 100}
              stroke="#334155"
              strokeDasharray="2,2"
              strokeWidth="0.8"
            />
            {/* Polyline */}
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              points={result.equityCurve
                .map((eq, idx) => {
                  const x = (idx / Math.max(1, result.equityCurve.length - 1)) * 100;
                  const y = 100 - ((eq.equity - minEquity) / eqRange) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
        </div>
      </div>

      {/* Historical Trade Execution Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase">
          Backtest Trade Audit Ledger
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Trade #</th>
                <th className="py-2.5 px-3">Entry Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Entry ₹</th>
                <th className="py-2.5 px-3">Exit ₹</th>
                <th className="py-2.5 px-3">Qty</th>
                <th className="py-2.5 px-3">Charges ₹</th>
                <th className="py-2.5 px-3">Exit Trigger</th>
                <th className="py-2.5 px-3 text-right">Net P&L (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {result.trades.map((t) => (
                <tr key={t.tradeId} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 text-slate-400">{t.tradeId}</td>
                  <td className="py-2 px-3 text-slate-300">{t.entryDate}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        t.direction === 'LONG_CE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {t.direction}
                    </span>
                  </td>
                  <td className="py-2 px-3">₹{t.entryPrice}</td>
                  <td className="py-2 px-3">₹{t.exitPrice}</td>
                  <td className="py-2 px-3 text-slate-400">{t.quantity}</td>
                  <td className="py-2 px-3 text-slate-500">₹{t.charges}</td>
                  <td className="py-2 px-3 text-[10px] text-slate-400">{t.exitReason}</td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      t.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {t.netPnL >= 0 ? '+' : ''}₹{t.netPnL.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
