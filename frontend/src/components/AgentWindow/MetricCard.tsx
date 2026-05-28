import { useMemo } from 'react';
import type { MetricField, NormalRange } from '../../types/index';
import { useCountUp } from '../../hooks/useCountUp';

export interface MetricCardProps {
  metric: MetricField;
}

function getRangeMinMax(range: NormalRange): { min: number; max: number } | null {
  if (!range || Array.isArray(range)) return null;
  if ('min' in range && 'max' in range) return { min: range.min, max: range.max };
  return null;
}

function isOutOfRange(value: number | string, range: NormalRange): boolean {
  if (typeof value !== 'number' || !range || Array.isArray(range)) return false;
  if ('min' in range && 'max' in range) return value < range.min || value > range.max;
  if ('min' in range) return value < range.min;
  if ('max' in range) return value > range.max;
  return false;
}

function formatRange(range: NormalRange): string {
  if (!range) return 'No range';
  if (Array.isArray(range)) return range.join(' / ');
  if ('min' in range && 'max' in range) return `${range.min}-${range.max}`;
  if ('min' in range) return `>= ${range.min}`;
  return `<= ${range.max}`;
}

export function MetricCard({ metric }: MetricCardProps) {
  const numericValue = typeof metric.value === 'number' ? metric.value : null;
  const animatedValue = useCountUp(numericValue ?? 0, { duration: 500, decimals: 2 });
  const outOfRange = isOutOfRange(metric.value, metric.normalRange);

  const rangeProgress = useMemo(() => {
    if (numericValue === null) return null;
    const bounds = getRangeMinMax(metric.normalRange);
    if (!bounds) return null;
    const span = bounds.max - bounds.min;
    if (span <= 0) return null;
    const padding = span * 0.2;
    const displayMin = bounds.min - padding;
    const displayMax = bounds.max + padding;
    const pos = (numericValue - displayMin) / (displayMax - displayMin);
    return Math.max(0, Math.min(1, pos));
  }, [numericValue, metric.normalRange]);

  return (
    <article
      className={`rounded-[var(--radius-card)] border p-2 transition-all duration-500 ${
        outOfRange
          ? 'border-rose-500/60 bg-rose-950/30 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
          : 'border-[var(--color-border-default)] bg-slate-900/60'
      }`}
    >
      <p className="truncate text-[11px] text-slate-400">{metric.label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums transition-colors duration-500 ${
        outOfRange ? 'text-rose-300' : 'text-slate-100'
      }`}>
        {numericValue !== null ? animatedValue : metric.value}
        {metric.unit ? <span className="ml-1 text-xs text-slate-400">{metric.unit}</span> : null}
      </p>

      {rangeProgress !== null && (
        <div className="mt-1.5 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
          <div className="relative h-full w-full">
            <div className="absolute inset-y-0 left-[14%] right-[14%] bg-emerald-900/40 rounded-full" />
            <div
              className={`absolute top-0 h-full w-1.5 rounded-full transition-all duration-500 ${
                outOfRange ? 'bg-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.6)]' : 'bg-emerald-400'
              }`}
              style={{ left: `calc(${rangeProgress * 100}% - 3px)` }}
            />
          </div>
        </div>
      )}

      <p className="mt-1 truncate text-[10px] text-slate-500">{formatRange(metric.normalRange)}</p>
    </article>
  );
}
