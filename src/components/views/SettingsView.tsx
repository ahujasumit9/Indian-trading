import React from 'react';
import { RiskSettings } from '../../types/trade';
import { Settings as SettingsIcon, Save, Server, ShieldCheck, CheckCircle } from 'lucide-react';

interface SettingsViewProps {
  riskSettings: RiskSettings;
  onUpdateRiskSettings: (settings: RiskSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  riskSettings,
  onUpdateRiskSettings,
}) => {
  const handleLotSizeChange = (index: 'NIFTY' | 'SENSEX', size: number) => {
    onUpdateRiskSettings({
      ...riskSettings,
      lotSizes: {
        ...riskSettings.lotSizes,
        [index]: size,
      },
    });
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Terminal Preferences & Deployment Specs
            </h2>
            <p className="text-xs text-slate-400">
              Contract lot sizing, quantitative weightings, and Vercel cost-free production deployment architecture
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contract Specifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
            Indian Derivatives Contract Specifications
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">
                NSE NIFTY 50 Lot Size (Qty per 1 Lot):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[25, 50, 75].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleLotSizeChange('NIFTY', size)}
                    className={`py-2 rounded border font-bold transition-all ${
                      riskSettings.lotSizes.NIFTY === size
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {size} Qty
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                BSE SENSEX Lot Size (Qty per 1 Lot):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[10, 20].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleLotSizeChange('SENSEX', size)}
                    className={`py-2 rounded border font-bold transition-all ${
                      riskSettings.lotSizes.SENSEX === size
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {size} Qty
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 text-slate-400 text-[11px] leading-relaxed">
              • NIFTY Strike Step: 50 pts | Expiry: Weekly Thursday
              <br />
              • SENSEX Strike Step: 100 pts | Expiry: Weekly Friday
            </div>
          </div>
        </div>

        {/* Phase 2: Production Deployment Architecture Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-200">
              Vercel + Free-Tier Deployment Blueprint
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400 font-bold block">1. Frontend: Vercel (Free Hobby Tier)</span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Vite + React 19 single-page application built to static assets, served via Vercel Global Edge Network with zero cold start.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-cyan-400 font-bold block">2. API & Webhooks: Vercel Serverless Functions</span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                TradingView webhooks (`/api/webhooks/tradingview`) and Gemini AI proxies run seamlessly on Vercel Serverless with zero idle hosting charges.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-purple-400 font-bold block">3. Database: Supabase PostgreSQL (Free Tier)</span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                500 MB free storage, instantaneous connection pooling, and built-in row-level security for trade audit logs.
              </p>
            </div>

            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <span className="text-amber-400 font-bold block">4. WebSocket Alternative</span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Serverless environments do not support long-lived persistent WebSocket processes. For real-time feeds without a paid worker, the architecture uses lightweight HTTP streaming / Server-Sent Events (SSE) or client-side polling with configurable intervals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
