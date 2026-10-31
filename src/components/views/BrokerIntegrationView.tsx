import React, { useState, useEffect } from 'react';
import { BrokerConfig } from '../../types/dataSources';
import { Link2, ShieldCheck, Lock, AlertTriangle, CheckCircle, RefreshCw, KeyRound, Server, History, XCircle } from 'lucide-react';

interface BrokerIntegrationViewProps {
  brokers: BrokerConfig[];
  onUpdateBroker: (updated: BrokerConfig) => void;
}

interface ServerStatusResponse {
  [brokerId: string]: {
    id: string;
    isConfigured: boolean;
    hasApiKey: boolean;
    hasClientCode: boolean;
    lastPing?: string;
    lastError?: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  };
}

interface AuditLog {
  timestamp: string;
  eventType: string;
  details: Record<string, any>;
}

export const BrokerIntegrationView: React.FC<BrokerIntegrationViewProps> = ({
  brokers,
  onUpdateBroker,
}) => {
  const [testingBroker, setTestingBroker] = useState<string | null>(null);
  const [savingBroker, setSavingBroker] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [id: string]: { success: boolean; message: string; details?: any } }>({});
  const [serverStatuses, setServerStatuses] = useState<ServerStatusResponse>({});
  const [formInputs, setFormInputs] = useState<{ [id: string]: { apiKey: string; clientCode: string; pin?: string } }>({
    ANGEL_ONE: { apiKey: '', clientCode: '', pin: '' },
    SAHI: { apiKey: '', clientCode: '', pin: '' },
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch genuine server status on load
  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/broker/status');
      if (res.ok) {
        const data = await res.json();
        setServerStatuses(data);
        // Sync broker objects
        brokers.forEach((b) => {
          if (data[b.id]) {
            const serverInfo = data[b.id];
            onUpdateBroker({
              ...b,
              status: serverInfo.status,
              isConfiguredOnServer: serverInfo.isConfigured,
              lastPing: serverInfo.lastPing,
              lastError: serverInfo.lastError,
            });
          }
        });
      }
    } catch (err) {
      console.warn('Failed to fetch broker status from server:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/security/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to fetch security audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveToVault = async (brokerId: 'ANGEL_ONE' | 'SAHI') => {
    const inputs = formInputs[brokerId];
    if (!inputs.apiKey || !inputs.clientCode) {
      alert('Please provide both API Key and Client Code before saving to the server vault.');
      return;
    }

    setSavingBroker(brokerId);
    try {
      const res = await fetch('/api/broker/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: brokerId,
          apiKey: inputs.apiKey,
          clientCode: inputs.clientCode,
          pin: inputs.pin,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult((prev) => ({
          ...prev,
          [brokerId]: {
            success: true,
            message: 'Credentials securely stored in server-side memory vault. Cleared from browser state.',
          },
        }));
        // Clear sensitive inputs from client-side state
        setFormInputs((prev) => ({
          ...prev,
          [brokerId]: { apiKey: '', clientCode: '', pin: '' },
        }));
        await fetchServerStatus();
        await fetchAuditLogs();
      } else {
        setTestResult((prev) => ({
          ...prev,
          [brokerId]: {
            success: false,
            message: `Vault save error: ${data.error || 'Unknown error'}`,
          },
        }));
      }
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [brokerId]: {
          success: false,
          message: `Network error saving to vault: ${err.message}`,
        },
      }));
    } finally {
      setSavingBroker(null);
    }
  };

  const handleTestConnection = async (broker: BrokerConfig) => {
    setTestingBroker(broker.id);
    setTestResult((prev) => ({ ...prev, [broker.id]: undefined as any }));

    try {
      // If user typed in credentials without saving yet, push them first
      const inputs = formInputs[broker.id];
      if (inputs?.apiKey && inputs?.clientCode) {
        await fetch('/api/broker/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: broker.id,
            apiKey: inputs.apiKey,
            clientCode: inputs.clientCode,
            pin: inputs.pin,
          }),
        });
      }

      const res = await fetch('/api/broker/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: broker.id }),
      });

      const result = await res.json();
      setTestResult((prev) => ({
        ...prev,
        [broker.id]: {
          success: result.success,
          message: result.message,
          details: result.details,
        },
      }));

      await fetchServerStatus();
      await fetchAuditLogs();
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [broker.id]: {
          success: false,
          message: `Handshake verification failed: ${err.message}`,
        },
      }));
    } finally {
      setTestingBroker(null);
    }
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
              Zero-credential analysis mode by default. Credentials stored exclusively in isolated server-side vault.
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

      {/* Safety Notice & Architectural Guarantee */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Institutional Security Architecture</span>
        </div>
        <p className="text-slate-400 leading-relaxed font-sans">
          Broker API credentials are <strong className="text-slate-200">never required</strong> for market analysis, technical indicators, option chain intelligence, or paper trading.
          In accordance with SEBI guidelines and OWASP Top 10 API Security, credentials are <strong className="text-slate-200">never persisted in client localStorage</strong>. 
          All connections are verified directly against official exchange/broker endpoints with cryptographic approval tokens required for any live orders.
        </p>
      </div>

      {/* Broker Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brokers.map((broker) => {
          const isAngel = broker.id === 'ANGEL_ONE';
          const serverInfo = serverStatuses[broker.id];
          const isConfigured = serverInfo?.isConfigured;
          const currentStatus = serverInfo?.status || broker.status;
          const result = testResult[broker.id];

          return (
            <div key={broker.id} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 font-sans">{broker.name}</h3>
                  <span className="text-[11px] text-slate-500">
                    {isAngel ? 'Official SmartAPI REST Adapter' : 'Official Sahi Broker Adapter'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      currentStatus === 'CONNECTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : currentStatus === 'ERROR'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-800'
                    }`}
                  >
                    {currentStatus}
                  </span>
                  {isConfigured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                      <Server className="w-2.5 h-2.5" />
                      <span>VAULT ACTIVE</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">
                    API Key {isConfigured && <span className="text-emerald-400 font-normal">(Configured on server)</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={isConfigured ? '••••••••••••••••••••••••' : 'Enter broker API key'}
                    value={formInputs[broker.id]?.apiKey || ''}
                    onChange={(e) =>
                      setFormInputs((prev) => ({
                        ...prev,
                        [broker.id]: { ...prev[broker.id], apiKey: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAngel ? 'Client Code (e.g. S123456)' : 'Client ID'} {isConfigured && <span className="text-emerald-400 font-normal">(Configured)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={isConfigured ? 'Saved in Vault' : isAngel ? 'Angel One Client Code' : 'Sahi Client ID'}
                    value={formInputs[broker.id]?.clientCode || ''}
                    onChange={(e) =>
                      setFormInputs((prev) => ({
                        ...prev,
                        [broker.id]: { ...prev[broker.id], clientCode: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded border border-slate-800/80 text-[11px] space-y-1 text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Mode: Sandboxed / Preview Only</span>
                  </div>
                  <div>• Live order placement: STRICTLY DISABLED</div>
                  <div>• Real authentication handshake against official broker endpoints</div>
                  {serverInfo?.lastPing && (
                    <div className="text-slate-500 text-[10px] pt-1">
                      Last Verified: {new Date(serverInfo.lastPing).toLocaleTimeString()}
                    </div>
                  )}
                  {serverInfo?.lastError && (
                    <div className="text-rose-400 text-[10px] pt-0.5">
                      Last Error: {serverInfo.lastError}
                    </div>
                  )}
                </div>

                {/* Test Result Message Box */}
                {result && (
                  <div
                    className={`text-[11px] p-2.5 rounded border ${
                      result.success
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {result.success ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{result.success ? 'Handshake Successful' : 'Official API Rejected / Verification Failed'}</span>
                    </div>
                    <div>{result.message}</div>
                    {result.details && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Reason: {typeof result.details === 'string' ? result.details : JSON.stringify(result.details)}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleSaveToVault(broker.id)}
                    disabled={savingBroker === broker.id}
                    className="py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    {savingBroker === broker.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Save to Vault</span>
                  </button>

                  <button
                    onClick={() => handleTestConnection(broker)}
                    disabled={testingBroker === broker.id}
                    className="py-2 bg-cyan-900/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700/50 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    {testingBroker === broker.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>Test Handshake</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Audit Trail Component */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs text-slate-200">Server Security & Audit Trail (Last 20 Events)</span>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loadingLogs}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-xs text-slate-500 py-3 text-center">No security events logged yet.</div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 text-[11px]">
            {auditLogs.slice(0, 15).map((log, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {log.eventType}
                  </span>
                  <span className="text-slate-400 truncate max-w-xs md:max-w-md">
                    {JSON.stringify(log.details)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
