import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: number;
  changeSuffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: 'green' | 'red' | 'yellow' | 'blue' | 'purple';
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  change,
  changeSuffix = '%',
  trend,
  icon: Icon,
  badge,
  badgeColor = 'blue',
  onClick,
  className = '',
}) => {
  const isUp = trend === 'up' || (change !== undefined && change > 0);
  const isDown = trend === 'down' || (change !== undefined && change < 0);

  const badgeColorMap = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    red: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 shadow-sm hover:border-slate-700 transition-all ${
        onClick ? 'cursor-pointer hover:bg-slate-850' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-400 truncate uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${badgeColorMap[badgeColor]}`}>
              {badge}
            </span>
          )}
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-lg font-bold text-slate-100 tracking-tight font-mono">{value}</div>
        {(change !== undefined || subValue) && (
          <div className="text-right">
            {change !== undefined && (
              <span
                className={`text-xs font-semibold font-mono ${
                  isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'
                }`}
              >
                {isUp ? '+' : ''}
                {change}
                {changeSuffix}
              </span>
            )}
            {subValue && <div className="text-[11px] text-slate-400 truncate">{subValue}</div>}
          </div>
        )}
      </div>
    </div>
  );
};
