import { useEffect, useRef } from 'react';
import type { AgentId, AgentUIStatus, DecisionStep, EventLogEntry, ThinkingContent } from '../../types/index';
import { DecisionChain } from './DecisionChain';

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
  const thinkingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [thinking]);

  return (
    <aside className={`flex flex-col gap-[var(--spacing-gap)] border-l border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-[var(--spacing-panel)] text-slate-100 ${className}`}>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current Agent</h2>
        {currentAgent ? (
          <div className="mt-2 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-slate-900/60 p-[var(--spacing-card)]">
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
          <div ref={thinkingRef} className="mt-2 max-h-48 overflow-y-auto space-y-2 rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-slate-900/60 p-[var(--spacing-card)]">
            <p className="text-sm font-semibold">{thinking.title}</p>
            <p className="text-xs leading-5 text-slate-300 whitespace-pre-wrap">{thinking.summary}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Idle</p>
        )}
      </section>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Decision Chain</h2>
        <DecisionChain steps={decisionSteps} />
      </section>

      <section className="min-h-0 flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Event Log</h2>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
          {events.map((event) => (
            <article key={event.id} className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-slate-900/50 p-2 text-xs">
              <p className="text-slate-500">{event.time}</p>
              <p className="mt-1 text-slate-200">{event.text}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
