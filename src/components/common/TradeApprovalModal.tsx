import React, { useState } from 'react';
import { PaperOrderTicket, RiskValidationResult } from '../../types/trade';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, ArrowRight, Lock } from 'lucide-react';
import { validateTrade, calculateIndianOptionCharges } from '../../lib/engine/riskEngine';
import { RiskSettings } from '../../types/trade';

interface TradeApprovalModalProps {
  ticket: PaperOrderTicket | null;
  fingerprint: string;
  riskSettings: RiskSettings;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (ticket: PaperOrderTicket, fingerprint: string) => void;
  onReject: (ticket: PaperOrderTicket) => void;
}

export const TradeApprovalModal: React.FC<TradeApprovalModalProps> = ({
  ticket,
  fingerprint,
  riskSettings,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!isOpen || !ticket) return null;

  const [lots, setLots] = useState(ticket.lots);
  const [stopLoss, setStopLoss] = useState(ticket.stopLoss);
  const [target1, setTarget1] = useState(ticket.target1);

  const quantity = lots * ticket.lotSize;
  const currentRiskResult: RiskValidationResult = validateTrade({
    capital: riskSettings.accountCapital,
    riskPct: riskSettings.maxRiskPerTradePercent,
    entry: ticket.limitPrice,
    stop: stopLoss,
    quantity,
    lotSize: ticket.lotSize,
    maxLots: riskSettings.maxLotsPerTrade[ticket.index],
    killSwitchActive: riskSettings.killSwitchActive,
  });

  const estimatedCharges = calculateIndianOptionCharges(ticket.limitPrice, quantity);
  const isBlocked = currentRiskResult.status === 'BLOCK';

  const handleConfirmApproval = () => {
    if (isBlocked) return;
    const modifiedTicket: PaperOrderTicket = {
      ...ticket,
      lots,
      quantity,
      stopLoss,
      target1,
      estimatedRisk: currentRiskResult.estimatedRisk,
      allowedRisk: currentRiskResult.allowedRisk,
      estimatedCharges,
    };
    onApprove(modifiedTicket, fingerprint);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Institutional Trade Approval Gate</h3>
              <p className="text-xs text-slate-400 font-mono">Explicit human validation required before order execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Order Summary Ribbon */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Instrument</span>
              <span className="text-base font-bold text-slate-100">
                {ticket.index} {ticket.strike} {ticket.optionType}
              </span>
              <span className="text-xs text-slate-400 block">Exp: {ticket.expiry}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Proposed Entry</span>
              <span className="text-base font-bold text-emerald-400">₹{ticket.limitPrice.toFixed(2)}</span>
              <span className="text-xs text-slate-400 block">{ticket.strategy}</span>
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded px-3 py-2 text-[11px] font-mono flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Ticket Fingerprint:
            </span>
            <span className="text-cyan-400/90 truncate max-w-[240px]" title={fingerprint}>
              {fingerprint.substring(0, 16)}...{fingerprint.substring(fingerprint.length - 8)}
            </span>
          </div>

          {/* Sizing & Controls */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                Lots ({ticket.lotSize} qty/lot)
              </label>
              <input
                type="number"
                min="1"
                max={riskSettings.maxLotsPerTrade[ticket.index]}
                value={lots}
                onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Total Qty: {quantity}</span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Stop Loss (₹)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={stopLoss}
                onChange={(e) => setStopLoss(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-rose-400 font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Risk: ₹{(ticket.limitPrice - stopLoss).toFixed(1)}/unit
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded p-2.5">
              <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Target 1 (₹)</label>
              <input
                type="number"
                step="0.5"
                min={ticket.limitPrice}
                value={target1}
                onChange={(e) => setTarget1(parseFloat(e.target.value) || ticket.limitPrice)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-emerald-400 font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                Gain: ₹{(target1 - ticket.limitPrice).toFixed(1)}/unit
              </span>
            </div>
          </div>

          {/* Risk Validation Status Panel */}
          <div
            className={`border rounded-lg p-3 ${
              isBlocked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : currentRiskResult.status === 'WARNING'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
              <span className="flex items-center gap-1.5">
                {isBlocked ? (
                  <XCircle className="w-4 h-4 text-rose-400" />
                ) : currentRiskResult.status === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                Risk Gate: {currentRiskResult.status}
              </span>
              <span>Allowed Cap: ₹{currentRiskResult.allowedRisk.toLocaleString('en-IN')}</span>
            </div>

            <div className="text-[11px] space-y-1 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Estimated Capital at Risk:</span>
                <span className="font-bold">
                  ₹{currentRiskResult.estimatedRisk.toLocaleString('en-IN')} ({currentRiskResult.capitalAtRiskPercent}%)
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Est. Regulatory & Brokerage Charges:</span>
                <span>₹{estimatedCharges.toFixed(2)}</span>
              </div>
            </div>

            {currentRiskResult.reasons.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] space-y-1">
                {currentRiskResult.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1 text-slate-300">
                    <span className="text-amber-400">•</span> {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onReject(ticket);
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold font-mono transition-all"
          >
            Reject Proposal
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 rounded text-xs font-semibold font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApproval}
              disabled={isBlocked}
              className={`px-5 py-2.5 rounded font-mono text-xs font-bold flex items-center gap-2 transition-all ${
                isBlocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
              }`}
            >
              Approve Paper Trade
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
