import React, { useState } from 'react';
import { CURATED_NEWS_FEED, NewsItem } from '../../lib/engine/newsEngine';
import { Newspaper, Shield, ExternalLink, Calendar, Bell, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MarketDataBadge } from '../common/MarketDataBadge';

export const NewsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Disclosures' },
    { id: 'DERIVATIVES_CIRCULAR', label: 'SEBI / F&O Circulars' },
    { id: 'MONETARY_POLICY', label: 'RBI Monetary Policy' },
    { id: 'EARNINGS', label: 'Corporate Earnings' },
    { id: 'REGULATORY', label: 'Exchange Notices' },
  ];

  const filteredFeed =
    selectedCategory === 'ALL'
      ? CURATED_NEWS_FEED
      : CURATED_NEWS_FEED.filter((n) => n.category === selectedCategory);

  return (
    <div className="space-y-4 font-mono text-slate-100">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">
              Indian Regulatory & Corporate Disclosures Hub
            </h2>
            <p className="text-xs text-slate-400">
              Verified circulars and filings from SEBI, Reserve Bank of India (RBI), NSE, and BSE. Zero noise or unverified social media rumor.
            </p>
          </div>
        </div>

        <MarketDataBadge state="LIVE" sourceLabel="Exchange & Regulatory RSS" />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900 border border-slate-800 rounded-lg p-3">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
              selectedCategory === c.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Disclosures Feed List */}
      <div className="space-y-3">
        {filteredFeed.map((item) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-all space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-cyan-400">
                  {item.source}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.impact === 'BULLISH'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : item.impact === 'BEARISH'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.impact} IMPACT
                </span>
                <div className="flex items-center gap-1">
                  {item.affectedIndices.map((idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                      {idx}
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                <span>{item.timestamp}</span>
              </span>
            </div>

            <h3 className="font-bold font-sans text-sm md:text-base text-slate-100">{item.title}</h3>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.summary}</p>

            {item.urlRef && (
              <div className="pt-1">
                <a
                  href={item.urlRef}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>Official Gazette Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
