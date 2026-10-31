import React, { useRef, useEffect, useState } from 'react';
import { Candle } from '../../types/market';

interface ChartCanvasProps {
  candles: Candle[];
  height?: number;
  showIndicators?: {
    ema15?: boolean;
    ema20?: boolean;
    ema50?: boolean;
    vwap?: boolean;
    supertrend?: boolean;
  };
  title?: string;
  supportResistanceLevels?: { price: number; label: string; color: string }[];
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  candles,
  height = 360,
  showIndicators = { ema15: true, ema20: true, ema50: true, vwap: true },
  title,
  supportResistanceLevels = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, h);

    const padding = { top: 25, right: 65, bottom: 45, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const mainChartH = chartH * 0.78;
    const volChartH = chartH * 0.20;
    const volTop = padding.top + mainChartH + 6;

    // Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const priceBuffer = (maxPrice - minPrice) * 0.05 || 10;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => padding.top + (1 - (price - minPrice) / priceRange) * mainChartH;

    // Grid lines (Horizontal Price)
    const numPriceLines = 5;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';

    for (let i = 0; i <= numPriceLines; i++) {
      const p = minPrice + (priceRange / numPriceLines) * i;
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(p.toFixed(1), width - padding.right + 6, y + 3);
    }

    const n = candles.length;
    const barSpacing = chartW / n;
    const candleWidth = Math.max(2, Math.min(16, barSpacing * 0.7));

    // Render Volume Bars
    candles.forEach((c, i) => {
      const x = padding.left + i * barSpacing + barSpacing / 2;
      const barH = (c.volume / (maxVol || 1)) * volChartH;
      const y = volTop + volChartH - barH;

      ctx.fillStyle = c.close >= c.open ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
      ctx.fillRect(x - candleWidth / 2, y, candleWidth, barH);
    });

    // Support & Resistance Lines
    supportResistanceLevels.forEach((sr) => {
      const y = getY(sr.price);
      if (y >= padding.top && y <= padding.top + mainChartH) {
        ctx.strokeStyle = sr.color;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = sr.color;
        ctx.fillText(`${sr.label} ${sr.price}`, width - padding.right + 6, y - 2);
      }
    });

    // Render Candlesticks
    candles.forEach((c, i) => {
      const x = padding.left + i * barSpacing + barSpacing / 2;
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      const isBull = c.close >= c.open;
      const color = isBull ? '#10b981' : '#f43f5e';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Render Indicator Lines
    const drawLine = (vals: (number | undefined)[], strokeStyle: string, lineWidth: number = 1.5) => {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      let started = false;

      vals.forEach((v, i) => {
        if (v === undefined || isNaN(v)) return;
        const x = padding.left + i * barSpacing + barSpacing / 2;
        const y = getY(v);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };

    if (showIndicators.vwap) {
      drawLine(candles.map((c) => c.vwap), '#06b6d4', 2.0); // Cyan VWAP
    }
    if (showIndicators.ema15) {
      drawLine(candles.map((c) => c.ema15), '#f59e0b', 1.5); // Amber EMA15
    }
    if (showIndicators.ema20) {
      drawLine(candles.map((c) => c.ema20), '#3b82f6', 1.5); // Blue EMA20
    }
    if (showIndicators.ema50) {
      drawLine(candles.map((c) => c.ema50), '#a855f7', 1.5); // Purple EMA50
    }

    // Time Labels on X axis
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    const stepLabel = Math.max(1, Math.floor(n / 6));
    for (let i = 0; i < n; i += stepLabel) {
      const x = padding.left + i * barSpacing + barSpacing / 2;
      ctx.fillText(String(candles[i].timestamp), x - 12, h - 12);
    }

    // Crosshair & Tooltip
    if (hoverIndex !== null && hoverPos && hoverIndex >= 0 && hoverIndex < n) {
      const activeCandle = candles[hoverIndex];
      const x = padding.left + hoverIndex * barSpacing + barSpacing / 2;

      // Vertical line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, h - padding.bottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, hoverPos.y);
      ctx.lineTo(width - padding.right, hoverPos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tooltip Card
      const ttX = Math.min(width - 180, Math.max(15, x + 10));
      const ttY = padding.top + 10;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ttX, ttY, 160, 85, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`Time: ${activeCandle.timestamp}`, ttX + 8, ttY + 16);
      ctx.fillStyle = activeCandle.close >= activeCandle.open ? '#10b981' : '#f43f5e';
      ctx.fillText(`O: ${activeCandle.open} H: ${activeCandle.high}`, ttX + 8, ttY + 32);
      ctx.fillText(`L: ${activeCandle.low} C: ${activeCandle.close}`, ttX + 8, ttY + 46);
      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`VWAP: ${activeCandle.vwap || '-'}`, ttX + 8, ttY + 60);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`Vol: ${(activeCandle.volume).toLocaleString('en-IN')}`, ttX + 8, ttY + 74);
    }
  }, [candles, height, showIndicators, supportResistanceLevels, hoverIndex, hoverPos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { left: 10, right: 65 };
    const chartW = rect.width - padding.left - padding.right;
    const barSpacing = chartW / candles.length;
    const idx = Math.floor((x - padding.left) / barSpacing);

    if (idx >= 0 && idx < candles.length) {
      setHoverIndex(idx);
      setHoverPos({ x, y });
    } else {
      setHoverIndex(null);
      setHoverPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  return (
    <div className="relative w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Top Legend Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          {title && <span className="font-bold text-slate-200">{title}</span>}
          <span className="text-slate-400">5M Intraday</span>
        </div>
        <div className="flex items-center gap-3">
          {showIndicators.vwap && (
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> VWAP
            </span>
          )}
          {showIndicators.ema15 && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-0.5 bg-amber-400 inline-block" /> EMA 15
            </span>
          )}
          {showIndicators.ema20 && (
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-0.5 bg-blue-400 inline-block" /> EMA 20
            </span>
          )}
          {showIndicators.ema50 && (
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-0.5 bg-purple-400 inline-block" /> EMA 50
            </span>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ height: `${height}px`, width: '100%' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block cursor-crosshair"
      />
    </div>
  );
};
