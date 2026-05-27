import type { AgentId, AgentUIStatus } from '../../types/index';

export interface DockAgentItem {
  id: AgentId;
  label: string;
  status: AgentUIStatus;
  badgeCount?: number;
  isActive?: boolean;
}

export interface DockProps {
  agents: DockAgentItem[];
  onOpenAgent: (agentId: AgentId) => void;
  className?: string;
}

const statusClassName: Record<AgentUIStatus, string> = {
  normal: 'bg-emerald-400',
  pending: 'bg-amber-400',
  alarm: 'bg-rose-400',
  recovering: 'bg-teal-400',
};

export function Dock({ agents, onOpenAgent, className = '' }: DockProps) {
  return (
    <nav className={`flex flex-col items-center gap-3 ${className}`} aria-label="Agent dock">
      {agents.map((agent) => (
        <button
          key={agent.id}
          type="button"
          onClick={() => onOpenAgent(agent.id)}
          className={`relative flex h-12 w-12 items-center justify-center rounded-lg border text-xs font-semibold transition-colors ${
            agent.isActive
              ? 'border-cyan-300 bg-cyan-400/15 text-cyan-100'
              : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'
          }`}
          aria-label={`Open ${agent.label}`}
          title={agent.label}
        >
          <span>{agent.label.slice(0, 2).toUpperCase()}</span>
          <span
            className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border border-slate-950 ${statusClassName[agent.status]}`}
            aria-hidden="true"
          />
          {agent.badgeCount ? (
            <span className="absolute -bottom-1 -right-1 min-w-5 rounded-full bg-rose-500 px-1 text-[10px] leading-5 text-white">
              {agent.badgeCount}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
