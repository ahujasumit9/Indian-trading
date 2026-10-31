export type MarketIndex = 'NIFTY' | 'SENSEX';

export type OptionType = 'CE' | 'PE';

export interface Candle {
  timestamp: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema15?: number;
  ema20?: number;
  ema50?: number;
  vwap?: number;
  rsi14?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  atr14?: number;
  supertrend?: number;
  supertrendDir?: 'UP' | 'DOWN';
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  volumeMA?: number;
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  iv: number;
}

export type BuildupType =
  | 'Long Buildup'
  | 'Short Buildup'
  | 'Short Covering'
  | 'Long Unwinding'
  | 'Neutral';

export interface OptionStrike {
  strike: number;
  isAtm: boolean;
  isItmCE: boolean;
  isItmPE: boolean;
  ce: {
    ltp: number;
    change: number;
    pChange: number;
    oi: number;
    oiChange: number;
    pOiChange: number;
    volume: number;
    bid: number;
    ask: number;
    spread: number;
    iv: number;
    greeks: OptionGreeks;
    buildup: BuildupType;
  };
  pe: {
    ltp: number;
    change: number;
    pChange: number;
    oi: number;
    oiChange: number;
    pOiChange: number;
    volume: number;
    bid: number;
    ask: number;
    spread: number;
    iv: number;
    greeks: OptionGreeks;
    buildup: BuildupType;
  };
}

export interface OptionChainData {
  underlying: MarketIndex;
  spotPrice: number;
  atmStrike: number;
  expiryDate: string;
  availableExpiries: string[];
  strikes: OptionStrike[];
  totalCallOI: number;
  totalPutOI: number;
  totalCallVolume: number;
  totalPutVolume: number;
  pcr: number;
  maxPain: number;
  highestCallOIStrike: number;
  highestPutOIStrike: number;
  lastUpdated: string;
  dataSource: string;
}

export interface VolumeProfileLevel {
  price: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  isPOC: boolean;
  isVAH: boolean;
  isVAL: boolean;
  isHVN: boolean;
  isLVN: boolean;
}

export interface VolumeProfileData {
  poc: number;
  vah: number;
  val: number;
  totalVolume: number;
  valueAreaVolume: number;
  levels: VolumeProfileLevel[];
  acceptanceStatus: 'ACCEPTED' | 'REJECTED' | 'TESTING_VALUE_AREA';
  migrationDirection: 'HIGHER' | 'LOWER' | 'STATIONARY';
}

export interface InstitutionalFlow {
  date: string;
  fiiGrossBuy: number;
  fiiGrossSell: number;
  fiiNet: number;
  diiGrossBuy: number;
  diiGrossSell: number;
  diiNet: number;
  totalNet: number;
}

export interface MarketSentimentData {
  indiaVix: number;
  vixChange: number;
  vixRegime: 'LOW_VOLATILITY' | 'NORMAL' | 'HIGH_VOLATILITY' | 'EXTREME_FEAR';
  pcr: number;
  pcrRegime: 'OVERSOLD_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'OVERBOUGHT_BEARISH';
  institutionalNetToday: number; // in Crores INR
  sentimentScore: number; // 0 to 100
  sentimentSummary: string;
}
