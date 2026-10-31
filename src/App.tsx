import React, { useState, useEffect, useRef } from 'react';
import { MarketIndex, Candle, OptionChainData } from './types/market';
import { PaperOrderTicket, PaperPosition, TradeJournalEntry, RiskSettings } from './types/trade';
import { DataSourceStatus, TradingViewAlert, BrokerConfig } from './types/dataSources';
import { TradingStrategy } from './types/signals';

import {
  createInitialMarketSnapshot,
  advanceMarketTick,
  MarketSnapshot,
} from './lib/data/marketSimulator';
import { generateRealisticSessionCandles } from './lib/data/sampleDatasets';
import {
  getStoredPositions,
  saveStoredPositions,
  getStoredJournal,
  saveStoredJournal,
  getStoredRiskSettings,
  saveStoredRiskSettings,
  getStoredAlerts,
  saveStoredAlerts,
  getStoredBrokers,
  saveStoredBrokers,
  getStoredStrategies,
  saveStoredStrategies,
} from './lib/storage/localStore';
import { createTicketFingerprint, globalApprovalLedger } from './lib/engine/approvalLedger';
import { calculateIndianOptionCharges } from './lib/engine/riskEngine';

// Layout Components
import { Header } from './components/layout/Header';
import { Sidebar, NavViewId } from './components/layout/Sidebar';
import { QuickStatsBar } from './components/layout/QuickStatsBar';
import { TradeApprovalModal } from './components/common/TradeApprovalModal';

// View Components
import { MarketOverview } from './components/views/MarketOverview';
import { SensexIntelligence } from './components/views/SensexIntelligence';
import { NiftyIntelligence } from './components/views/NiftyIntelligence';
import { OptionChainView } from './components/views/OptionChainView';
import { AISignalsView } from './components/views/AISignalsView';
import { TechnicalAnalysisView } from './components/views/TechnicalAnalysisView';
import { VolumeProfileView } from './components/views/VolumeProfileView';
import { OIIntelligenceView } from './components/views/OIIntelligenceView';
import { GreeksIVView } from './components/views/GreeksIVView';
import { MarketSentimentView } from './components/views/MarketSentimentView';
import { StrategyBuilderView } from './components/views/StrategyBuilderView';
import { BacktestingView } from './components/views/BacktestingView';
import { PaperTradingView } from './components/views/PaperTradingView';
import { TradeJournalView } from './components/views/TradeJournalView';
import { RiskManagementView } from './components/views/RiskManagementView';
import { DataSourceManagerView } from './components/views/DataSourceManagerView';
import { BrokerIntegrationView } from './components/views/BrokerIntegrationView';
import { SettingsView } from './components/views/SettingsView';
import { AnalystView } from './components/views/AnalystView';
import { ScreenerView } from './components/views/ScreenerView';
import { NewsView } from './components/views/NewsView';
import { BudgetView } from './components/views/BudgetView';
import { InstitutionalFlowView } from './components/views/InstitutionalFlowView';
import { TaxView } from './components/views/TaxView';
import { CopycatView } from './components/views/CopycatView';
import { RebalanceView } from './components/views/RebalanceView';

export default function App() {
  // Navigation & Selection State
  const [activeView, setActiveView] = useState<NavViewId>('overview');
  const [selectedUnderlying, setSelectedUnderlying] = useState<MarketIndex>('NIFTY');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Market Snapshots
  const [niftySnapshot, setNiftySnapshot] = useState<MarketSnapshot>(() =>
    createInitialMarketSnapshot('NIFTY', generateRealisticSessionCandles('NIFTY', 'TRENDING_BULL'))
  );
  const [sensexSnapshot, setSensexSnapshot] = useState<MarketSnapshot>(() =>
    createInitialMarketSnapshot('SENSEX', generateRealisticSessionCandles('SENSEX', 'TRENDING_BULL'))
  );

  // Data Source & Simulation State
  const [dataSourceStatus, setDataSourceStatus] = useState<DataSourceStatus>({
    activeSource: 'SIMULATOR',
    marketDataState: 'SIMULATED',
    sourceLabel: 'Synthetic Market Simulator',
    isLiveUpdating: true,
    updateFrequencySec: 3,
    lastUpdateTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    totalCandlesLoaded: 65,
    totalStrikesLoaded: 31,
    webhookCount: 0,
    statusMessage: 'Realistic Indian market simulation running (NIFTY & SENSEX).',
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Trade, Risk & Storage State
  const [positions, setPositions] = useState<PaperPosition[]>(getStoredPositions);
  const [journal, setJournal] = useState<TradeJournalEntry[]>(getStoredJournal);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>(getStoredRiskSettings);
  const [strategies, setStrategies] = useState<TradingStrategy[]>(getStoredStrategies);
  const [brokers, setBrokers] = useState<BrokerConfig[]>(getStoredBrokers);
  const [tvAlerts, setTvAlerts] = useState<TradingViewAlert[]>(getStoredAlerts);

  // Modal Approval Gate State
  const [pendingTicket, setPendingTicket] = useState<PaperOrderTicket | null>(null);
  const [pendingFingerprint, setPendingFingerprint] = useState<string>('');
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    saveStoredPositions(positions);
  }, [positions]);

  useEffect(() => {
    saveStoredJournal(journal);
  }, [journal]);

  useEffect(() => {
    saveStoredRiskSettings(riskSettings);
  }, [riskSettings]);

  useEffect(() => {
    saveStoredStrategies(strategies);
  }, [strategies]);

  useEffect(() => {
    saveStoredBrokers(brokers);
  }, [brokers]);

  useEffect(() => {
    saveStoredAlerts(tvAlerts);
  }, [tvAlerts]);

  // Real-time market tick simulation loop (every 3 seconds)
  useEffect(() => {
    if (!isSimulating || dataSourceStatus.activeSource !== 'SIMULATOR') return;

    const interval = setInterval(() => {
      setNiftySnapshot((prev) => {
        const next = advanceMarketTick(prev, 0.85);
        return next;
      });

      setSensexSnapshot((prev) => {
        const next = advanceMarketTick(prev, 0.85);
        return next;
      });

      // Update positions live MTM
      setPositions((prevPositions) =>
        prevPositions.map((pos) => {
          if (pos.status !== 'OPEN') return pos;
          const currentSpot = pos.index === 'NIFTY' ? niftySnapshot.spotPrice : sensexSnapshot.spotPrice;
          const move = (currentSpot - pos.strike) * 0.005;
          const delta = pos.optionType === 'CE' ? 0.52 : -0.52;
          const priceShift = (Math.random() - 0.49) * 1.5 + (move * delta);
          const newPrice = Math.max(0.5, Number((pos.currentPrice + priceShift).toFixed(2)));
          const pnl = Number(((newPrice - pos.entryPrice) * pos.quantity).toFixed(2));
          const pnlPct = Number(((pnl / (pos.entryPrice * pos.quantity)) * 100).toFixed(2));

          return {
            ...pos,
            currentPrice: newPrice,
            unrealizedPnL: pnl,
            unrealizedPnLPercent: pnlPct,
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating, dataSourceStatus.activeSource, niftySnapshot.spotPrice, sensexSnapshot.spotPrice]);

  // Synchronize incoming TradingView webhooks from server in real-time
  const lastProcessedAlertId = useRef<string | null>(null);

  useEffect(() => {
    const pollWebhooks = async () => {
      try {
        const res = await fetch('/api/webhooks/tradingview/history');
        if (!res.ok) return;
        const data = await res.json();
        if (data.alerts && data.alerts.length > 0) {
          const latestAlert = data.alerts[0];
          if (latestAlert.id !== lastProcessedAlertId.current) {
            lastProcessedAlertId.current = latestAlert.id;
            setTvAlerts(data.alerts);

            // If alert has a valid price, update live market snapshot
            const isNifty =
              latestAlert.ticker.toUpperCase().includes('NIFTY') ||
              latestAlert.ticker.toUpperCase().includes('NIFTY50');
            const isSensex =
              latestAlert.ticker.toUpperCase().includes('SENSEX') ||
              latestAlert.ticker.toUpperCase().includes('BSESEN');

            if (latestAlert.price && (isNifty || isSensex)) {
              const targetIdx = isNifty ? 'NIFTY' : 'SENSEX';
              if (targetIdx === 'NIFTY') {
                setNiftySnapshot((prev) => {
                  const updatedCandles = [...prev.candles];
                  const lastIdx = updatedCandles.length - 1;
                  updatedCandles[lastIdx] = {
                    ...updatedCandles[lastIdx],
                    close: latestAlert.price,
                    high: Math.max(updatedCandles[lastIdx].high, latestAlert.price),
                    low: Math.min(updatedCandles[lastIdx].low, latestAlert.price),
                    volume: updatedCandles[lastIdx].volume + (latestAlert.volume || 100),
                  };
                  return createInitialMarketSnapshot('NIFTY', updatedCandles, prev.indiaVix);
                });
              } else {
                setSensexSnapshot((prev) => {
                  const updatedCandles = [...prev.candles];
                  const lastIdx = updatedCandles.length - 1;
                  updatedCandles[lastIdx] = {
                    ...updatedCandles[lastIdx],
                    close: latestAlert.price,
                    high: Math.max(updatedCandles[lastIdx].high, latestAlert.price),
                    low: Math.min(updatedCandles[lastIdx].low, latestAlert.price),
                    volume: updatedCandles[lastIdx].volume + (latestAlert.volume || 100),
                  };
                  return createInitialMarketSnapshot('SENSEX', updatedCandles, prev.indiaVix);
                });
              }

              setDataSourceStatus((prev) => ({
                ...prev,
                activeSource: 'TRADINGVIEW_WEBHOOK',
                statusMessage: `Live price ₹${latestAlert.price} received from TradingView alert`,
                lastUpdateTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
              }));
              setIsSimulating(false); // Pause simulation when real TradingView alert arrives
            }
          }
        }
      } catch {
        // Ignored if serverless or network idle
      }
    };

    const webhookInterval = setInterval(pollWebhooks, 2500);
    return () => clearInterval(webhookInterval);
  }, []);

  // Calculate today's realized P&L
  const todayDate = new Date().toISOString().split('T')[0];
  const todayRealizedPnL = journal
    .filter((j) => j.date === todayDate)
    .reduce((acc, j) => acc + j.netPnl, 0);

  // Auto circuit breaker: check if daily loss breached
  useEffect(() => {
    if (todayRealizedPnL < 0 && Math.abs(todayRealizedPnL) >= riskSettings.maxDailyLoss) {
      if (!riskSettings.killSwitchActive) {
        setRiskSettings((prev) => ({ ...prev, killSwitchActive: true }));
      }
    }
  }, [todayRealizedPnL, riskSettings.maxDailyLoss, riskSettings.killSwitchActive]);

  // Handle Trade Proposal Request -> Open Approval Gate
  const handleRequestApproval = async (ticket: PaperOrderTicket) => {
    try {
      const fingerprint = await createTicketFingerprint(ticket);
      setPendingTicket(ticket);
      setPendingFingerprint(fingerprint);
      setIsApprovalModalOpen(true);
    } catch (err) {
      console.error('Failed to generate ticket fingerprint:', err);
    }
  };

  // Handle Explicit User Approval
  const handleApproveTrade = (ticket: PaperOrderTicket, fingerprint: string) => {
    globalApprovalLedger.approveTicket(fingerprint, ticket, true);

    const positionId = `pos_${Date.now()}`;
    const newPosition: PaperPosition = {
      positionId,
      ticketFingerprint: fingerprint,
      index: ticket.index,
      optionType: ticket.optionType,
      strike: ticket.strike,
      expiry: ticket.expiry,
      entryPrice: ticket.limitPrice,
      currentPrice: ticket.limitPrice,
      quantity: ticket.quantity,
      lots: ticket.lots,
      lotSize: ticket.lotSize,
      entryTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      stopLoss: ticket.stopLoss,
      target1: ticket.target1,
      target2: ticket.target2,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      status: 'OPEN',
      strategy: ticket.strategy,
    };

    setPositions((prev) => [newPosition, ...prev]);
  };

  // Handle Reject Proposal
  const handleRejectProposal = (ticket: PaperOrderTicket) => {
    setPendingTicket(null);
    setPendingFingerprint('');
  };

  // Close Active Position -> Record in Trade Journal
  const handleClosePosition = (positionId: string, exitPrice?: number) => {
    const pos = positions.find((p) => p.positionId === positionId);
    if (!pos) return;

    const actualExit = exitPrice || pos.currentPrice;
    const grossPnL = (actualExit - pos.entryPrice) * pos.quantity;
    const charges = calculateIndianOptionCharges(pos.entryPrice, pos.quantity) +
      calculateIndianOptionCharges(actualExit, pos.quantity);
    const netPnl = Number((grossPnL - charges).toFixed(2));

    const journalEntry: TradeJournalEntry = {
      id: `tj_${Date.now()}`,
      fingerprint: pos.ticketFingerprint,
      ticketId: `TKT-EXEC-${positionId.slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      index: pos.index,
      instrument: `${pos.index} ${pos.strike} ${pos.optionType}`,
      optionType: pos.optionType,
      strike: pos.strike,
      expiry: pos.expiry,
      quantity: pos.quantity,
      lots: pos.lots,
      entryPrice: pos.entryPrice,
      exitPrice: actualExit,
      stopLoss: pos.stopLoss,
      target: pos.target1,
      pnl: Number(grossPnL.toFixed(2)),
      netPnl,
      charges,
      strategy: pos.strategy,
      marketRegime: (pos.index === 'NIFTY' ? niftySnapshot : sensexSnapshot).aiSignal.regime,
      entryRationale: 'Executed with explicit user approval token and risk check pass',
      exitReason: 'Manual closure from Paper Trading Desk',
      userApproved: true,
      approvalTimestamp: new Date().toISOString(),
      aiScore: (pos.index === 'NIFTY' ? niftySnapshot : sensexSnapshot).aiSignal.score,
      dataSource: dataSourceStatus.activeSource,
    };

    setJournal((prev) => [journalEntry, ...prev]);
    setPositions((prev) => prev.filter((p) => p.positionId !== positionId));
  };

  const handleCloseAllPositions = () => {
    positions.forEach((p) => {
      handleClosePosition(p.positionId, p.currentPrice);
    });
  };

  const handleToggleKillSwitch = () => {

    setRiskSettings((prev) => ({
      ...prev,
      killSwitchActive: !prev.killSwitchActive,
    }));
  };

  const activeSnapshot = selectedUnderlying === 'NIFTY' ? niftySnapshot : sensexSnapshot;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Top Fixed Header */}
      <Header
        niftySnapshot={niftySnapshot}
        sensexSnapshot={sensexSnapshot}
        dataSourceStatus={dataSourceStatus}
        isSimulating={isSimulating}
        onToggleSimulating={() => setIsSimulating(!isSimulating)}
        killSwitchActive={riskSettings.killSwitchActive}
        onToggleKillSwitch={handleToggleKillSwitch}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        activeView={activeView}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Institutional Left Sidebar */}
        <Sidebar
          activeView={activeView}
          onSelectView={(view) => setActiveView(view)}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          openPositionsCount={positions.length}
          unreadSignalsCount={activeSnapshot.aiSignal.score >= 75 ? 1 : 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Quick KPI Stats Bar */}
            <QuickStatsBar
              activeSnapshot={activeSnapshot}
              openPositions={positions}
              todayRealizedPnL={todayRealizedPnL}
              onSelectView={setActiveView}
            />

            {/* View Switching */}
            {activeView === 'overview' && (
              <MarketOverview
                niftySnapshot={niftySnapshot}
                sensexSnapshot={sensexSnapshot}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
                onRequestApproval={handleRequestApproval}
                openPositions={positions}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'sensex' && (
              <SensexIntelligence
                snapshot={sensexSnapshot}
                onRequestApproval={handleRequestApproval}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'nifty' && (
              <NiftyIntelligence
                snapshot={niftySnapshot}
                onRequestApproval={handleRequestApproval}
                onNavigate={setActiveView}
              />
            )}

            {activeView === 'option_chain' && (
              <OptionChainView
                optionChain={activeSnapshot.optionChain}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
                onRequestApproval={handleRequestApproval}
              />
            )}

            {activeView === 'signals' && (
              <AISignalsView
                signal={activeSnapshot.aiSignal}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
                spotPrice={activeSnapshot.spotPrice}
                pcr={activeSnapshot.optionChain.pcr}
                indiaVix={activeSnapshot.indiaVix}
                pocPrice={activeSnapshot.volumeProfile.poc}
                onRequestApproval={handleRequestApproval}
              />
            )}

            {activeView === 'technicals' && (
              <TechnicalAnalysisView
                candles={activeSnapshot.candles}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
              />
            )}

            {activeView === 'volume_profile' && (
              <VolumeProfileView
                volumeProfile={activeSnapshot.volumeProfile}
                spotPrice={activeSnapshot.spotPrice}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
              />
            )}

            {activeView === 'oi_intel' && (
              <OIIntelligenceView
                optionChain={activeSnapshot.optionChain}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
              />
            )}

            {activeView === 'greeks' && (
              <GreeksIVView
                optionChain={activeSnapshot.optionChain}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
              />
            )}

            {activeView === 'sentiment' && (
              <MarketSentimentView
                indiaVix={activeSnapshot.indiaVix}
                vixChange={activeSnapshot.vixChange}
                pcr={activeSnapshot.optionChain.pcr}
              />
            )}

            {activeView === 'strategies' && (
              <StrategyBuilderView
                strategies={strategies}
                onToggleStrategy={(id) =>
                  setStrategies((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
                  )
                }
                onUpdateWeight={(id, weight) =>
                  setStrategies((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, weight } : s))
                  )
                }
                candles={activeSnapshot.candles}
                optionChain={activeSnapshot.optionChain}
                volumeProfile={activeSnapshot.volumeProfile}
              />
            )}

            {activeView === 'backtesting' && (
              <BacktestingView
                candles={activeSnapshot.candles}
                selectedUnderlying={selectedUnderlying}
                onSelectUnderlying={setSelectedUnderlying}
              />
            )}

            {activeView === 'analyst' && <AnalystView />}
            {activeView === 'screener' && <ScreenerView />}
            {activeView === 'news' && <NewsView />}
            {activeView === 'budget' && <BudgetView />}
            {activeView === 'institutional_flow' && <InstitutionalFlowView />}
            {activeView === 'tax' && <TaxView />}
            {activeView === 'copycat' && <CopycatView />}
            {activeView === 'rebalance' && <RebalanceView />}

            {activeView === 'paper_trading' && (

              <PaperTradingView
                positions={positions}
                onClosePosition={handleClosePosition}
                onCloseAllPositions={handleCloseAllPositions}
                onRequestApproval={handleRequestApproval}
                riskSettings={riskSettings}
              />

            )}

            {activeView === 'journal' && <TradeJournalView entries={journal} />}

            {activeView === 'risk' && (
              <RiskManagementView
                settings={riskSettings}
                onUpdateSettings={setRiskSettings}
                onToggleKillSwitch={handleToggleKillSwitch}
              />
            )}

            {activeView === 'data_sources' && (
              <DataSourceManagerView
                status={dataSourceStatus}
                onSelectSource={(source) => {
                  setDataSourceStatus((prev) => ({
                    ...prev,
                    activeSource: source,
                    statusMessage: `Active feed switched to ${source}`,
                  }));
                  setIsSimulating(source === 'SIMULATOR');
                }}
                onLoadCandles={(candles, fileName) => {
                  if (selectedUnderlying === 'NIFTY') {
                    setNiftySnapshot(createInitialMarketSnapshot('NIFTY', candles));
                  } else {
                    setSensexSnapshot(createInitialMarketSnapshot('SENSEX', candles));
                  }
                  setDataSourceStatus((prev) => ({
                    ...prev,
                    csvFileName: fileName,
                    totalCandlesLoaded: candles.length,
                  }));
                }}
                onLoadOptionChain={(chain) => {
                  if (selectedUnderlying === 'NIFTY') {
                    setNiftySnapshot((prev) => ({ ...prev, optionChain: chain }));
                  } else {
                    setSensexSnapshot((prev) => ({ ...prev, optionChain: chain }));
                  }
                }}
                tvAlerts={tvAlerts}
                onAddTvAlert={(alert) => {
                  setTvAlerts((prev) => [alert, ...prev]);
                  setDataSourceStatus((prev) => ({ ...prev, webhookCount: prev.webhookCount + 1 }));
                }}
                selectedUnderlying={selectedUnderlying}
              />
            )}

            {activeView === 'brokers' && (
              <BrokerIntegrationView
                brokers={brokers}
                onUpdateBroker={(updated) =>
                  setBrokers((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
                }
              />
            )}

            {activeView === 'settings' && (
              <SettingsView
                riskSettings={riskSettings}
                onUpdateRiskSettings={setRiskSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Institutional Trade Approval Modal */}
      <TradeApprovalModal
        ticket={pendingTicket}
        fingerprint={pendingFingerprint}
        riskSettings={riskSettings}
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onApprove={handleApproveTrade}
        onReject={handleRejectProposal}
      />
    </div>
  );
}
