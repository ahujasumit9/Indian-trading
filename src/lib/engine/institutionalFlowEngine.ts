/**
 * Institutional Activity (FII / DII) Market Data Engine
 * Models exchange disclosures of Foreign Institutional Investors (FIIs) and Domestic Institutional Investors (DIIs)
 * Tracks Cash Segment Net Inflows/Outflows and Index Futures Net Long/Short contracts.
 */

export interface DailyInstitutionalActivity {
  date: string;
  fiiCashBuyCr: number;
  fiiCashSellCr: number;
  fiiCashNetCr: number;
  diiCashBuyCr: number;
  diiCashSellCr: number;
  diiCashNetCr: number;
  totalCashNetCr: number;
  fiiIndexFuturesLongContracts: number;
  fiiIndexFuturesShortContracts: number;
  fiiFuturesLongShortRatio: number;
  proIndexFuturesLongContracts: number;
  proIndexFuturesShortContracts: number;
  clientIndexFuturesLongContracts: number;
  clientIndexFuturesShortContracts: number;
  institutionalBias: 'STRONGLY_BULLISH' | 'MILDLY_BULLISH' | 'NEUTRAL' | 'MILDLY_BEARISH' | 'STRONGLY_BEARISH';
}

export const RECENT_INSTITUTIONAL_DATA: DailyInstitutionalActivity[] = [
  {
    date: '30-Oct-2026',
    fiiCashBuyCr: 12480.5,
    fiiCashSellCr: 11210.2,
    fiiCashNetCr: 1270.3,
    diiCashBuyCr: 9840.1,
    diiCashSellCr: 7650.0,
    diiCashNetCr: 2190.1,
    totalCashNetCr: 3460.4,
    fiiIndexFuturesLongContracts: 114500,
    fiiIndexFuturesShortContracts: 68200,
    fiiFuturesLongShortRatio: 1.68,
    proIndexFuturesLongContracts: 45000,
    proIndexFuturesShortContracts: 42000,
    clientIndexFuturesLongContracts: 82000,
    clientIndexFuturesShortContracts: 131300,
    institutionalBias: 'STRONGLY_BULLISH',
  },
  {
    date: '29-Oct-2026',
    fiiCashBuyCr: 10890.0,
    fiiCashSellCr: 10240.5,
    fiiCashNetCr: 649.5,
    diiCashBuyCr: 8920.0,
    diiCashSellCr: 7410.2,
    diiCashNetCr: 1509.8,
    totalCashNetCr: 2159.3,
    fiiIndexFuturesLongContracts: 108200,
    fiiIndexFuturesShortContracts: 72100,
    fiiFuturesLongShortRatio: 1.5,
    proIndexFuturesLongContracts: 42000,
    proIndexFuturesShortContracts: 44000,
    clientIndexFuturesLongContracts: 86000,
    clientIndexFuturesShortContracts: 120100,
    institutionalBias: 'MILDLY_BULLISH',
  },
  {
    date: '28-Oct-2026',
    fiiCashBuyCr: 9450.2,
    fiiCashSellCr: 10120.0,
    fiiCashNetCr: -669.8,
    diiCashBuyCr: 9140.0,
    diiCashSellCr: 7250.0,
    diiCashNetCr: 1890.0,
    totalCashNetCr: 1220.2,
    fiiIndexFuturesLongContracts: 98400,
    fiiIndexFuturesShortContracts: 79200,
    fiiFuturesLongShortRatio: 1.24,
    proIndexFuturesLongContracts: 39000,
    proIndexFuturesShortContracts: 41000,
    clientIndexFuturesLongContracts: 91000,
    clientIndexFuturesShortContracts: 108200,
    institutionalBias: 'NEUTRAL',
  },
  {
    date: '27-Oct-2026',
    fiiCashBuyCr: 11200.0,
    fiiCashSellCr: 12450.0,
    fiiCashNetCr: -1250.0,
    diiCashBuyCr: 10450.0,
    diiCashSellCr: 8120.0,
    diiCashNetCr: 2330.0,
    totalCashNetCr: 1080.0,
    fiiIndexFuturesLongContracts: 91200,
    fiiIndexFuturesShortContracts: 84500,
    fiiFuturesLongShortRatio: 1.08,
    proIndexFuturesLongContracts: 37000,
    proIndexFuturesShortContracts: 39000,
    clientIndexFuturesLongContracts: 95000,
    clientIndexFuturesShortContracts: 99700,
    institutionalBias: 'NEUTRAL',
  },
  {
    date: '24-Oct-2026',
    fiiCashBuyCr: 13100.0,
    fiiCashSellCr: 10950.0,
    fiiCashNetCr: 2150.0,
    diiCashBuyCr: 8750.0,
    diiCashSellCr: 7900.0,
    diiCashNetCr: 850.0,
    totalCashNetCr: 3000.0,
    fiiIndexFuturesLongContracts: 112000,
    fiiIndexFuturesShortContracts: 65000,
    fiiFuturesLongShortRatio: 1.72,
    proIndexFuturesLongContracts: 46000,
    proIndexFuturesShortContracts: 40000,
    clientIndexFuturesLongContracts: 79000,
    clientIndexFuturesShortContracts: 132000,
    institutionalBias: 'STRONGLY_BULLISH',
  },
];
