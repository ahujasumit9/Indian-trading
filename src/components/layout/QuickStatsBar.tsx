import React from 'react';
import { MarketSnapshot } from '../../lib/data/marketSimulator';
import { MetricCard } from '../common/MetricCard';
import { PaperPosition } from '../../types/trade';
import { TrendingUp, ShieldCheck, Zap, Activity } from 'lucide-react';

interface QuickStatsBarProps {
  activeSnapshot: MarketSnapshot;
  openPositions: PaperPosition[];
  todayRealizedPnL: number;
  onSelectView?: (view: any) => void;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  activeSnapshot,
  openPositions,
  todayRealizedPnL,
  onSelectView,
}) => {
  const { index, spotPrice, priceChange, priceChangePct, optionChain, volumeProfile, aiSignal, indiaVix } =
    activeSnapshot;

  const totalUnrealizedPnL = openPositions.reduce((acc, p) => acc + p.unrealizedPnL, 0);
  const totalCombinedPnL = todayRealizedPnL + totalUnrealizedPnL;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
      {/* 1. Underlying Spot */}
      <MetricCard
        label={`${index} SPOT`}
        value={spotPrice.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
        change={priceChange}
        changeSuffix={` (${priceChangePct.toFixed(2)}%)`}
        badge={index === 'NIFTY' ? 'NSE' : 'BSE'}
        badgeColor="blue"
        trend={priceChange >= 0 ? 'up' : 'down'}
      />

      {/* 2. ATM Strike & PCR */}
      <MetricCard
        label="ATM & PCR"
        value={optionChain.atmStrike.toLocaleString('en-IN')}
        subValue={`PCR: ${optionChain.pcr.toFixed(3)} (${optionChain.pcr > 1.1 ? 'Bullish' : optionChain.pcr < 0.85 ? 'Bearish' : 'Neutral'})`}
        badge={`Max Pain: ${optionChain.maxPain}`}
        badgeColor={optionChain.pcr > 1.1 ? 'green' : optionChain.pcr < 0.85 ? 'red' : 'yellow'}
      />

      {/* 3. Highest OI Walls (Resistance / Support) */}
      <MetricCard
        label="OI Walls (Res / Sup)"
        value={`${optionChain.highestCallOIStrike}`}
        subValue={`Sup: ${optionChain.highestPutOIStrike}`}
        badge="OI CLUSTERS"
        badgeColor="purple"
      />

      {/* 4. Volume Profile POC & India VIX */}
      <MetricCard
        label="POC & INDIA VIX"
        value={`POC: ${volumeProfile.poc}`}
        subValue={`VIX: ${indiaVix.toFixed(2)} (${volumeProfile.acceptanceStatus})`}
        badge={volumeProfile.acceptanceStatus}
        badgeColor={volumeProfile.acceptanceStatus === 'ACCEPTED' ? 'green' : 'yellow'}
        icon={Activity}
      />

      {/* 5. AI Signal Score */}
      <MetricCard
        label="AI SIGNAL SCORE"
        value={`${aiSignal.score}/100`}
        subValue={`${aiSignal.type} (${aiSignal.confidence}% Conf)`}
        badge={aiSignal.type}
        badgeColor={
          aiSignal.type === 'BUY CE' ? 'green' : aiSignal.type === 'BUY PE' ? 'red' : 'yellow'
        }
        icon={Zap}
        onClick={() => onSelectView?.('signals')}
      />

      {/* 6. Active Paper Positions & Daily P&L */}
      <MetricCard
        label="DAILY P&L (PAPER)"
        value={`₹${totalCombinedPnL.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`}
        subValue={`${openPositions.length} Open Pos | Realized: ₹${todayRealizedPnL.toFixed(0)}`}
        trend={totalCombinedPnL >= 0 ? 'up' : 'down'}
        badge={openPositions.length > 0 ? `${openPositions.length} ACTIVE` : 'FLAT'}
        badgeColor={totalCombinedPnL >= 0 ? 'green' : 'red'}
        onClick={() => onSelectView?.('paper_trading')}
      />
    </div>
  );
};
