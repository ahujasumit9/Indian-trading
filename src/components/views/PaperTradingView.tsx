import React, { useState } from 'react';
import { PaperOrderTicket, PaperPosition, RiskSettings } from '../../types/trade';
import { Briefcase, ArrowUpRight, ArrowDownRight, XCircle, CheckCircle, ShieldCheck, Plus } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface PaperTradingViewProps {
  positions: PaperPosition[];
  onClosePosition: (id: string, exitPrice?: number) => void;
  onRequestApproval: (ticket: PaperOrderTicket) => void;
  riskSettings: RiskSettings;
}

export const PaperTradingView: React.FC<PaperTradingViewProps> = ({
  positions,
  onClosePosition,
  onRequestApproval,
  riskSettings,
}) => {
  // Custom Ticket Form State
  const [index, setIndex] = useState<'NIFTY' | 'SENSEX'>('NIFTY');
  const [optionType, setOptionType] = useState<'CE' | 'PE'>('CE');
  const [strike, setStrike] = useState<number>(24200);
  const [price, setPrice] = useState<number>(115);
  const [stopLoss, setStopLoss] = useState<number>(95);
  const [target, setTarget] = useState<number>(145);
  const [lots, setLots] = useState<number>(2);

  const lotSize = index === 'NIFTY' ? 50 : 20;
  const quantity = lots * lotSize;
  const estimatedRisk = (price - stopLoss) * quantity;

  const totalUnrealized = positions.reduce((acc, p) => acc + p.unrealizedPnL, 0);

  const handleCreateCustomTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket: PaperOrderTicket = {
      ticketId: `TKT-CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      index,
      optionType,
      strike,
      expiry: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      orderType: 'LIMIT',
      limitPrice: price,
      quantity,
      lotSize,
      lots,
      stopLoss,
      target1: target,
      target2: Number((target * 1.2).toFixed(1)),
      estimatedRisk,
      allowedRisk: (riskSettings.accountCapital * riskSettings.maxRiskPerTradePercent) / 100,
      estimatedCharges: 40,
      signalScore: 75,
      strategy: 'Manual Custom Paper Setup',
    };
    onRequestApproval(ticket);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Paper Trading & Order Execution Desk
            </h2>
            <p className="text-xs text-slate-400">
              Simulated institutional execution ledger with strict cryptographic manual approval gate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            SAFE SIMULATION ENVIRONMENT
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <MetricCard
          label="ACTIVE OPEN POSITIONS"
          value={positions.length}
          subValue={`Cap: ${riskSettings.maxOpenPositions} positions allowed`}
          badge={positions.length > 0 ? 'ACTIVE' : 'FLAT'}
          badgeColor={positions.length > 0 ? 'green' : 'blue'}
        />

        <MetricCard
          label="UNREALIZED MTM P&L"
          value={`₹${totalUnrealized.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
          subValue="Live mark-to-market position gain/loss"
          trend={totalUnrealized >= 0 ? 'up' : 'down'}
          badge={totalUnrealized >= 0 ? 'GAIN' : 'LOSS'}
          badgeColor={totalUnrealized >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="TRADING CAPITAL"
          value={`₹${riskSettings.accountCapital.toLocaleString('en-IN')}`}
          subValue={`Max risk/trade: ${riskSettings.maxRiskPerTradePercent}%`}
          badge="CAPITAL"
          badgeColor="blue"
        />

        <MetricCard
          label="DAILY LOSS CAP"
          value={`₹${riskSettings.maxDailyLoss.toLocaleString('en-IN')}`}
          subValue="Auto circuit breaker limit"
          badge="GUARD"
          badgeColor="purple"
        />
      </div>

      {/* Active Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase">
            Active Open Paper Positions ({positions.length})
          </span>
          <span className="text-xs text-slate-500">Live P&L updates with tick stream</span>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No open paper positions. Review live setups in AI Signals or Option Chain to propose an approved paper trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Position</th>
                  <th className="py-2.5 px-3">Qty (Lots)</th>
                  <th className="py-2.5 px-3">Entry (₹)</th>
                  <th className="py-2.5 px-3">LTP (₹)</th>
                  <th className="py-2.5 px-3">Stop Loss</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">MTM P&L (₹)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnL >= 0;
                  return (
                    <tr key={pos.positionId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-100">
                        {pos.index} {pos.strike} {pos.optionType}
                        <span className="text-[10px] text-slate-500 block">{pos.strategy}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {pos.quantity} ({pos.lots} lots)
                      </td>
                      <td className="py-2.5 px-3">₹{pos.entryPrice}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">₹{pos.currentPrice}</td>
                      <td className="py-2.5 px-3 text-rose-400">₹{pos.stopLoss}</td>
                      <td className="py-2.5 px-3 text-emerald-400">₹{pos.target1}</td>
                      <td
                        className={`py-2.5 px-3 font-bold ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}₹{pos.unrealizedPnL.toFixed(2)} ({pos.unrealizedPnLPercent.toFixed(1)}%)
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onClosePosition(pos.positionId, pos.currentPrice)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition-all"
                        >
                          Close Position
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Custom Paper Order Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
          <Plus className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-xs uppercase text-slate-200">
            Create Custom Paper Order Ticket (Routes to Approval Gate)
          </h3>
        </div>

        <form onSubmit={handleCreateCustomTicket} className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Index</label>
            <select
              value={index}
              onChange={(e) => setIndex(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
            >
              <option value="NIFTY">NIFTY 50</option>
              <option value="SENSEX">BSE SENSEX</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Option Type</label>
            <select
              value={optionType}
              onChange={(e) => setOptionType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
            >
              <option value="CE">CALL (CE)</option>
              <option value="PE">PUT (PE)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Strike (₹)</label>
            <input
              type="number"
              value={strike}
              onChange={(e) => setStrike(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Entry Premium (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase block mb-1">Stop Loss (₹)</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-900/30"
            >
              <span>Validate & Route</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
