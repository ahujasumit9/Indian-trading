import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  ListTree,
  BrainCircuit,
  CandlestickChart,
  Layers,
  PieChart,
  Activity,
  Compass,
  Sliders,
  History,
  Briefcase,
  BookOpen,
  ShieldAlert,
  Database,
  Link2,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';

export type NavViewId =
  | 'overview'
  | 'sensex'
  | 'nifty'
  | 'option_chain'
  | 'signals'
  | 'technicals'
  | 'volume_profile'
  | 'oi_intel'
  | 'greeks'
  | 'sentiment'
  | 'strategies'
  | 'backtesting'
  | 'paper_trading'
  | 'journal'
  | 'risk'
  | 'data_sources'
  | 'brokers'
  | 'settings';

interface NavItem {
  id: NavViewId;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  activeView: NavViewId;
  onSelectView: (view: NavViewId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  openPositionsCount: number;
  unreadSignalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  openPositionsCount,
  unreadSignalsCount,
}) => {
  const navSections: NavSection[] = [
    {
      title: 'Market Indices',
      items: [
        { id: 'overview' as NavViewId, label: 'Market Overview', icon: LayoutDashboard },
        { id: 'sensex' as NavViewId, label: 'SENSEX Intelligence', icon: BarChart3, badge: 'BSE' },
        { id: 'nifty' as NavViewId, label: 'NIFTY Intelligence', icon: TrendingUp, badge: 'NSE' },
      ],
    },
    {
      title: 'Derivatives & Signals',
      items: [
        { id: 'option_chain' as NavViewId, label: 'Option Chain Matrix', icon: ListTree },
        {
          id: 'signals' as NavViewId,
          label: 'AI Trading Signals',
          icon: BrainCircuit,
          badge: unreadSignalsCount > 0 ? `${unreadSignalsCount}` : 'LIVE',
          badgeColor: 'emerald',
        },
        { id: 'technicals' as NavViewId, label: 'Technical Analysis', icon: CandlestickChart },
        { id: 'volume_profile' as NavViewId, label: 'Volume Profile (POC)', icon: Layers },
        { id: 'oi_intel' as NavViewId, label: 'OI Intelligence & PCR', icon: PieChart },
        { id: 'greeks' as NavViewId, label: 'Greeks & IV Surface', icon: Activity },
        { id: 'sentiment' as NavViewId, label: 'Market Sentiment & VIX', icon: Compass },
      ],
    },
    {
      title: 'Execution & Research',
      items: [
        { id: 'strategies' as NavViewId, label: 'Strategy Builder', icon: Sliders },
        { id: 'backtesting' as NavViewId, label: 'Backtesting Engine', icon: History },
        {
          id: 'paper_trading' as NavViewId,
          label: 'Paper Trading',
          icon: Briefcase,
          badge: openPositionsCount > 0 ? `${openPositionsCount}` : undefined,
          badgeColor: 'amber',
        },
        { id: 'journal' as NavViewId, label: 'Trade Journal & Ledger', icon: BookOpen },
        { id: 'risk' as NavViewId, label: 'Risk Management', icon: ShieldAlert },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { id: 'data_sources' as NavViewId, label: 'Data Source Manager', icon: Database },
        { id: 'brokers' as NavViewId, label: 'Broker Adapters', icon: Link2, badge: 'SAFE' },
        { id: 'settings' as NavViewId, label: 'Terminal Settings', icon: SettingsIcon },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center font-black text-black text-xs">
              ₹
            </div>
            <span className="font-bold text-sm text-white">INDIA AI TRADER</span>
          </div>
          <button onClick={onCloseMobile} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectView(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-800/90 text-cyan-400 font-semibold border-l-2 border-cyan-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${
                            item.badgeColor === 'emerald'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.badgeColor === 'amber'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Status Box */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Execution Mode:</span>
              <span className="text-amber-400 font-bold">PAPER TRADING</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 text-[10px]">
              <span>Live Order Lock:</span>
              <span className="text-emerald-400 font-bold">ENGAGED (SAFE)</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
