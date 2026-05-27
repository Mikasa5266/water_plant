import type { AgentId, AgentUIStatus, DecisionStep, EventLogEntry, ThinkingContent } from '../../types/index';

export interface InfoPanelAgent {
  id: AgentId;
  name: string;
  status: AgentUIStatus;
}

export interface InfoPanelProps {
  currentAgent: InfoPanelAgent | null;
  thinking: ThinkingContent | null;
  decisionSteps: DecisionStep[];
  events: EventLogEntry[];
  className?: string;
}

export function InfoPanel({ currentAgent, thinking, decisionSteps, events, className = '' }: InfoPanelProps) {
  return (
    <aside className={`flex flex-col gap-4 border-l border-slate-800 bg-slate-950/80 p-4 text-slate-100 ${className}`}>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Agent</h2>
        {currentAgent ? (
          <div className="mt-2 rounded border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-sm font-semibold">{currentAgent.name}</p>
            <p className="mt-1 text-xs capitalize text-slate-400">{currentAgent.status}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No active agent</p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thinking</h2>
        {thinking ? (
          <div className="mt-2 space-y-2 rounded border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-sm font-semibold">{thinking.title}</p>
            <p className="text-xs leading-5 text-slate-300">{thinking.summary}</p>
            <ul className="space-y-1 text-xs text-slate-400">
              {thinking.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Idle</p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Decision Chain</h2>
        <ol className="mt-2 space-y-2">
          {decisionSteps.map((step) => (
            <li key={step.index} className="flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  step.completed ? 'bg-emerald-400' : step.active ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />
              <span className={step.active ? 'text-cyan-100' : 'text-slate-400'}>{step.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="min-h-0 flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Event Log</h2>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
          {events.map((event) => (
            <article key={event.id} className="rounded border border-slate-800 bg-slate-900/50 p-2 text-xs">
              <p className="text-slate-500">{event.time}</p>
              <p className="mt-1 text-slate-200">{event.text}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
