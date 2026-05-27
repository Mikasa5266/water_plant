import type { AgentId, AgentUIStatus } from '../../types/index';

export interface TaskbarWindowItem {
  agentId: AgentId;
  title: string;
  status: AgentUIStatus;
  isActive: boolean;
  isMinimized: boolean;
}

export interface TaskbarProps {
  windows: TaskbarWindowItem[];
  notificationCount: number;
  currentTime: string;
  onHome: () => void;
  onSelectWindow: (agentId: AgentId) => void;
  onOpenNotifications?: () => void;
  className?: string;
}

export function Taskbar({
  windows,
  notificationCount,
  currentTime,
  onHome,
  onSelectWindow,
  onOpenNotifications,
  className = '',
}: TaskbarProps) {
  return (
    <footer className={`flex items-center gap-3 border-t border-slate-800 bg-slate-950/90 px-3 py-2 ${className}`}>
      <button
        type="button"
        onClick={onHome}
        className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 hover:border-cyan-400"
      >
        Home
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {windows.map((windowItem) => (
          <button
            key={windowItem.agentId}
            type="button"
            onClick={() => onSelectWindow(windowItem.agentId)}
            className={`min-w-28 rounded border px-3 py-1.5 text-left text-xs ${
              windowItem.isActive
                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100'
                : 'border-slate-700 bg-slate-900 text-slate-300'
            }`}
          >
            <span className="block truncate">{windowItem.title}</span>
            <span className="block text-[10px] capitalize text-slate-500">
              {windowItem.isMinimized ? 'minimized' : windowItem.status}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenNotifications}
        className="relative rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100"
        aria-label="Open notifications"
      >
        Alerts
        {notificationCount > 0 ? (
          <span className="ml-2 rounded-full bg-rose-500 px-1.5 text-xs text-white">{notificationCount}</span>
        ) : null}
      </button>

      <time className="min-w-20 text-right text-xs font-mono text-slate-300">{currentTime}</time>
    </footer>
  );
}
