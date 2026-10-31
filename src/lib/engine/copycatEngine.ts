/**
 * Indian Super-Investors Public Disclosure Tracker ("Copycat")
 * Tracks publicly filed shareholding patterns (>1% equity disclosure under SEBI LODR Regulations)
 * Prominent Indian market icons: Radhakishan Damani, Rare Enterprises (Late Rakesh Jhunjhunwala Portfolio), Ashish Kacholia, Vijay Kedia.
 */

export interface SuperInvestorHolding {
  company: string;
  symbol: string;
  sector: string;
  holdingPct: number;
  holdingValueCr: number;
  changeLastQuarter: 'INCREASED' | 'DECREASED' | 'UNCHANGED' | 'NEW_ENTRY';
  changePct: number;
}

export interface SuperInvestorProfile {
  id: string;
  name: string;
  firm: string;
  publicNetWorthCr: number;
  investmentStyle: string;
  topHoldings: SuperInvestorHolding[];
  sectorFocus: string[];
  lastUpdated: string;
}

export const SUPER_INVESTOR_PROFILES: SuperInvestorProfile[] = [
  {
    id: 'rk_damani',
    name: 'Radhakishan Damani',
    firm: 'Bright Star Investments',
    publicNetWorthCr: 218500,
    investmentStyle: 'Long-term value investing, consumer monopolies, negative working capital compounding',
    sectorFocus: ['Retail', 'FMCG', 'Cements', 'Specialty Chemicals'],
    lastUpdated: 'Q2 FY26 SEBI Filings',
    topHoldings: [
      { company: 'Avenue Supermarts (DMart)', symbol: 'DMART', sector: 'Retail', holdingPct: 67.2, holdingValueCr: 198400, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'VST Industries', symbol: 'VSTIND', sector: 'Cigarettes & Tobacco', holdingPct: 34.8, holdingValueCr: 2150, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'India Cements', symbol: 'INDIACEM', sector: 'Cement', holdingPct: 20.8, holdingValueCr: 1680, changeLastQuarter: 'DECREASED', changePct: -1.2 },
      { company: 'Trent Ltd.', symbol: 'TRENT', sector: 'Retail & Fashion', holdingPct: 1.5, holdingValueCr: 3950, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
    ],
  },
  {
    id: 'rare_jhunjhunwala',
    name: 'Rare Enterprises (Rakesh Jhunjhunwala Estate)',
    firm: 'Rare Enterprises / Rekha Jhunjhunwala',
    publicNetWorthCr: 54200,
    investmentStyle: 'Growth investing, financialization of Indian savings, market leadership moat',
    sectorFocus: ['Consumer Discretionary', 'Banking & Finance', 'Hotels', 'Healthcare'],
    lastUpdated: 'Q2 FY26 SEBI Filings',
    topHoldings: [
      { company: 'Titan Company Ltd.', symbol: 'TITAN', sector: 'Jewellery & Watches', holdingPct: 5.2, holdingValueCr: 18450, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'Tata Motors Ltd.', symbol: 'TATAMOTORS', sector: 'Automobiles', holdingPct: 1.3, holdingValueCr: 4890, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'Metro Brands', symbol: 'METROBRAND', sector: 'Footwear & Retail', holdingPct: 14.4, holdingValueCr: 4120, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'Canara Bank', symbol: 'CANBK', sector: 'Public Sector Banking', holdingPct: 1.5, holdingValueCr: 1420, changeLastQuarter: 'DECREASED', changePct: -0.3 },
      { company: 'Federal Bank', symbol: 'FEDERALBNK', sector: 'Private Banking', holdingPct: 2.9, holdingValueCr: 1280, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
    ],
  },
  {
    id: 'ashish_kacholia',
    name: 'Ashish Kacholia',
    firm: 'Lucky Investment Managers',
    publicNetWorthCr: 3420,
    investmentStyle: 'Small & midcap multibagger discovery, manufacturing excellence, high ROCE niche leaders',
    sectorFocus: ['Industrial Manufacturing', 'Packaging', 'Specialty Chemicals', 'Hospitality'],
    lastUpdated: 'Q2 FY26 SEBI Filings',
    topHoldings: [
      { company: 'Safari Industries', symbol: 'SAFARI', sector: 'Luggage & Travel', holdingPct: 2.1, holdingValueCr: 280, changeLastQuarter: 'INCREASED', changePct: 0.2 },
      { company: 'Shaily Engineering Plastics', symbol: 'SHAILY', sector: 'Plastics & Devices', holdingPct: 5.4, holdingValueCr: 215, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'AMI Organics', symbol: 'AMIORG', sector: 'Specialty Chemicals', holdingPct: 1.9, holdingValueCr: 145, changeLastQuarter: 'NEW_ENTRY', changePct: 1.9 },
    ],
  },
  {
    id: 'vijay_kedia',
    name: 'Vijay Kedia',
    firm: 'Kedia Securities',
    publicNetWorthCr: 1850,
    investmentStyle: 'SMILE approach: Small in size, Medium in experience, Large in aspiration, Extra-large in market potential',
    sectorFocus: ['Automotive Ancillary', 'Defence Ancillaries', 'Textiles', 'Engineering'],
    lastUpdated: 'Q2 FY26 SEBI Filings',
    topHoldings: [
      { company: 'Tejas Networks', symbol: 'TEJASNET', sector: 'Telecom Equipment', holdingPct: 1.8, holdingValueCr: 295, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'Elecon Engineering', symbol: 'ELECON', sector: 'Industrial Gears', holdingPct: 1.4, holdingValueCr: 185, changeLastQuarter: 'UNCHANGED', changePct: 0.0 },
      { company: 'Vaibhav Global', symbol: 'VAIBHAVGBL', sector: 'E-commerce Jewellery', holdingPct: 1.9, holdingValueCr: 110, changeLastQuarter: 'DECREASED', changePct: -0.2 },
    ],
  },
];
