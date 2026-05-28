import type { DecisionStep } from '../../types';

export interface DecisionChainProps {
  steps: DecisionStep[];
  className?: string;
}

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
}

export function DecisionChain({ steps, className = '' }: DecisionChainProps) {
  const totalDuration = steps.reduce((sum, s) => sum + (s.estimatedDuration ?? 0), 0);

  return (
    <div className={className}>
      <ol className="relative mt-2 space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <li key={step.index} className="relative flex items-start gap-3 pb-4">
              {/* 竖向连线 */}
              {!isLast && (
                <span
                  className={`absolute left-[7px] top-5 h-[calc(100%-12px)] w-px ${
                    step.completed ? 'bg-emerald-500/60' : 'bg-slate-700'
                  }`}
                />
              )}

              {/* 节点圆点 */}
              <span className="relative z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                {step.completed ? (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500">
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : step.active ? (
                  <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-cyan-400/40" />
                    <span className="relative h-2.5 w-2.5 rounded-full bg-cyan-400" />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600" />
                )}
              </span>

              {/* 步骤内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs leading-tight ${
                      step.completed
                        ? 'text-emerald-300'
                        : step.active
                          ? 'text-cyan-100 font-medium'
                          : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.confidence != null && (
                    <span
                      className={`ml-auto flex-shrink-0 text-[10px] tabular-nums ${
                        step.completed
                          ? 'text-emerald-400/70'
                          : step.active
                            ? 'text-cyan-300'
                            : 'text-slate-600'
                      }`}
                    >
                      {step.confidence}%
                    </span>
                  )}
                </div>
                {step.active && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />
                    <span className="text-[10px] text-cyan-400/70">执行中...</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {totalDuration > 0 && (
        <p className="mt-1 border-t border-slate-700/50 pt-2 text-[11px] text-slate-500">
          预计总耗时：{formatDuration(totalDuration)}
        </p>
      )}
    </div>
  );
}
