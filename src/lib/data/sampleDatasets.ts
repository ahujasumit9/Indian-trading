import { Candle, MarketIndex } from '../../types/market';
import { enrichCandlesWithIndicators } from '../math/technicals';

/**
 * Generates a realistic 1-day intraday series of 5-minute candles
 * (9:15 AM to 3:30 PM IST = 75 candles)
 */
export function generateRealisticSessionCandles(
  index: MarketIndex,
  type: 'TRENDING_BULL' | 'TRENDING_BEAR' | 'EXPIRY_VOLATILE' | 'CONSOLIDATION'
): Candle[] {
  const baseSpot = index === 'NIFTY' ? 24150 : 79420;
  const candleCount = 65;
  const raw: Candle[] = [];

  let currentPrice = baseSpot;
  const startTime = new Date();
  startTime.setHours(9, 15, 0, 0);

  const baseVol = index === 'NIFTY' ? 45000 : 25000;
  const stepVolatility = index === 'NIFTY' ? 14 : 45;

  for (let i = 0; i < candleCount; i++) {
    const candleTime = new Date(startTime.getTime() + i * 5 * 60 * 1000);
    const timeStr = candleTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    let drift = 0;
    let volMultiplier = 1.0;

    if (type === 'TRENDING_BULL') {
      drift = (i > 15 ? 4.5 : 1.5) + (Math.random() - 0.35) * stepVolatility;
      if (i >= 18 && i <= 24) volMultiplier = 2.4; // Breakout volume burst
    } else if (type === 'TRENDING_BEAR') {
      drift = -(i > 15 ? 5.0 : 1.5) + (Math.random() - 0.65) * stepVolatility;
      if (i >= 20 && i <= 26) volMultiplier = 2.2;
    } else if (type === 'EXPIRY_VOLATILE') {
      drift = Math.sin(i / 4) * (stepVolatility * 1.8) + (Math.random() - 0.5) * stepVolatility;
      if (i > 45) volMultiplier = 2.8; // Afternoon 2:00 PM expiry gamma move
    } else {
      drift = (Math.random() - 0.5) * (stepVolatility * 0.7);
    }

    const open = currentPrice;
    const close = Number((open + drift).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * (stepVolatility * 0.8)).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * (stepVolatility * 0.8)).toFixed(2));
    const volume = Math.round(baseVol * volMultiplier * (0.6 + Math.random() * 0.8));

    raw.push({
      timestamp: timeStr,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return enrichCandlesWithIndicators(raw);
}

export const SAMPLE_CANDLE_CSV = `timestamp,open,high,low,close,volume
09:15,24150.20,24185.00,24140.10,24175.50,45200
09:20,24176.00,24198.40,24165.20,24190.10,52300
09:25,24191.00,24215.80,24188.00,24210.00,61000
09:30,24210.50,24240.20,24205.10,24235.60,84500
09:35,24236.00,24265.00,24230.00,24258.90,92000
09:40,24259.00,24278.50,24245.00,24270.20,78000
09:45,24271.00,24295.00,24260.40,24288.50,71000
09:50,24289.00,24310.20,24280.00,24305.10,89000
09:55,24306.00,24325.50,24295.20,24318.00,95000
10:00,24319.00,24340.00,24312.00,24335.80,112000`;

export const SAMPLE_OPTION_CHAIN_CSV = `strike,option_type,ltp,volume,oi,oi_change,iv
24100,CE,215.50,45200,65000,12500,13.8
24100,PE,42.20,18300,42000,-4500,14.5
24150,CE,175.80,58000,78000,15400,14.0
24150,PE,58.40,29000,56000,-6200,14.2
24200,CE,138.20,89000,124000,28500,14.2
24200,PE,78.50,42000,79000,-8900,14.4
24250,CE,105.40,94000,148000,32000,14.5
24250,PE,102.10,65000,95000,-11200,14.6
24300,CE,78.10,125000,215000,45000,14.8
24300,PE,135.00,88000,142000,-15400,14.7`;
