import type { AgentId, AgentUIStatus, MetricField, NormalRange } from '../../types/index';

export interface AgentWindowProps {
  agentId: AgentId;
  title: string;
  status: AgentUIStatus;
  role: string;
  metrics: MetricField[];
  footerText?: string;
  isActive?: boolean;
  isMinimized?: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  onFocus: (agentId: AgentId) => void;
  onMinimize: (agentId: AgentId) => void;
  onClose: (agentId: AgentId) => void;
  className?: string;
}

const statusTone: Record<AgentUIStatus, { dot: string; title: string; label: string }> = {
  normal: { dot: 'bg-emerald-400', title: 'bg-slate-900', label: 'Normal' },
  pending: { dot: 'bg-amber-400', title: 'bg-slate-900', label: 'Pending' },
  alarm: { dot: 'bg-rose-400', title: 'bg-rose-950/80', label: 'Alarm' },
  recovering: { dot: 'bg-teal-400', title: 'bg-emerald-950/70', label: 'Recovering' },
};

function formatRange(range: NormalRange): string {
  if (!range) return 'No range';
  if (Array.isArray(range)) return range.join(' / ');
  if ('min' in range && 'max' in range) return `${range.min}-${range.max}`;
  if ('min' in range) return `>= ${range.min}`;
  return `<= ${range.max}`;
}

export function AgentWindow({
  agentId,
  title,
  status,
  role,
  metrics,
  footerText = 'Ready',
  isActive = false,
  isMinimized = false,
  position,
  size,
  zIndex,
  onFocus,
  onMinimize,
  onClose,
  className = '',
}: AgentWindowProps) {
  if (isMinimized) return null;

  const tone = statusTone[status];

  return (
    <section
      className={`absolute overflow-hidden rounded-lg border bg-slate-950/95 text-slate-100 shadow-2xl ${
        isActive ? 'border-cyan-400/70' : 'border-slate-700'
      } ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      onMouseDown={() => onFocus(agentId)}
      aria-label={`${title} agent window`}
    >
      <header className={`flex items-center justify-between px-3 py-2 ${tone.title}`}>
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{tone.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMinimize(agentId)}
            className="h-7 w-7 rounded text-slate-300 hover:bg-slate-800"
            aria-label={`Minimize ${title}`}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onClose(agentId)}
            className="h-7 w-7 rounded text-slate-300 hover:bg-slate-800"
            aria-label={`Close ${title}`}
          >
            x
          </button>
        </div>
      </header>

      <div className="space-y-3 p-3">
        <p className="rounded border border-slate-800 bg-slate-900/70 p-2 text-xs leading-5 text-slate-300">
          {role}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <article key={metric.key} className="rounded border border-slate-800 bg-slate-900/60 p-2">
              <p className="truncate text-[11px] text-slate-400">{metric.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">
                {metric.value}
                {metric.unit ? <span className="ml-1 text-xs text-slate-400">{metric.unit}</span> : null}
              </p>
              <p className="mt-1 truncate text-[10px] text-slate-500">{formatRange(metric.normalRange)}</p>
            </article>
          ))}
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 border-t border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
        {footerText}
      </footer>
    </section>
  );
}
