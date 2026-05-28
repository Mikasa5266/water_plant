import { X } from 'lucide-react';
import type { AgentId, NotificationItem } from '../../types/index';

export interface NotificationProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onOpenAgent: (agentId: AgentId) => void;
  className?: string;
}

const levelClassName: Record<NotificationItem['level'], string> = {
  info: 'border-cyan-400/60',
  warning: 'border-amber-400/70',
  error: 'border-rose-400/70',
  success: 'border-emerald-400/70',
};

export function Notification({ notifications, onDismiss, onOpenAgent, className = '' }: NotificationProps) {
  return (
    <div className={`pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2 ${className}`}>
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`pointer-events-auto cursor-pointer rounded-lg border-l-4 bg-slate-950/95 p-3 text-slate-100 shadow-xl transition-transform hover:-translate-y-0.5 ${levelClassName[notification.level]}`}
          onClick={() => {
            onOpenAgent(notification.agentId);
            onDismiss(notification.id);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpenAgent(notification.agentId);
              onDismiss(notification.id);
            }
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold">{notification.title}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-300">{notification.description}</p>
              <p className="mt-1 text-[10px] text-slate-500">{notification.time}</p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDismiss(notification.id);
              }}
              className="h-7 w-7 shrink-0 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              aria-label={`Dismiss ${notification.title}`}
            >
              <X className="mx-auto h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs font-medium text-cyan-200">查看详情</p>
        </article>
      ))}
    </div>
  );
}
