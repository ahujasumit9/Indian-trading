import { Candle, VolumeProfileData, VolumeProfileLevel } from '../../types/market';

/**
 * Calculates Institutional Volume Profile
 * Bins price ranges, aggregates trade volumes, and computes Point of Control (POC),
 * Value Area High (VAH), and Value Area Low (VAL) at 70% standard deviation.
 */
export function calculateVolumeProfile(
  candles: Candle[],
  numBins: number = 24
): VolumeProfileData {
  if (!candles || candles.length === 0) {
    return {
      poc: 0,
      vah: 0,
      val: 0,
      totalVolume: 0,
      valueAreaVolume: 0,
      levels: [],
      acceptanceStatus: 'TESTING_VALUE_AREA',
      migrationDirection: 'STATIONARY',
    };
  }

  // Find price bounds
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let totalVolume = 0;

  for (const c of candles) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    totalVolume += c.volume;
  }

  const range = maxPrice - minPrice;
  const binSize = range > 0 ? range / numBins : 1;

  // Initialize bins
  const bins: {
    price: number;
    volume: number;
    buyVolume: number;
    sellVolume: number;
  }[] = [];

  for (let i = 0; i < numBins; i++) {
    const binMidPrice = minPrice + (i + 0.5) * binSize;
    bins.push({
      price: Number(binMidPrice.toFixed(2)),
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
    });
  }

  // Distribute candle volume across bins it spans
  for (const c of candles) {
    const cHigh = c.high;
    const cLow = c.low;
    const cVol = c.volume;
    const isBullish = c.close >= c.open;

    // Estimate touched bins
    const lowBinIdx = Math.max(0, Math.min(numBins - 1, Math.floor((cLow - minPrice) / binSize)));
    const highBinIdx = Math.max(0, Math.min(numBins - 1, Math.floor((cHigh - minPrice) / binSize)));
    const touchedCount = highBinIdx - lowBinIdx + 1;
    const volPerBin = cVol / touchedCount;

    for (let b = lowBinIdx; b <= highBinIdx; b++) {
      bins[b].volume += volPerBin;
      if (isBullish) {
        bins[b].buyVolume += volPerBin * 0.6;
        bins[b].sellVolume += volPerBin * 0.4;
      } else {
        bins[b].buyVolume += volPerBin * 0.4;
        bins[b].sellVolume += volPerBin * 0.6;
      }
    }
  }

  // Find POC (Point of Control)
  let maxBinVol = -1;
  let pocIdx = 0;
  for (let i = 0; i < numBins; i++) {
    if (bins[i].volume > maxBinVol) {
      maxBinVol = bins[i].volume;
      pocIdx = i;
    }
  }
  const poc = bins[pocIdx].price;

  // Compute 70% Value Area starting from POC expanding outwards
  const targetValueAreaVol = totalVolume * 0.7;
  let currentVaVol = bins[pocIdx].volume;
  let upIdx = pocIdx;
  let downIdx = pocIdx;

  while (currentVaVol < targetValueAreaVol && (upIdx < numBins - 1 || downIdx > 0)) {
    const nextUpVol = upIdx < numBins - 1 ? bins[upIdx + 1].volume : -1;
    const nextDownVol = downIdx > 0 ? bins[downIdx - 1].volume : -1;

    if (nextUpVol >= nextDownVol && upIdx < numBins - 1) {
      upIdx++;
      currentVaVol += bins[upIdx].volume;
    } else if (downIdx > 0) {
      downIdx--;
      currentVaVol += bins[downIdx].volume;
    } else if (upIdx < numBins - 1) {
      upIdx++;
      currentVaVol += bins[upIdx].volume;
    } else {
      break;
    }
  }

  const vah = bins[upIdx].price;
  const val = bins[downIdx].price;

  // Identify High Volume Nodes (HVN) and Low Volume Nodes (LVN)
  const avgBinVol = totalVolume / numBins;
  const levels: VolumeProfileLevel[] = bins.map((b, idx) => ({
    price: b.price,
    volume: Math.round(b.volume),
    buyVolume: Math.round(b.buyVolume),
    sellVolume: Math.round(b.sellVolume),
    isPOC: idx === pocIdx,
    isVAH: idx === upIdx,
    isVAL: idx === downIdx,
    isHVN: b.volume > avgBinVol * 1.4,
    isLVN: b.volume < avgBinVol * 0.5,
  }));

  // Acceptance vs Rejection status based on latest close
  const lastClose = candles[candles.length - 1].close;
  let acceptanceStatus: 'ACCEPTED' | 'REJECTED' | 'TESTING_VALUE_AREA' = 'TESTING_VALUE_AREA';

  if (lastClose > vah) {
    // If last close is above VAH and volume is expanding, accepted; if tapering, rejected
    const recentVol = candles.slice(-3).reduce((acc, c) => acc + c.volume, 0) / 3;
    acceptanceStatus = recentVol > avgBinVol ? 'ACCEPTED' : 'REJECTED';
  } else if (lastClose < val) {
    const recentVol = candles.slice(-3).reduce((acc, c) => acc + c.volume, 0) / 3;
    acceptanceStatus = recentVol > avgBinVol ? 'ACCEPTED' : 'REJECTED';
  } else {
    acceptanceStatus = 'TESTING_VALUE_AREA';
  }

  // POC Migration (compare first half vs second half POC)
  let migrationDirection: 'HIGHER' | 'LOWER' | 'STATIONARY' = 'STATIONARY';
  if (candles.length >= 10) {
    const half = Math.floor(candles.length / 2);
    const firstHalfProfile = calculateVolumeProfile(candles.slice(0, half), 12);
    if (poc > firstHalfProfile.poc * 1.002) {
      migrationDirection = 'HIGHER';
    } else if (poc < firstHalfProfile.poc * 0.998) {
      migrationDirection = 'LOWER';
    }
  }

  return {
    poc: Number(poc.toFixed(2)),
    vah: Number(vah.toFixed(2)),
    val: Number(val.toFixed(2)),
    totalVolume: Math.round(totalVolume),
    valueAreaVolume: Math.round(currentVaVol),
    levels,
    acceptanceStatus,
    migrationDirection,
  };
}
