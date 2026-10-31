/**
 * Indian Stock & Index Opportunity Screener Engine
 * Evaluates F&O Open Interest Buildup, Volume Shockers, Technical Reclaims, and Momentum
 */

export interface ScreenerItem {
  symbol: string;
  name: string;
  sector: string;
  ltp: number;
  changePct: number;
  volume: number;
  volumeMultiplier: number; // vs 20-day avg
  oi: number;
  oiChangePct: number;
  buildup: 'LONG_BUILDUP' | 'SHORT_BUILDUP' | 'SHORT_COVERING' | 'LONG_UNWINDING' | 'NEUTRAL';
  rsi14: number;
  aboveVwap: boolean;
  aboveEma20: boolean;
  aboveEma200: boolean;
  signalTag: string;
  ivRank: number; // 0 to 100
}

export type ScreenerFilter =
  | 'ALL'
  | 'LONG_BUILDUP'
  | 'SHORT_BUILDUP'
  | 'SHORT_COVERING'
  | 'LONG_UNWINDING'
  | 'VOLUME_SHOCKERS'
  | 'VWAP_RECLAIM'
  | 'RSI_BULLISH';

export const SCREENER_UNIVERSE: ScreenerItem[] = [
  {
    symbol: 'NIFTY 50',
    name: 'NSE NIFTY 50 Index',
    sector: 'Broad Market Index',
    ltp: 24285.5,
    changePct: 0.65,
    volume: 185000000,
    volumeMultiplier: 1.25,
    oi: 12450000,
    oiChangePct: 4.8,
    buildup: 'LONG_BUILDUP',
    rsi14: 58.4,
    aboveVwap: true,
    aboveEma20: true,
    aboveEma200: true,
    signalTag: 'Bullish Continuation',
    ivRank: 38,
  },
  {
    symbol: 'BSE SENSEX',
    name: 'BSE SENSEX Index',
    sector: 'Broad Market Index',
    ltp: 79840.0,
    changePct: 0.58,
    volume: 82000000,
    volumeMultiplier: 1.18,
    oi: 4210000,
    oiChangePct: 3.9,
    buildup: 'LONG_BUILDUP',
    rsi14: 56.9,
    aboveVwap: true,
    aboveEma20: true,
    aboveEma200: true,
    signalTag: 'Testing All-Time High Resistance',
    ivRank: 42,
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    sector: 'Banking',
    ltp: 1742.0,
    changePct: 1.45,
    volume: 14200000,
    volumeMultiplier: 2.1,
    oi: 41200000,
    oiChangePct: 6.8,
    buildup: 'LONG_BUILDUP',
    rsi14: 64.2,
    aboveVwap: true,
    aboveEma20: true,
    aboveEma200: true,
    signalTag: 'Heavy Institutional Call Writing Unwind',
    ivRank: 29,
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries',
    sector: 'Energy',
    ltp: 2940.5,
    changePct: 0.82,
    volume: 6800000,
    volumeMultiplier: 1.45,
    oi: 28500000,
    oiChangePct: 2.4,
    buildup: 'LONG_BUILDUP',
    rsi14: 59.8,
    aboveVwap: true,
    aboveEma20: true,
    aboveEma200: true,
    signalTag: '20 EMA Pullback Bounce',
    ivRank: 34,
  },
  {
    symbol: 'TATASTEEL',
    name: 'Tata Steel Ltd.',
    sector: 'Metals',
    ltp: 154.2,
    changePct: -2.35,
    volume: 38000000,
    volumeMultiplier: 2.85,
    oi: 84000000,
    oiChangePct: 11.2,
    buildup: 'SHORT_BUILDUP',
    rsi14: 38.2,
    aboveVwap: false,
    aboveEma20: false,
    aboveEma200: true,
    signalTag: 'Aggressive Put Buying / Fresh Short Buildup',
    ivRank: 78,
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    sector: 'IT Services',
    ltp: 1895.0,
    changePct: 1.85,
    volume: 9500000,
    volumeMultiplier: 1.95,
    oi: 22000000,
    oiChangePct: -4.5,
    buildup: 'SHORT_COVERING',
    rsi14: 62.1,
    aboveVwap: true,
    aboveEma20: true,
    aboveEma200: true,
    signalTag: 'Short Covering Rally Above 1880 Call Wall',
    ivRank: 44,
  },
  {
    symbol: 'AXISBANK',
    name: 'Axis Bank Ltd.',
    sector: 'Banking',
    ltp: 1180.0,
    changePct: -1.15,
    volume: 7200000,
    volumeMultiplier: 0.95,
    oi: 18400000,
    oiChangePct: -3.8,
    buildup: 'LONG_UNWINDING',
    rsi14: 48.5,
    aboveVwap: false,
    aboveEma20: false,
    aboveEma200: true,
    signalTag: 'Long Positions Squaring Off Ahead of Weekly Expiry',
    ivRank: 52,
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd.',
    sector: 'Telecom',
    ltp: 1680.0,
    changePct: 2.15,
    volume: 11400000,
    volumeMultiplier: 3.2,
    oi: 15800000,
    oiChangePct: 8.9,
    buildup: 'LONG_BUILDUP',
    rsi14: 71.5,
    aboveVwap: true,
    aboveEma20: true,
    aboveEma200: true,
    signalTag: 'Volume Shocker Breakout to Fresh ATH',
    ivRank: 61,
  },
];

export function filterScreenerItems(items: ScreenerItem[], filter: ScreenerFilter): ScreenerItem[] {
  switch (filter) {
    case 'LONG_BUILDUP':
      return items.filter((i) => i.buildup === 'LONG_BUILDUP');
    case 'SHORT_BUILDUP':
      return items.filter((i) => i.buildup === 'SHORT_BUILDUP');
    case 'SHORT_COVERING':
      return items.filter((i) => i.buildup === 'SHORT_COVERING');
    case 'LONG_UNWINDING':
      return items.filter((i) => i.buildup === 'LONG_UNWINDING');
    case 'VOLUME_SHOCKERS':
      return items.filter((i) => i.volumeMultiplier >= 2.0);
    case 'VWAP_RECLAIM':
      return items.filter((i) => i.aboveVwap && i.aboveEma20);
    case 'RSI_BULLISH':
      return items.filter((i) => i.rsi14 >= 60);
    case 'ALL':
    default:
      return items;
  }
}
