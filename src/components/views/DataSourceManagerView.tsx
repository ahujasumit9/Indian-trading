import React, { useState, useRef } from 'react';
import { DataSourceStatus, TradingViewAlert } from '../../types/dataSources';
import {
  Database,
  Upload,
  Webhook,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileText,
  Send,
  Copy,
  ExternalLink,
  Code,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { parseCandleCSV, parseOptionChainCSV } from '../../lib/data/csvParser';
import { Candle, OptionChainData, MarketIndex } from '../../types/market';
import { SAMPLE_CANDLE_CSV, SAMPLE_OPTION_CHAIN_CSV } from '../../lib/data/sampleDatasets';

interface DataSourceManagerViewProps {
  status: DataSourceStatus;
  onSelectSource: (source: 'SIMULATOR' | 'CSV_FILE' | 'TRADINGVIEW_WEBHOOK') => void;
  onLoadCandles: (candles: Candle[], fileName: string) => void;
  onLoadOptionChain: (chain: OptionChainData) => void;
  tvAlerts: TradingViewAlert[];
  onAddTvAlert: (alert: TradingViewAlert) => void;
  selectedUnderlying: MarketIndex;
}

export const DataSourceManagerView: React.FC<DataSourceManagerViewProps> = ({
  status,
  onSelectSource,
  onLoadCandles,
  onLoadOptionChain,
  tvAlerts,
  onAddTvAlert,
  selectedUnderlying,
}) => {
  const [csvFeedback, setCsvFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [guideTab, setGuideTab] = useState<'TRADINGVIEW' | 'ANGEL' | 'CSV' | 'SIMULATOR'>('TRADINGVIEW');

  const candleFileInputRef = useRef<HTMLInputElement | null>(null);
  const chainFileInputRef = useRef<HTMLInputElement | null>(null);

  // Test Webhook Simulator
  const [testTicker, setTestTicker] = useState('NSE:NIFTY50');
  const [testTimeframe, setTestTimeframe] = useState('5m');
  const [testPrice, setTestPrice] = useState(24250.5);
  const [testEma15, setTestEma15] = useState(24240.0);
  const [testEma20, setTestEma20] = useState(24225.0);
  const [testVwap, setTestVwap] = useState(24210.0);
  const [testRsi, setTestRsi] = useState(62.4);

  // Absolute Webhook URL
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/tradingview`
      : 'https://your-domain.vercel.app/api/webhooks/tradingview';

  const webhookJsonTemplate = `{
  "ticker": "{{ticker}}",
  "price": {{close}},
  "timeframe": "{{interval}}",
  "volume": {{volume}},
  "action": "BUY_ALERT",
  "message": "NIFTY EMA15/20 Bullish Cross above VWAP"
}`;

  const pineScriptCode = `//@version=5
indicator("India AI Trader - NIFTY / SENSEX Webhook Alerts", overlay=true)

// Technical Parameters
ema15 = ta.ema(close, 15)
ema20 = ta.ema(close, 20)
vwapVal = ta.vwap(hlc3)
rsiVal = ta.rsi(close, 14)

plot(ema15, color=color.amber, title="EMA 15")
plot(ema20, color=color.blue, title="EMA 20")
plot(vwapVal, color=color.cyan, title="VWAP")

// Signals
bullishCross = ta.crossover(ema15, ema20) and close > vwapVal
bearishCross = ta.crossunder(ema15, ema20) and close < vwapVal

// Alert Conditions for India AI Trader
if (bullishCross)
    alert('{"ticker":"' + syminfo.ticker + '","price":' + str.tostring(close) + ',"timeframe":"' + timeframe.period + '","action":"BUY_CE","volume":' + str.tostring(volume) + ',"message":"Bullish EMA Cross above VWAP"}', alert.freq_once_per_bar_close)

if (bearishCross)
    alert('{"ticker":"' + syminfo.ticker + '","price":' + str.tostring(close) + ',"timeframe":"' + timeframe.period + '","action":"BUY_PE","volume":' + str.tostring(volume) + ',"message":"Bearish EMA Cross below VWAP"}', alert.freq_once_per_bar_close)
`;

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleCandleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCandleCSV(text);
      if (parsed.success && parsed.data) {
        onLoadCandles(parsed.data, file.name);
        onSelectSource('CSV_FILE');
        setCsvFeedback({
          success: true,
          msg: `Successfully imported ${parsed.rowCount} candles from ${file.name}. Technical indicators recomputed.`,
        });
      } else {
        setCsvFeedback({
          success: false,
          msg: parsed.error || 'Failed to parse candle CSV.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleChainUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseOptionChainCSV(
        text,
        selectedUnderlying === 'NIFTY' ? 24150 : 79400,
        selectedUnderlying
      );
      if (parsed.success && parsed.data) {
        onLoadOptionChain(parsed.data);
        onSelectSource('CSV_FILE');
        setCsvFeedback({
          success: true,
          msg: `Successfully parsed ${parsed.rowCount} option strikes with Greeks and PCR.`,
        });
      } else {
        setCsvFeedback({
          success: false,
          msg: parsed.error || 'Failed to parse option chain CSV.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = () => {
    const parsedCandles = parseCandleCSV(SAMPLE_CANDLE_CSV);
    if (parsedCandles.success && parsedCandles.data) {
      onLoadCandles(parsedCandles.data, 'sample_nifty_trending_session.csv');
    }
    const parsedChain = parseOptionChainCSV(SAMPLE_OPTION_CHAIN_CSV, 24200, 'NIFTY');
    if (parsedChain.success && parsedChain.data) {
      onLoadOptionChain(parsedChain.data);
    }
    onSelectSource('CSV_FILE');
    setCsvFeedback({
      success: true,
      msg: 'Preloaded official sample historical Indian index candles and option chain.',
    });
  };

  const handleSimulateWebhook = async () => {
    const payload = {
      ticker: testTicker,
      timeframe: testTimeframe,
      price: testPrice,
      ema15: testEma15,
      ema20: testEma20,
      vwap: testVwap,
      rsi: testRsi,
      volume: 85000,
      action: 'BUY_BREAKOUT',
      message: 'TradingView alert: EMA15 crossed above EMA20 with volume expansion above VWAP',
    };

    const newAlert: TradingViewAlert = {
      id: `tv_${Date.now()}`,
      receivedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      ticker: testTicker,
      timeframe: testTimeframe,
      price: testPrice,
      ema15: testEma15,
      ema20: testEma20,
      rsi: testRsi,
      vwap: testVwap,
      volume: 85000,
      action: 'BUY',
      message: payload.message,
      rawPayload: JSON.stringify(payload, null, 2),
    };

    onAddTvAlert(newAlert);
    onSelectSource('TRADINGVIEW_WEBHOOK');

    try {
      await fetch('/api/webhooks/tradingview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Ignored if offline
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Market Data & Live Feed Manager
            </h2>
            <p className="text-xs text-slate-400">
              Configure real-time live market data via TradingView Webhooks, Angel One SmartAPI, or High-Fidelity Simulation
            </p>
          </div>
        </div>

        {/* Active Source Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Active Feed:</span>
          <span
            className={`text-xs px-2.5 py-1 rounded font-bold border ${
              status.activeSource === 'SIMULATOR'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : status.activeSource === 'CSV_FILE'
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {status.activeSource === 'SIMULATOR'
              ? 'SIMULATED DATA (DEMO MODE)'
              : status.activeSource === 'CSV_FILE'
              ? 'CSV IMPORT'
              : 'LIVE TRADINGVIEW WEBHOOK'}
          </span>
        </div>
      </div>

      {/* CSV Status Message */}
      {csvFeedback && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            csvFeedback.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {csvFeedback.success ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{csvFeedback.msg}</span>
          </div>
          <button onClick={() => setCsvFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Comprehensive "How to Have Live Data" Walkthrough Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              How to Connect Real-Time Live Data (BSE SENSEX & NSE NIFTY)
            </h3>
          </div>

          {/* Guide Tabs */}
          <div className="flex rounded-md p-0.5 bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setGuideTab('TRADINGVIEW')}
              className={`px-3 py-1 rounded font-bold transition-all ${
                guideTab === 'TRADINGVIEW'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. TradingView Webhook (Recommended)
            </button>
            <button
              onClick={() => setGuideTab('ANGEL')}
              className={`px-3 py-1 rounded font-bold transition-all ${
                guideTab === 'ANGEL'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. Angel One SmartAPI (Free Broker Feed)
            </button>
            <button
              onClick={() => setGuideTab('CSV')}
              className={`px-3 py-1 rounded font-bold transition-all ${
                guideTab === 'CSV'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. CSV File Drop
            </button>
            <button
              onClick={() => setGuideTab('SIMULATOR')}
              className={`px-3 py-1 rounded font-bold transition-all ${
                guideTab === 'SIMULATOR'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4. Realistic Simulator
            </button>
          </div>
        </div>

        {/* Tab 1 Content: TradingView Webhooks */}
        {guideTab === 'TRADINGVIEW' && (
          <div className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold font-mono">Step 1: Copy Webhook URL</span>
                <p className="text-slate-400 text-[11px]">
                  Use the public URL of this applet in your TradingView alert configuration.
                </p>
                <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[10px] text-cyan-300 mt-2">
                  <span className="truncate">{webhookUrl}</span>
                  <button
                    onClick={() => handleCopy(webhookUrl, 'url')}
                    className="p-1 hover:text-white shrink-0"
                    title="Copy URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {copiedSection === 'url' && (
                  <span className="text-[10px] text-emerald-400 font-mono block">Copied to clipboard!</span>
                )}
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold font-mono">Step 2: Configure Alert in TradingView</span>
                <p className="text-slate-400 text-[11px]">
                  Open <code>NSE:NIFTY</code> or <code>BSE:SENSEX</code> on TradingView. Click <strong>Create Alert</strong>, check <strong>Webhook URL</strong>, and paste the URL.
                </p>
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  Trigger: Once Per Bar Close (1m or 5m)
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold font-mono">Step 3: Paste JSON Message Body</span>
                <p className="text-slate-400 text-[11px]">
                  TradingView will replace placeholders with real-time candle close prices automatically.
                </p>
                <button
                  onClick={() => handleCopy(webhookJsonTemplate, 'json')}
                  className="mt-2 w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[11px] font-mono text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{copiedSection === 'json' ? 'Copied Payload!' : 'Copy Alert JSON'}</span>
                </button>
              </div>
            </div>

            {/* Pine Script Code Block */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-300">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span>TradingView Pine Script v5 Indicator (Ready to Paste in Pine Editor)</span>
                </div>
                <button
                  onClick={() => handleCopy(pineScriptCode, 'pine')}
                  className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSection === 'pine' ? 'Copied Script!' : 'Copy Full Pine Script'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-400 bg-slate-900 p-3 rounded border border-slate-800/80 overflow-x-auto max-h-32">
                {pineScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Angel One SmartAPI */}
        {guideTab === 'ANGEL' && (
          <div className="space-y-3 text-xs font-sans">
            <p className="text-slate-300 leading-relaxed">
              Angel One provides a free, official market data API (SmartAPI) to demat account holders. You can connect it without running dangerous browser scraping.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 block">1. Sign up on SmartAPI</span>
                <span className="text-slate-400 text-[11px] block font-sans">
                  Go to <strong>smartapi.angelone.in</strong> and log in with your Angel One credentials.
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 block">2. Create App & Copy Key</span>
                <span className="text-slate-400 text-[11px] block font-sans">
                  Create an application with <strong>Market Data API</strong> enabled and copy your API Key.
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 block">3. Connect in Broker Adapters</span>
                <span className="text-slate-400 text-[11px] block font-sans">
                  Navigate to the <strong>Broker Adapters</strong> view in the sidebar to test your credentials safely.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3 Content: CSV Drop */}
        {guideTab === 'CSV' && (
          <div className="space-y-3 text-xs font-sans text-slate-300">
            <p className="leading-relaxed">
              You can export 1-minute or 5-minute historical candle CSVs or Option Chain snapshots from <strong>Zerodha Kite</strong>, <strong>Upstox</strong>, <strong>Sensibull</strong>, or the <strong>NSE India website</strong> (nseindia.com) and drop them here anytime.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] text-slate-400">
              Required candle columns: <code>timestamp, open, high, low, close, volume</code>
              <br />
              Required option columns: <code>strike, option_type, ltp, volume, oi, oi_change, iv</code>
            </div>
          </div>
        )}

        {/* Tab 4 Content: Simulator */}
        {guideTab === 'SIMULATOR' && (
          <div className="space-y-3 text-xs font-sans text-slate-300">
            <p className="leading-relaxed">
              When markets are closed (before 9:15 AM IST, after 3:30 PM IST, or on weekends), the built-in <strong>High-Fidelity Market Simulator</strong> advances prices every 3 seconds using actual Brownian tick mechanics calibrated for Indian index volatility.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] text-amber-400">
              • Strict labelling: All ticks and signals remain explicitly tagged as SIMULATED to guarantee zero ambiguity.
            </div>
          </div>
        )}
      </div>

      {/* 3 Source Modes Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source 1: High Fidelity Simulator */}
        <div
          className={`p-5 rounded-lg border transition-all ${
            status.activeSource === 'SIMULATOR'
              ? 'bg-slate-900 border-amber-500/50 shadow-md shadow-amber-950/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-100 font-sans">1. Market Simulator</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
              BUILT-IN
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-4">
            Emulates 3-second live market ticks for SENSEX and NIFTY, recalculating Black-Scholes Greeks and AI signals in real time.
          </p>

          <button
            onClick={() => onSelectSource('SIMULATOR')}
            className={`w-full py-2 rounded text-xs font-bold transition-all ${
              status.activeSource === 'SIMULATOR'
                ? 'bg-amber-600 text-white font-black'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            {status.activeSource === 'SIMULATOR' ? 'Active Feed' : 'Switch to Simulator'}
          </button>
        </div>

        {/* Source 2: Historical CSV Upload */}
        <div
          className={`p-5 rounded-lg border transition-all ${
            status.activeSource === 'CSV_FILE'
              ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-100 font-sans">2. CSV File Import</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold">
              OFFLINE / BACKTEST
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-3">
            Upload candle CSV or option chain CSV exported from your broker terminal.
          </p>

          <input
            type="file"
            ref={candleFileInputRef}
            onChange={handleCandleUpload}
            accept=".csv"
            className="hidden"
          />
          <input
            type="file"
            ref={chainFileInputRef}
            onChange={handleChainUpload}
            accept=".csv"
            className="hidden"
          />

          <div className="space-y-2 mb-3">
            <button
              onClick={() => candleFileInputRef.current?.click()}
              className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded text-xs text-slate-200 flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Candles CSV</span>
            </button>
            <button
              onClick={() => chainFileInputRef.current?.click()}
              className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded text-xs text-slate-200 flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Upload Option Chain CSV</span>
            </button>
          </div>

          <button
            onClick={handleLoadSampleData}
            className="w-full py-1.5 bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/30 rounded text-[11px] text-cyan-300 font-bold"
          >
            Preload Sample Indian Historical Day
          </button>
        </div>

        {/* Source 3: TradingView Webhook Engine */}
        <div
          className={`p-5 rounded-lg border transition-all ${
            status.activeSource === 'TRADINGVIEW_WEBHOOK'
              ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-100 font-sans">3. TradingView Webhook</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              LIVE ALERTS
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-3">
            Real-time webhook listener receiving JSON payloads directly from TradingView charts.
          </p>

          <div className="bg-slate-950 p-2 rounded border border-slate-800 mb-3 text-[10px] font-mono break-all text-cyan-300">
            {webhookUrl}
          </div>

          <button
            onClick={() => onSelectSource('TRADINGVIEW_WEBHOOK')}
            className={`w-full py-2 rounded text-xs font-bold transition-all ${
              status.activeSource === 'TRADINGVIEW_WEBHOOK'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
            }`}
          >
            {status.activeSource === 'TRADINGVIEW_WEBHOOK' ? 'Active Feed' : 'Select Webhook Feed'}
          </button>
        </div>
      </div>

      {/* TradingView Webhook Tester & Payload Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              Test Webhook Transmitter & Incoming Alert Stream
            </h3>
          </div>
          <button
            onClick={handleSimulateWebhook}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Alert Payload</span>
          </button>
        </div>

        {/* Incoming Webhook Alerts Table */}
        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Received Time</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Timeframe</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">EMA 15 / 20</th>
                <th className="py-2.5 px-3">VWAP</th>
                <th className="py-2.5 px-3">RSI</th>
                <th className="py-2.5 px-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {tvAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 text-xs">
                    No webhooks received yet. Send a test alert above or configure your TradingView pine-script alert URL.
                  </td>
                </tr>
              ) : (
                tvAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">{a.receivedAt}</td>
                    <td className="py-2 px-3 font-bold text-slate-100">{a.ticker}</td>
                    <td className="py-2 px-3 text-slate-300">{a.timeframe}</td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">₹{a.price}</td>
                    <td className="py-2 px-3 text-slate-400">
                      {a.ema15 || '-'} / {a.ema20 || '-'}
                    </td>
                    <td className="py-2 px-3 text-cyan-400">₹{a.vwap || '-'}</td>
                    <td className="py-2 px-3 text-slate-300">{a.rsi || '-'}</td>
                    <td className="py-2 px-3 text-slate-300 truncate max-w-[200px]">{a.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
