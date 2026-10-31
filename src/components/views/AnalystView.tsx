import React, { useState } from 'react';
import { TOP_INDIAN_HEAVYWEIGHTS, CompanyFundamental, calculateValuationScore } from '../../lib/engine/analystEngine';
import { Building2, Search, CheckCircle, AlertTriangle, TrendingUp, DollarSign, Award } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const AnalystView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyFundamental>(TOP_INDIAN_HEAVYWEIGHTS[0]);

  const filteredCompanies = TOP_INDIAN_HEAVYWEIGHTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Indian Bluechips Fundamental Analyst
            </h2>
            <p className="text-xs text-slate-400">
              In-depth fundamental analysis, ROCE, debt-to-equity, and valuation metrics for NIFTY 50 and SENSEX constituents.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="NSE/BSE Filings" />
      </div>

      {/* Main Grid: Selector List + Detailed Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Heavyweights List */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search heavyweight..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredCompanies.map((c) => {
              const isSelected = selectedCompany.symbol === c.symbol;
              const score = calculateValuationScore(c);

              return (
                <div
                  key={c.symbol}
                  onClick={() => setSelectedCompany(c)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-100">{c.symbol}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{c.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-200">₹{c.currentPrice.toLocaleString('en-IN')}</div>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          c.valuationStatus === 'UNDERVALUED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : c.valuationStatus === 'FAIR'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {c.valuationStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span>NIFTY Wt: {c.niftyWeight}%</span>
                    <span>ROCE: {c.rocePercent}%</span>
                    <span className="font-bold text-blue-400">Score: {score}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Fundamental Dossier */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          {/* Company Title Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-sans text-white">{selectedCompany.name}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-blue-400 border border-slate-700">
                  {selectedCompany.symbol}
                </span>
              </div>
              <span className="text-xs text-slate-400">{selectedCompany.sector}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400">Fundamental Health</div>
                <div className="text-xl font-black text-blue-400">
                  {calculateValuationScore(selectedCompany)}
                  <span className="text-xs text-slate-500 font-normal">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">P/E vs Sector</div>
              <div className="text-base font-bold text-slate-100 mt-0.5">
                {selectedCompany.peRatio} <span className="text-xs text-slate-500 font-normal">/ {selectedCompany.sectorPe}</span>
              </div>
              <div className="text-[10px] text-emerald-400">
                {selectedCompany.peRatio < selectedCompany.sectorPe ? 'Trades at Discount' : 'Trades at Premium'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">ROCE & ROE</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">
                {selectedCompany.rocePercent}% <span className="text-xs text-slate-400">({selectedCompany.roePercent}%)</span>
              </div>
              <div className="text-[10px] text-slate-400">High Capital Efficiency</div>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">Debt / Equity</div>
              <div className={`text-base font-bold mt-0.5 ${selectedCompany.debtToEquity < 0.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {selectedCompany.debtToEquity}
              </div>
              <div className="text-[10px] text-slate-400">
                {selectedCompany.debtToEquity === 0 ? 'Zero Debt Fortress' : selectedCompany.debtToEquity < 0.5 ? 'Low Leverage' : 'Moderate Debt'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">Market Cap (₹ Cr)</div>
              <div className="text-base font-bold text-slate-100 mt-0.5">
                ₹{(selectedCompany.marketCapCr / 1000).toFixed(1)}k Cr
              </div>
              <div className="text-[10px] text-slate-400">Div Yield: {selectedCompany.dividendYield}%</div>
            </div>
          </div>

          {/* Shareholding Pattern */}
          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Shareholding Distribution (SEBI LODR Filings)</span>
            </h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Promoter Holding</div>
                <div className="text-sm font-bold text-slate-100">{selectedCompany.promoterHoldingPercent}%</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Foreign Institutions (FII)</div>
                <div className="text-sm font-bold text-blue-400">{selectedCompany.fiiHoldingPercent}%</div>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Domestic Mutual Funds (DII)</div>
                <div className="text-sm font-bold text-emerald-400">{selectedCompany.diiHoldingPercent}%</div>
              </div>
            </div>
          </div>

          {/* Investment Thesis & Latest Disclosures */}
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200">Fundamental Thesis:</span>
              <p className="text-slate-400 leading-relaxed font-sans">{selectedCompany.thesis}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200">Latest Earnings Commentary:</span>
              <p className="text-slate-400 leading-relaxed font-sans">{selectedCompany.lastQuarterResults}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
