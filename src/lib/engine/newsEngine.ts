/**
 * Curated Indian Regulatory & Financial News Disclosure Engine
 * Monitors official announcements from SEBI, RBI, NSE, BSE, and corporate results.
 */

export interface NewsItem {
  id: string;
  timestamp: string;
  source: 'SEBI' | 'RBI' | 'NSE' | 'BSE' | 'CORPORATE_DISCLOSURE';
  title: string;
  summary: string;
  category: 'REGULATORY' | 'MONETARY_POLICY' | 'DERIVATIVES_CIRCULAR' | 'EARNINGS' | 'MACRO';
  impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  affectedIndices: ('NIFTY' | 'SENSEX')[];
  urlRef?: string;
}

export const CURATED_NEWS_FEED: NewsItem[] = [
  {
    id: 'news_1',
    timestamp: '2026-10-31 09:15 IST',
    source: 'SEBI',
    title: 'SEBI Measures for Strengthening Index Derivatives Framework',
    summary: 'Standardized index lot sizes revised to ~₹15 Lakh contract value. Upfront collection of option buyer premium and intra-day monitoring of position limits made mandatory.',
    category: 'DERIVATIVES_CIRCULAR',
    impact: 'NEUTRAL',
    affectedIndices: ['NIFTY', 'SENSEX'],
    urlRef: 'https://www.sebi.gov.in',
  },
  {
    id: 'news_2',
    timestamp: '2026-10-31 08:30 IST',
    source: 'RBI',
    title: 'RBI Monetary Policy Committee Keeps Repo Rate Steady at 6.50%',
    summary: 'Governor affirms inflation glide path towards 4% target while real GDP projection for FY26 retained at 7.2%. System liquidity remains in slight surplus.',
    category: 'MONETARY_POLICY',
    impact: 'BULLISH',
    affectedIndices: ['NIFTY', 'SENSEX'],
    urlRef: 'https://www.rbi.org.in',
  },
  {
    id: 'news_3',
    timestamp: '2026-10-30 18:45 IST',
    source: 'NSE',
    title: 'NSE Index Derivatives Settlement Statistics for Weekly Expiry',
    summary: 'Record turnover of ₹385 Lakh Crore notional in NIFTY options. Highest open interest concentration held at 24,500 Call and 24,000 Put strikes.',
    category: 'DERIVATIVES_CIRCULAR',
    impact: 'NEUTRAL',
    affectedIndices: ['NIFTY'],
    urlRef: 'https://www.nseindia.com',
  },
  {
    id: 'news_4',
    timestamp: '2026-10-30 17:15 IST',
    source: 'CORPORATE_DISCLOSURE',
    title: 'HDFC Bank Announces Strong Q2 FY26 Net Profit of ₹16,820 Cr',
    summary: 'Advances grew 14.8% YoY with deposit accretion accelerating. Core Net Interest Margin sustained at 3.65% with gross NPA reducing to 1.24%.',
    category: 'EARNINGS',
    impact: 'BULLISH',
    affectedIndices: ['NIFTY', 'SENSEX'],
  },
  {
    id: 'news_5',
    timestamp: '2026-10-29 16:30 IST',
    source: 'BSE',
    title: 'BSE SENSEX Derivatives Weekly Contracts Shift Alignment Notice',
    summary: 'BSE reinforces Friday weekly expiry schedule for SENSEX options with updated margin calendar.',
    category: 'REGULATORY',
    impact: 'NEUTRAL',
    affectedIndices: ['SENSEX'],
    urlRef: 'https://www.bseindia.com',
  },
  {
    id: 'news_6',
    timestamp: '2026-10-29 11:00 IST',
    source: 'CORPORATE_DISCLOSURE',
    title: 'Reliance Retail Expands Quick-Commerce Footprint into Tier-2 Cities',
    summary: 'New hyper-local fulfillment centers operationalized, targeting 15-minute delivery across 200 cities.',
    category: 'EARNINGS',
    impact: 'BULLISH',
    affectedIndices: ['NIFTY', 'SENSEX'],
  },
];
