import React, { useState } from 'react';
import { MarketIndex, OptionChainData, OptionStrike } from '../../types/market';
import { PaperOrderTicket } from '../../types/trade';
import { ListTree, Filter, Zap, ArrowUpDown, ChevronDown } from 'lucide-react';

interface OptionChainViewProps {
  optionChain: OptionChainData;
  selectedUnderlying: MarketIndex;
  onSelectUnderlying: (idx: MarketIndex) => void;
  onRequestApproval: (ticket: PaperOrderTicket) => void;
}

export const OptionChainView: React.FC<OptionChainViewProps> = ({
  optionChain,
  selectedUnderlying,
  onSelectUnderlying,
  onRequestApproval,
}) => {
  const [strikeRange, setStrikeRange] = useState<number>(10); // ±10 strikes
  const [showGreeks, setShowGreeks] = useState<boolean>(true);
  const [selectedExpiry, setSelectedExpiry] = useState<string>(optionChain.expiryDate);

  const { spotPrice, atmStrike, strikes, pcr, maxPain, highestCallOIStrike, highestPutOIStrike } =
    optionChain;

  // Filter strikes around ATM
  const atmIndex = strikes.findIndex((s) => s.strike === atmStrike);
  const startIdx = Math.max(0, atmIndex - strikeRange);
  const endIdx = Math.min(strikes.length, atmIndex + strikeRange + 1);
  const displayedStrikes = strikes.slice(startIdx, endIdx);

  const handleStrikeClick = (s: OptionStrike, optType: 'CE' | 'PE') => {
    const isCE = optType === 'CE';
    const ltp = isCE ? s.ce.ltp : s.pe.ltp;
    const lotSize = selectedUnderlying === 'NIFTY' ? 50 : 20;
    const stopLoss = Number((ltp * 0.8).toFixed(1));
    const target1 = Number((ltp * 1.35).toFixed(1));

    const ticket: PaperOrderTicket = {
      ticketId: `TKT-${selectedUnderlying}-${s.strike}-${optType}`,
      timestamp: new Date().toISOString(),
      index: selectedUnderlying,
      optionType: optType,
      strike: s.strike,
      expiry: selectedExpiry,
      orderType: 'LIMIT',
      limitPrice: ltp,
      quantity: lotSize * 2,
      lotSize,
      lots: 2,
      stopLoss,
      target1,
      target2: Number((ltp * 1.6).toFixed(1)),
      estimatedRisk: (ltp - stopLoss) * lotSize * 2,
      allowedRisk: 1500,
      estimatedCharges: 38,
      signalScore: 78,
      strategy: 'Option Chain Direct Selection',
    };
    onRequestApproval(ticket);
  };

  const getBuildupBadge = (buildup: string) => {
    switch (buildup) {
      case 'Long Buildup':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Short Buildup':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'Short Covering':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'Long Unwinding':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Index Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-md p-0.5 bg-slate-950 border border-slate-800 font-mono text-xs font-bold">
            <button
              onClick={() => onSelectUnderlying('NIFTY')}
              className={`px-3 py-1.5 rounded transition-all ${
                selectedUnderlying === 'NIFTY'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NIFTY 50
            </button>
            <button
              onClick={() => onSelectUnderlying('SENSEX')}
              className={`px-3 py-1.5 rounded transition-all ${
                selectedUnderlying === 'SENSEX'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BSE SENSEX
            </button>
          </div>

          <div className="font-mono text-xs">
            <span className="text-slate-500">Spot:</span>{' '}
            <span className="font-bold text-slate-100">₹{spotPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Expiry & Greeks Toggle */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Expiry:</span>
            <select
              value={selectedExpiry}
              onChange={(e) => setSelectedExpiry(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {optionChain.availableExpiries.map((exp) => (
                <option key={exp} value={exp}>
                  {exp} (Weekly)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Strikes:</span>
            <select
              value={strikeRange}
              onChange={(e) => setStrikeRange(parseInt(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
            >
              <option value={5}>± 5 Strikes</option>
              <option value={10}>± 10 Strikes</option>
              <option value={15}>± 15 Strikes</option>
            </select>
          </div>

          <button
            onClick={() => setShowGreeks(!showGreeks)}
            className={`px-2.5 py-1 rounded border transition-all ${
              showGreeks
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {showGreeks ? 'Greeks Active' : 'Show Greeks'}
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-center">
          <span className="text-[10px] text-slate-500 block uppercase">ATM Strike</span>
          <span className="font-bold text-cyan-400 text-sm">{atmStrike}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-center">
          <span className="text-[10px] text-slate-500 block uppercase">Total PCR</span>
          <span
            className={`font-bold text-sm ${pcr >= 1.1 ? 'text-emerald-400' : pcr <= 0.85 ? 'text-rose-400' : 'text-slate-200'}`}
          >
            {pcr.toFixed(3)}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-center">
          <span className="text-[10px] text-slate-500 block uppercase">Max Pain Strike</span>
          <span className="font-bold text-purple-400 text-sm">{maxPain}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-center">
          <span className="text-[10px] text-slate-500 block uppercase">Highest Call OI (Res)</span>
          <span className="font-bold text-rose-400 text-sm">{highestCallOIStrike}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 text-center col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-500 block uppercase">Highest Put OI (Sup)</span>
          <span className="font-bold text-emerald-400 text-sm">{highestPutOIStrike}</span>
        </div>
      </div>

      {/* Master Institutional Option Chain Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-center font-mono text-xs">
            {/* Super Header */}
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 font-bold text-xs uppercase tracking-wider">
                <th
                  colSpan={showGreeks ? 8 : 5}
                  className="py-2 px-3 text-emerald-400 bg-emerald-950/20 border-r border-slate-800"
                >
                  CALLS (CE)
                </th>
                <th className="py-2 px-4 text-cyan-300 bg-slate-900 border-r border-slate-800">
                  STRIKE
                </th>
                <th
                  colSpan={showGreeks ? 8 : 5}
                  className="py-2 px-3 text-rose-400 bg-rose-950/20"
                >
                  PUTS (PE)
                </th>
              </tr>
              {/* Sub Columns */}
              <tr className="bg-slate-950/80 text-[10px] text-slate-400 border-b border-slate-800">
                {/* CE Side */}
                {showGreeks && <th className="py-2 px-2 text-slate-500">IV</th>}
                {showGreeks && <th className="py-2 px-2 text-slate-500">Delta</th>}
                {showGreeks && <th className="py-2 px-2 text-slate-500">Theta</th>}
                <th className="py-2 px-2">OI</th>
                <th className="py-2 px-2">Chg OI</th>
                <th className="py-2 px-2">Volume</th>
                <th className="py-2 px-2">Buildup</th>
                <th className="py-2 px-3 text-emerald-400 font-bold border-r border-slate-800">LTP</th>

                {/* Strike Center */}
                <th className="py-2 px-4 text-slate-200 font-bold border-r border-slate-800 bg-slate-900">
                  PRICE
                </th>

                {/* PE Side */}
                <th className="py-2 px-3 text-rose-400 font-bold">LTP</th>
                <th className="py-2 px-2">Buildup</th>
                <th className="py-2 px-2">Volume</th>
                <th className="py-2 px-2">Chg OI</th>
                <th className="py-2 px-2">OI</th>
                {showGreeks && <th className="py-2 px-2 text-slate-500">Theta</th>}
                {showGreeks && <th className="py-2 px-2 text-slate-500">Delta</th>}
                {showGreeks && <th className="py-2 px-2 text-slate-500">IV</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {displayedStrikes.map((s) => {
                const isAtm = s.isAtm;
                const isItmCE = s.isItmCE;
                const isItmPE = s.isItmPE;
                const isMaxPain = s.strike === maxPain;

                return (
                  <tr
                    key={s.strike}
                    className={`transition-colors ${
                      isAtm
                        ? 'bg-cyan-950/25 font-bold border-y border-cyan-500/50'
                        : 'hover:bg-slate-850/50'
                    }`}
                  >
                    {/* CE Greeks */}
                    {showGreeks && (
                      <td className="py-2 px-2 text-[10px] text-slate-400">{s.ce.iv}%</td>
                    )}
                    {showGreeks && (
                      <td className="py-2 px-2 text-[10px] text-slate-300 font-semibold">
                        {s.ce.greeks?.delta}
                      </td>
                    )}
                    {showGreeks && (
                      <td className="py-2 px-2 text-[10px] text-rose-400/80">
                        {s.ce.greeks?.theta}
                      </td>
                    )}

                    {/* CE OI & Vol */}
                    <td className="py-2 px-2 text-slate-300 font-medium">
                      {(s.ce.oi / 1000).toFixed(1)}k
                    </td>
                    <td
                      className={`py-2 px-2 text-[10px] ${
                        s.ce.oiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {s.ce.oiChange >= 0 ? '+' : ''}
                      {(s.ce.oiChange / 1000).toFixed(1)}k
                    </td>
                    <td className="py-2 px-2 text-[10px] text-slate-400">
                      {(s.ce.volume / 1000).toFixed(1)}k
                    </td>

                    {/* CE Buildup Badge */}
                    <td className="py-2 px-1">
                      <span className={`text-[9px] px-1 py-0.5 rounded border ${getBuildupBadge(s.ce.buildup)}`}>
                        {s.ce.buildup.replace('Buildup', '')}
                      </span>
                    </td>

                    {/* CE LTP (Clickable) */}
                    <td
                      onClick={() => handleStrikeClick(s, 'CE')}
                      className={`py-2 px-3 font-bold border-r border-slate-800 cursor-pointer hover:underline ${
                        isItmCE ? 'bg-emerald-950/20 text-emerald-300' : 'text-emerald-400'
                      }`}
                      title="Click to trade this Call option"
                    >
                      ₹{s.ce.ltp}
                    </td>

                    {/* Strike Center */}
                    <td
                      className={`py-2 px-4 font-bold border-r border-slate-800 ${
                        isAtm
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : isMaxPain
                          ? 'bg-purple-950/30 text-purple-300'
                          : 'bg-slate-950/70 text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{s.strike}</span>
                        {isAtm && (
                          <span className="text-[9px] px-1 rounded bg-cyan-400 text-black font-extrabold">
                            ATM
                          </span>
                        )}
                        {isMaxPain && (
                          <span className="text-[9px] px-1 rounded bg-purple-500 text-white font-extrabold">
                            MP
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PE LTP (Clickable) */}
                    <td
                      onClick={() => handleStrikeClick(s, 'PE')}
                      className={`py-2 px-3 font-bold cursor-pointer hover:underline ${
                        isItmPE ? 'bg-rose-950/20 text-rose-300' : 'text-rose-400'
                      }`}
                      title="Click to trade this Put option"
                    >
                      ₹{s.pe.ltp}
                    </td>

                    {/* PE Buildup Badge */}
                    <td className="py-2 px-1">
                      <span className={`text-[9px] px-1 py-0.5 rounded border ${getBuildupBadge(s.pe.buildup)}`}>
                        {s.pe.buildup.replace('Buildup', '')}
                      </span>
                    </td>

                    {/* PE Vol & OI */}
                    <td className="py-2 px-2 text-[10px] text-slate-400">
                      {(s.pe.volume / 1000).toFixed(1)}k
                    </td>
                    <td
                      className={`py-2 px-2 text-[10px] ${
                        s.pe.oiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {s.pe.oiChange >= 0 ? '+' : ''}
                      {(s.pe.oiChange / 1000).toFixed(1)}k
                    </td>
                    <td className="py-2 px-2 text-slate-300 font-medium">
                      {(s.pe.oi / 1000).toFixed(1)}k
                    </td>

                    {/* PE Greeks */}
                    {showGreeks && (
                      <td className="py-2 px-2 text-[10px] text-rose-400/80">
                        {s.pe.greeks?.theta}
                      </td>
                    )}
                    {showGreeks && (
                      <td className="py-2 px-2 text-[10px] text-slate-300 font-semibold">
                        {s.pe.greeks?.delta}
                      </td>
                    )}
                    {showGreeks && (
                      <td className="py-2 px-2 text-[10px] text-slate-400">{s.pe.iv}%</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
