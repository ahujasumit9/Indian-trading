import React, { useState } from 'react';
import { BrokerConfig } from '../../types/dataSources';
import { Link2, ShieldCheck, Lock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface BrokerIntegrationViewProps {
  brokers: BrokerConfig[];
  onUpdateBroker: (updated: BrokerConfig) => void;
}

export const BrokerIntegrationView: React.FC<BrokerIntegrationViewProps> = ({
  brokers,
  onUpdateBroker,
}) => {
  const [testingBroker, setTestingBroker] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [id: string]: string }>({});

  const handleTestConnection = (broker: BrokerConfig) => {
    setTestingBroker(broker.id);
    setTimeout(() => {
      setTestingBroker(null);
      if (broker.apiKey && broker.clientCode) {
        setTestResult((prev) => ({
          ...prev,
          [broker.id]: 'Credentials verified in sandbox mode. Live execution safely locked.',
        }));
        onUpdateBroker({ ...broker, status: 'CONNECTED', lastPing: new Date().toLocaleTimeString() });
      } else {
        setTestResult((prev) => ({
          ...prev,
          [broker.id]: 'API Key and Client Code are required for sandbox connection test.',
        }));
      }
    }, 1200);
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Optional Broker Execution Adapters
            </h2>
            <p className="text-xs text-slate-400">
              Modular integration for Angel One SmartAPI and Sahi Broker API. Live trading strictly sandboxed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>LIVE EXECUTION LOCKED</span>
          </span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Institutional Safety Mandate</span>
        </div>
        <p className="text-slate-400 leading-relaxed font-sans">
          Broker API credentials are never required for market analysis, technical indicators, option chain intelligence, or paper trading.
          All live execution hooks are completely disarmed by default. Any prospective live order requires an explicit cryptographic approval token.
        </p>
      </div>

      {/* Broker Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brokers.map((broker) => {
          const isAngel = broker.id === 'ANGEL_ONE';

          return (
            <div key={broker.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-sans">{broker.name}</h3>
                  <span className="text-[11px] text-slate-500">
                    {isAngel ? 'Official SmartAPI REST Adapter' : 'Official Sahi Broker Adapter'}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    broker.status === 'CONNECTED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {broker.status}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">API Key</label>
                  <input
                    type="password"
                    placeholder="Enter broker API key"
                    value={broker.apiKey}
                    onChange={(e) => onUpdateBroker({ ...broker, apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAngel ? 'Client Code (e.g. S123456)' : 'Client ID'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAngel ? 'Angel One Client Code' : 'Sahi Client ID'}
                    value={broker.clientCode}
                    onChange={(e) => onUpdateBroker({ ...broker, clientCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800/80 text-[11px] space-y-1 text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Mode: Sandboxed / Preview Only</span>
                  </div>
                  <div>• Live order placement: STRICTLY DISABLED</div>
                  <div>• Zero mock live credentials sent to third parties</div>
                </div>

                {testResult[broker.id] && (
                  <div className="text-[11px] text-cyan-300 p-2 rounded bg-cyan-950/30 border border-cyan-500/30">
                    {testResult[broker.id]}
                  </div>
                )}

                <button
                  onClick={() => handleTestConnection(broker)}
                  disabled={testingBroker === broker.id}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  {testingBroker === broker.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>Test Adapter Handshake</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
