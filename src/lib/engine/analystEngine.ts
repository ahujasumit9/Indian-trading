/**
 * Indian Equities & Index Heavyweights Fundamental Analyst Engine
 * Analyzes key NIFTY 50 and SENSEX constituents with P/E, ROCE, ROE, D/E, FII/DII holding, and valuation scoring.
 */

export interface CompanyFundamental {
  symbol: string;
  name: string;
  sector: string;
  niftyWeight: number; // percentage in NIFTY 50
  sensexWeight: number; // percentage in SENSEX
  marketCapCr: number; // Crores
  currentPrice: number;
  peRatio: number;
  sectorPe: number;
  pbRatio: number;
  rocePercent: number;
  roePercent: number;
  debtToEquity: number;
  dividendYield: number;
  epsTrailing: number;
  epsGrowthYoy: number;
  fiiHoldingPercent: number;
  diiHoldingPercent: number;
  promoterHoldingPercent: number;
  valuationStatus: 'UNDERVALUED' | 'FAIR' | 'OVERVALUED';
  overallScore: number; // 0 to 100
  thesis: string;
  lastQuarterResults: string;
}

export const TOP_INDIAN_HEAVYWEIGHTS: CompanyFundamental[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    sector: 'Oil & Gas / Telecom / Retail',
    niftyWeight: 9.85,
    sensexWeight: 11.2,
    marketCapCr: 1985400,
    currentPrice: 2940.5,
    peRatio: 26.4,
    sectorPe: 22.8,
    pbRatio: 2.3,
    rocePercent: 10.8,
    roePercent: 9.4,
    debtToEquity: 0.38,
    dividendYield: 0.35,
    epsTrailing: 111.3,
    epsGrowthYoy: 14.2,
    fiiHoldingPercent: 21.8,
    diiHoldingPercent: 16.5,
    promoterHoldingPercent: 50.3,
    valuationStatus: 'FAIR',
    overallScore: 82,
    thesis: 'Diversified conglomerate leading digital (Jio) and retail expansions with strong cash generation from energy.',
    lastQuarterResults: 'Net Profit up 12% YoY driven by Jio ARPU expansion and retail footfall surge.',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    sector: 'Private Banking',
    niftyWeight: 11.45,
    sensexWeight: 13.1,
    marketCapCr: 1324000,
    currentPrice: 1742.0,
    peRatio: 18.2,
    sectorPe: 19.5,
    pbRatio: 2.7,
    rocePercent: 15.6,
    roePercent: 16.8,
    debtToEquity: 0.85,
    dividendYield: 1.15,
    epsTrailing: 95.7,
    epsGrowthYoy: 16.5,
    fiiHoldingPercent: 47.2,
    diiHoldingPercent: 33.1,
    promoterHoldingPercent: 0.0,
    valuationStatus: 'UNDERVALUED',
    overallScore: 88,
    thesis: 'Premier Indian private bank. Post-merger CD ratio normalization progressing ahead of management guidance.',
    lastQuarterResults: 'Net Interest Margin resilient at 3.65%; gross NPA contained at 1.24%.',
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    sector: 'Private Banking',
    niftyWeight: 7.9,
    sensexWeight: 8.8,
    marketCapCr: 894500,
    currentPrice: 1275.0,
    peRatio: 17.5,
    sectorPe: 19.5,
    pbRatio: 3.1,
    rocePercent: 16.9,
    roePercent: 18.2,
    debtToEquity: 0.82,
    dividendYield: 0.85,
    epsTrailing: 72.8,
    epsGrowthYoy: 18.4,
    fiiHoldingPercent: 44.5,
    diiHoldingPercent: 45.2,
    promoterHoldingPercent: 0.0,
    valuationStatus: 'UNDERVALUED',
    overallScore: 91,
    thesis: 'Industry-leading ROE among private lenders with robust digital underwriting and pristine asset quality.',
    lastQuarterResults: 'Core operating profit up 15.6% YoY; RoA sustained at 2.36%.',
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    sector: 'IT Services',
    niftyWeight: 4.1,
    sensexWeight: 4.8,
    marketCapCr: 1485000,
    currentPrice: 4110.0,
    peRatio: 29.8,
    sectorPe: 30.5,
    pbRatio: 13.8,
    rocePercent: 58.4,
    roePercent: 51.2,
    debtToEquity: 0.0,
    dividendYield: 1.85,
    epsTrailing: 137.9,
    epsGrowthYoy: 8.9,
    fiiHoldingPercent: 12.6,
    diiHoldingPercent: 10.4,
    promoterHoldingPercent: 71.8,
    valuationStatus: 'FAIR',
    overallScore: 84,
    thesis: 'India’s premier IT services bellwether with zero debt, massive free cash flows, and record deal total contract value.',
    lastQuarterResults: 'Deal win TCV at $8.6B; operating margin expanded 40 bps to 26.0%.',
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    sector: 'IT Services',
    niftyWeight: 5.6,
    sensexWeight: 6.4,
    marketCapCr: 785000,
    currentPrice: 1895.0,
    peRatio: 28.1,
    sectorPe: 30.5,
    pbRatio: 8.9,
    rocePercent: 40.5,
    roePercent: 32.8,
    debtToEquity: 0.04,
    dividendYield: 2.1,
    epsTrailing: 67.4,
    epsGrowthYoy: 7.2,
    fiiHoldingPercent: 33.4,
    diiHoldingPercent: 35.8,
    promoterHoldingPercent: 14.6,
    valuationStatus: 'FAIR',
    overallScore: 80,
    thesis: 'Top-tier cloud transformation and generative AI enterprise implementation partner with generous capital return policy.',
    lastQuarterResults: 'Raised constant currency FY revenue guidance floor to 3.75-4.50%.',
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd.',
    sector: 'Telecom',
    niftyWeight: 4.5,
    sensexWeight: 5.1,
    marketCapCr: 940000,
    currentPrice: 1680.0,
    peRatio: 52.3,
    sectorPe: 48.0,
    pbRatio: 8.5,
    rocePercent: 16.2,
    roePercent: 19.4,
    debtToEquity: 1.35,
    dividendYield: 0.5,
    epsTrailing: 32.1,
    epsGrowthYoy: 28.5,
    fiiHoldingPercent: 24.1,
    diiHoldingPercent: 19.8,
    promoterHoldingPercent: 53.2,
    valuationStatus: 'OVERVALUED',
    overallScore: 76,
    thesis: 'Indian telecom duopoly leader enjoying steady tariff hikes, industry-leading ARPU (₹233+), and expanding Africa business.',
    lastQuarterResults: 'ARPU expanded to ₹233; India mobile EBITDA margin crossed 54%.',
  },
  {
    symbol: 'ITC',
    name: 'ITC Ltd.',
    sector: 'FMCG / Cigarettes / Hotels',
    niftyWeight: 3.8,
    sensexWeight: 4.2,
    marketCapCr: 590000,
    currentPrice: 472.0,
    peRatio: 27.5,
    sectorPe: 38.0,
    pbRatio: 7.8,
    rocePercent: 36.8,
    roePercent: 28.5,
    debtToEquity: 0.01,
    dividendYield: 2.9,
    epsTrailing: 17.1,
    epsGrowthYoy: 6.8,
    fiiHoldingPercent: 41.2,
    diiHoldingPercent: 44.5,
    promoterHoldingPercent: 0.0,
    valuationStatus: 'UNDERVALUED',
    overallScore: 86,
    thesis: 'Monopoly cigarettes cash cow funding non-cigarette FMCG scale. Hotels demerger unlocks shareholder value.',
    lastQuarterResults: 'FMCG others EBITDA margin expanded 80 bps; Cigarette volumes steady.',
  },
  {
    symbol: 'LT',
    name: 'Larsen & Toubro Ltd.',
    sector: 'Capital Goods / Infrastructure',
    niftyWeight: 3.7,
    sensexWeight: 4.1,
    marketCapCr: 495000,
    currentPrice: 3610.0,
    peRatio: 36.2,
    sectorPe: 42.0,
    pbRatio: 5.2,
    rocePercent: 17.1,
    roePercent: 15.8,
    debtToEquity: 1.05,
    dividendYield: 0.95,
    epsTrailing: 99.7,
    epsGrowthYoy: 22.4,
    fiiHoldingPercent: 23.9,
    diiHoldingPercent: 37.8,
    promoterHoldingPercent: 0.0,
    valuationStatus: 'FAIR',
    overallScore: 85,
    thesis: 'Prime proxy for Indian capex cycle, defense indigenization, and Middle Eastern mega-infrastructure orders.',
    lastQuarterResults: 'Order book hits all-time high of ₹4.8 Lakh Crore; 19% YoY order inflow growth.',
  },
];

/**
 * Calculates fundamental health score for a constituent
 */
export function calculateValuationScore(comp: CompanyFundamental): number {
  let score = 50;

  // ROCE filter
  if (comp.rocePercent > 25) score += 15;
  else if (comp.rocePercent > 15) score += 10;
  else if (comp.rocePercent < 10) score -= 10;

  // Debt/Equity filter
  if (comp.debtToEquity < 0.2) score += 15;
  else if (comp.debtToEquity < 0.8) score += 8;
  else if (comp.debtToEquity > 1.5) score -= 12;

  // Valuation vs Sector PE
  const peDiscount = (comp.sectorPe - comp.peRatio) / comp.sectorPe;
  if (peDiscount > 0.1) score += 12;
  else if (peDiscount < -0.2) score -= 10;

  // Institutional Ownership (FII + DII)
  const instOwnership = comp.fiiHoldingPercent + comp.diiHoldingPercent;
  if (instOwnership > 50) score += 8;

  return Math.min(99, Math.max(20, Math.round(score)));
}
