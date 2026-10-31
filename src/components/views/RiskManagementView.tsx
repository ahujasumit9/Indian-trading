import React from 'react';
import { RiskSettings } from '../../types/trade';
import { ShieldAlert, Power, AlertTriangle, CheckCircle, Lock, ShieldCheck } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface RiskManagementViewProps {
  settings: RiskSettings;
  onUpdateSettings: (newSettings: RiskSettings) => void;
  onToggleKillSwitch: () => void;
}

export const RiskManagementView: React.FC<RiskManagementViewProps> = ({
  settings,
  onUpdateSettings,
  onToggleKillSwitch,
}) => {
  const handleChange = (key: keyof RiskSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Institutional Risk Management & Guardrails
            </h2>
            <p className="text-xs text-slate-400">
              Automated circuit breakers, maximum exposure limits, and emergency kill-switch controls
            </p>
          </div>
        </div>

        {/* Emergency Kill Switch Button */}
        <button
          onClick={onToggleKillSwitch}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
            settings.killSwitchActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-900/50'
              : 'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{settings.killSwitchActive ? 'KILL SWITCH ENGAGED' : 'ENGAGE KILL SWITCH'}</span>
        </button>
      </div>

      {/* Kill Switch Banner if Active */}
      {settings.killSwitchActive && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-lg p-4 flex items-center gap-3 text-rose-200 text-xs">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 animate-bounce" />
          <div>
            <span className="font-bold uppercase tracking-wider block text-rose-400">
              Emergency Kill Switch is Active
            </span>
            <p className="opacity-90">
              All paper order routing and execution gates are strictly locked. No new orders can be approved until this kill switch is manually deactivated.
            </p>
          </div>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Capital & Loss Caps */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
            Capital & Drawdown Limits
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Account Trading Capital (₹)</label>
              <input
                type="number"
                value={settings.accountCapital}
                onChange={(e) => handleChange('accountCapital', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                Max Risk Per Trade (% of Capital): {settings.maxRiskPerTradePercent}%
              </label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.25"
                value={settings.maxRiskPerTradePercent}
                onChange={(e) => handleChange('maxRiskPerTradePercent', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Max Allowed Risk: ₹{((settings.accountCapital * settings.maxRiskPerTradePercent) / 100).toLocaleString('en-IN')} per trade
              </span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Max Daily Loss Circuit Breaker (₹)</label>
              <input
                type="number"
                value={settings.maxDailyLoss}
                onChange={(e) => handleChange('maxDailyLoss', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-rose-400 font-bold focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Trading auto-pauses for the day once accumulated loss reaches this cap
              </span>
            </div>
          </div>
        </div>

        {/* Position Sizing & Exposure Guards */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
            Exposure & Lot Size Guardrails
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Max Concurrent Open Positions</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxOpenPositions}
                onChange={(e) => handleChange('maxOpenPositions', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-bold focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">NIFTY Max Lots / Trade</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxLotsPerTrade.NIFTY}
                  onChange={(e) =>
                    handleChange('maxLotsPerTrade', {
                      ...settings.maxLotsPerTrade,
                      NIFTY: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">SENSEX Max Lots / Trade</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxLotsPerTrade.SENSEX}
                  onChange={(e) =>
                    handleChange('maxLotsPerTrade', {
                      ...settings.maxLotsPerTrade,
                      SENSEX: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Consecutive Loss Cooling-Off Limit</label>
              <input
                type="number"
                min="2"
                max="6"
                value={settings.maxConsecutiveLosses}
                onChange={(e) => handleChange('maxConsecutiveLosses', parseInt(e.target.value) || 3)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 font-bold"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Pauses auto-proposals after {settings.maxConsecutiveLosses} sequential losses
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-300">Expiry Day Sizing Halving:</span>
              <button
                onClick={() => handleChange('expiryDayRiskTightening', !settings.expiryDayRiskTightening)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  settings.expiryDayRiskTightening
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {settings.expiryDayRiskTightening ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
