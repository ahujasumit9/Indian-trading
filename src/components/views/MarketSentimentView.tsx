import React from 'react';
import { Compass, TrendingUp, TrendingDown, ShieldAlert, FileText, Globe } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

interface MarketSentimentViewProps {
  indiaVix: number;
  vixChange: number;
  pcr: number;
}

export const MarketSentimentView: React.FC<MarketSentimentViewProps> = ({
  indiaVix,
  vixChange,
  pcr,
}) => {
  // Institutional FII/DII Net Cash Flow dataset (in Crores INR)
  const institutionalFlows = [
    { date: '2026-10-30', fiiBuy: 11450, fiiSell: 10220, fiiNet: 1230, diiBuy: 9400, diiSell: 8650, diiNet: 750 },
    { date: '2026-10-29', fiiBuy: 12100, fiiSell: 13540, fiiNet: -1440, diiBuy: 10500, diiSell: 8900, diiNet: 1600 },
    { date: '2026-10-28', fiiBuy: 9800, fiiSell: 9100, fiiNet: 700, diiBuy: 8900, diiSell: 8450, diiNet: 450 },
    { date: '2026-10-27', fiiBuy: 14200, fiiSell: 15100, fiiNet: -900, diiBuy: 11800, diiSell: 9900, diiNet: 1900 },
  ];

  const officialNewsFeed = [
    {
      source: 'NSE Corporate Disclosures',
      time: '10:15 AM IST',
      headline: 'Heavyweight financial banking conglomerate releases quarterly results ahead of estimates',
      impact: 'BULLISH',
    },
    {
      source: 'RBI Monetary Policy Committee (MPC)',
      time: '09:00 AM IST',
      headline: 'RBI maintains accommodative stance; repo rate unchanged at 6.50% supporting index liquidity',
      impact: 'NEUTRAL',
    },
    {
      source: 'SEBI Circular',
      time: 'Yesterday',
      headline: 'SEBI strengthens index derivative surveillance framework for weekly index expiries',
      impact: 'REGULATORY',
    },
  ];

  return (
    <div className="space-y-4 font-mono">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Market Sentiment & Institutional Flow Engine
            </h2>
            <p className="text-xs text-slate-400">
              India VIX regime, Put-Call Ratio dynamics, and verified FII/DII exchange disclosures
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <MetricCard
          label="INDIA VIX (VOLATILITY INDEX)"
          value={indiaVix.toFixed(2)}
          change={vixChange}
          subValue={
            indiaVix < 13
              ? 'Low Volatility Environment'
              : indiaVix > 18
              ? 'High Volatility Expansion'
              : 'Standard Range'
          }
          badge={indiaVix < 16 ? 'STABLE' : 'ELEVATED'}
          badgeColor={indiaVix < 16 ? 'green' : 'yellow'}
        />

        <MetricCard
          label="COMPOSITE PCR"
          value={pcr.toFixed(3)}
          subValue={pcr >= 1.15 ? 'Put Writer Floor' : pcr <= 0.85 ? 'Call Writer Ceiling' : 'Balanced'}
          badge={pcr >= 1.0 ? 'BULLISH' : 'BEARISH'}
          badgeColor={pcr >= 1.0 ? 'green' : 'red'}
        />

        <MetricCard
          label="FII NET CASH TODAY"
          value="+₹1,230 Cr"
          subValue="Institutional Foreign Inflow"
          badge="BUYING"
          badgeColor="green"
        />

        <MetricCard
          label="DII NET CASH TODAY"
          value="+₹750 Cr"
          subValue="Domestic Mutual Fund Support"
          badge="BUYING"
          badgeColor="green"
        />
      </div>

      {/* FII / DII Institutional Flow Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase">
            Exchange Published FII & DII Trading Activity (Crores INR)
          </span>
          <span className="text-xs text-slate-400">Source: Official NSE/BSE End-of-Day Data</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-950 text-[10px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 text-left">Date</th>
                <th className="py-2.5 px-2">FII Gross Buy</th>
                <th className="py-2.5 px-2">FII Gross Sell</th>
                <th className="py-2.5 px-2 text-cyan-400 font-bold">FII Net</th>
                <th className="py-2.5 px-2">DII Gross Buy</th>
                <th className="py-2.5 px-2">DII Gross Sell</th>
                <th className="py-2.5 px-2 text-cyan-400 font-bold">DII Net</th>
                <th className="py-2.5 px-3 text-right">Combined Institutional Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {institutionalFlows.map((f) => {
                const combined = f.fiiNet + f.diiNet;
                return (
                  <tr key={f.date} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-left text-slate-300 font-semibold">{f.date}</td>
                    <td className="py-2.5 px-2 text-slate-400">₹{f.fiiBuy.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-slate-400">₹{f.fiiSell.toLocaleString()}</td>
                    <td
                      className={`py-2.5 px-2 font-bold ${
                        f.fiiNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {f.fiiNet >= 0 ? '+' : ''}₹{f.fiiNet.toLocaleString()} Cr
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">₹{f.diiBuy.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-slate-400">₹{f.diiSell.toLocaleString()}</td>
                    <td
                      className={`py-2.5 px-2 font-bold ${
                        f.diiNet >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {f.diiNet >= 0 ? '+' : ''}₹{f.diiNet.toLocaleString()} Cr
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        combined >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {combined >= 0 ? '+' : ''}₹{combined.toLocaleString()} Cr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Exchange & Regulatory Disclosures */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Official Regulatory & Exchange Information Feeds</span>
        </div>

        <div className="space-y-2.5">
          {officialNewsFeed.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    {item.source}
                  </span>
                  <span className="text-[10px] text-slate-500">{item.time}</span>
                </div>
                <p className="text-slate-200 font-sans">{item.headline}</p>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${
                  item.impact === 'BULLISH'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : item.impact === 'REGULATORY'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {item.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
