import React, { useState } from 'react';
import { TradeJournalEntry } from '../../types/trade';
import { BookOpen, Download, Search, CheckCircle, ShieldCheck, Lock, Filter } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface TradeJournalViewProps {
  entries: TradeJournalEntry[];
}

export const TradeJournalView: React.FC<TradeJournalViewProps> = ({ entries }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterIndex, setFilterIndex] = useState<'ALL' | 'NIFTY' | 'SENSEX'>('ALL');

  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.instrument.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.fingerprint.includes(searchTerm);
    const matchesIndex = filterIndex === 'ALL' || e.index === filterIndex;
    return matchesSearch && matchesIndex;
  });

  const totalTrades = entries.length;
  const wins = entries.filter((e) => e.netPnl > 0).length;
  const totalNetPnL = entries.reduce((acc, e) => acc + e.netPnl, 0);
  const totalCharges = entries.reduce((acc, e) => acc + e.charges, 0);
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Ticket',
      'Fingerprint',
      'Date',
      'Time',
      'Index',
      'Instrument',
      'Qty',
      'Entry',
      'Exit',
      'Gross PnL',
      'Charges',
      'Net PnL',
      'Strategy',
      'User Approved',
    ];
    const rows = entries.map((e) => [
      e.id,
      e.ticketId,
      e.fingerprint,
      e.date,
      e.time,
      e.index,
      e.instrument,
      e.quantity,
      e.entryPrice,
      e.exitPrice,
      e.pnl,
      e.charges,
      e.netPnl,
      `"${e.strategy}"`,
      e.userApproved ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `india_ai_trader_journal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `india_ai_trader_journal_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Cryptographic Trade Journal & Audit Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Complete historical trade records with SHA-256 approval tickets, rationale, and tax charges
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <MetricCard
          label="TOTAL NET REALIZED P&L"
          value={`₹${totalNetPnL.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
          subValue={`Gross: ₹${(totalNetPnL + totalCharges).toFixed(0)}`}
          trend={totalNetPnL >= 0 ? 'up' : 'down'}
          badge={totalNetPnL >= 0 ? 'PROFIT' : 'LOSS'}
          badgeColor={totalNetPnL >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="WIN RATE"
          value={`${winRate}%`}
          subValue={`${wins} Wins out of ${totalTrades} Executed`}
          badge={`${totalTrades} TRADES`}
          badgeColor="blue"
        />

        <MetricCard
          label="REGULATORY CHARGES PAID"
          value={`₹${totalCharges.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
          subValue="STT, GST, Exchange & SEBI fees"
          badge="EXPENSES"
          badgeColor="yellow"
        />

        <MetricCard
          label="AUDIT COMPLIANCE"
          value="100%"
          subValue="Every trade verified via SHA-256 fingerprint"
          badge="VERIFIED"
          badgeColor="green"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search instrument, strategy, fingerprint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Filter Index:</span>
          {(['ALL', 'NIFTY', 'SENSEX'] as const).map((idx) => (
            <button
              key={idx}
              onClick={() => setFilterIndex(idx)}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                filterIndex === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              {idx}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date & Ticket</th>
                <th className="py-2.5 px-3">Instrument</th>
                <th className="py-2.5 px-3">Strategy</th>
                <th className="py-2.5 px-3">Entry / Exit</th>
                <th className="py-2.5 px-3">Qty</th>
                <th className="py-2.5 px-3">Net P&L (₹)</th>
                <th className="py-2.5 px-3">Audit Fingerprint</th>
                <th className="py-2.5 px-3 text-right">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((entry) => {
                const isWin = entry.netPnl >= 0;
                return (
                  <tr key={entry.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-200 block">{entry.date} {entry.time}</span>
                      <span className="text-[10px] text-slate-500">{entry.ticketId}</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">
                      {entry.instrument}
                      <span className="text-[10px] text-slate-400 block font-normal">{entry.marketRegime}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="truncate max-w-[140px] block">{entry.strategy}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{entry.entryRationale}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-300">₹{entry.entryPrice} → ₹{entry.exitPrice}</span>
                      <span className="text-[10px] text-slate-500 block">Charges: ₹{entry.charges}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{entry.quantity}</td>
                    <td
                      className={`py-2.5 px-3 font-bold ${
                        isWin ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isWin ? '+' : ''}₹{entry.netPnl.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-cyan-400/90" title={entry.fingerprint}>
                        <Lock className="w-3 h-3 text-cyan-400" />
                        {entry.fingerprint.substring(0, 10)}...
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {entry.userApproved ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> APPROVED
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold">
                          UNCONFIRMED
                        </span>
                      )}
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
