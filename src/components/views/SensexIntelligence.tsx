import React from 'react';
import { MarketSnapshot } from '../../lib/data/marketSimulator';
import { ChartCanvas } from '../common/ChartCanvas';
import { MetricCard } from '../common/MetricCard';
import { PaperOrderTicket } from '../../types/trade';
import { BarChart3, TrendingUp, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

interface SensexIntelligenceProps {
  snapshot: MarketSnapshot;
  onRequestApproval: (ticket: PaperOrderTicket) => void;
  onNavigate: (view: any) => void;
}

export const SensexIntelligence: React.FC<SensexIntelligenceProps> = ({
  snapshot,
  onRequestApproval,
  onNavigate,
}) => {
  const { spotPrice, priceChange, priceChangePct, candles, optionChain, volumeProfile, aiSignal } = snapshot;

  const srLevels = [
    { price: volumeProfile.vah, label: 'VAH', color: '#f59e0b' },
    { price: volumeProfile.poc, label: 'POC', color: '#06b6d4' },
    { price: volumeProfile.val, label: 'VAL', color: '#f59e0b' },
    { price: optionChain.highestCallOIStrike, label: 'CE Res', color: '#f43f5e' },
    { price: optionChain.highestPutOIStrike, label: 'PE Sup', color: '#10b981' },
  ];

  const handleProposeTrade = (optType: 'CE' | 'PE', strike: number, ltp: number) => {
    const lotSize = 20;
    const stopLoss = Number((ltp * 0.8).toFixed(1));
    const target1 = Number((ltp * 1.35).toFixed(1));
    const ticket: PaperOrderTicket = {
      ticketId: `TKT-SENSEX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      index: 'SENSEX',
      optionType: optType,
      strike,
      expiry: optionChain.expiryDate,
      orderType: 'LIMIT',
      limitPrice: ltp,
      quantity: lotSize * 2,
      lotSize,
      lots: 2,
      stopLoss,
      target1,
      target2: Number((ltp * 1.6).toFixed(1)),
      estimatedRisk: (ltp - stopLoss) * lotSize * 2,
      allowedRisk: 1500,
      estimatedCharges: 40,
      signalScore: aiSignal.score,
      strategy: 'SENSEX Strike Direct Action',
    };
    onRequestApproval(ticket);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">BSE SENSEX Intelligence & Derivatives</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                BSE 30
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Lot Size: 20 | Strike Interval: 100 pts | Expiry: Weekly Fridays
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-3 font-mono">
          <span className="text-2xl font-black text-slate-100">
            ₹{spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
          </span>
          <span
            className={`text-sm font-bold ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
          >
            {priceChange >= 0 ? '+' : ''}
            {priceChange.toFixed(2)} ({priceChangePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="ATM STRIKE"
          value={optionChain.atmStrike}
          subValue={`Strike Step: 100 pts`}
          badge="ATM"
          badgeColor="blue"
        />
        <MetricCard
          label="SENSEX PCR"
          value={optionChain.pcr.toFixed(3)}
          subValue={optionChain.pcr > 1.1 ? 'Put Writer Floor' : 'Call Resistance'}
          badge={optionChain.pcr > 1.0 ? 'BULLISH' : 'BEARISH'}
          badgeColor={optionChain.pcr > 1.0 ? 'green' : 'red'}
        />
        <MetricCard
          label="MAX PAIN STRIKE"
          value={optionChain.maxPain}
          subValue={`Gravitational Target`}
          badge="EXPIRY PULL"
          badgeColor="purple"
        />
        <MetricCard
          label="POC / VAH LEVEL"
          value={`${volumeProfile.poc}`}
          subValue={`VAH: ${volumeProfile.vah} | VAL: ${volumeProfile.val}`}
          badge={volumeProfile.acceptanceStatus}
          badgeColor="yellow"
        />
      </div>

      {/* Interactive Chart */}
      <ChartCanvas
        candles={candles}
        height={380}
        title="BSE SENSEX 5-Minute Candlestick Chart & Volume Profile Overlay"
        supportResistanceLevels={srLevels}
      />

      {/* SENSEX Active Strikes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase">
            Active SENSEX Strikes (Near ATM)
          </span>
          <button
            onClick={() => onNavigate('option_chain')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Open Full Option Chain <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950/70 text-slate-400 text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Strike</th>
                <th className="py-2.5 px-3">CE LTP (₹)</th>
                <th className="py-2.5 px-3">CE OI</th>
                <th className="py-2.5 px-3">CE Buildup</th>
                <th className="py-2.5 px-3">PE LTP (₹)</th>
                <th className="py-2.5 px-3">PE OI</th>
                <th className="py-2.5 px-3">PE Buildup</th>
                <th className="py-2.5 px-3 text-right">Paper Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {optionChain.strikes.slice(10, 20).map((s) => (
                <tr
                  key={s.strike}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    s.isAtm ? 'bg-cyan-950/20 font-bold border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-slate-200">
                    {s.strike} {s.isAtm && <span className="text-[10px] text-cyan-400 font-normal">[ATM]</span>}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{s.ce.ltp}</td>
                  <td className="py-2.5 px-3 text-slate-400">{s.ce.oi.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        s.ce.buildup === 'Long Buildup'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : s.ce.buildup === 'Short Buildup'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {s.ce.buildup}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-rose-400 font-semibold">{s.pe.ltp}</td>
                  <td className="py-2.5 px-3 text-slate-400">{s.pe.oi.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        s.pe.buildup === 'Long Buildup'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : s.pe.buildup === 'Short Buildup'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {s.pe.buildup}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleProposeTrade('CE', s.strike, s.ce.ltp)}
                        className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold"
                      >
                        Buy CE
                      </button>
                      <button
                        onClick={() => handleProposeTrade('PE', s.strike, s.pe.ltp)}
                        className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold"
                      >
                        Buy PE
                      </button>
                    </div>
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
