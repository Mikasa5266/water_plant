import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { AgentId, NotificationItem } from '../../types/index';

export interface NotificationProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onOpenAgent: (agentId: AgentId) => void;
  className?: string;
}

const levelClassName: Record<NotificationItem['level'], string> = {
  info: 'border-cyan-400/60',
  warning: 'border-[var(--color-status-pending)]/70',
  error: 'border-[var(--color-status-alarm)]/70',
  success: 'border-[var(--color-status-normal)]/70',
};

export function Notification({ notifications, onDismiss, onOpenAgent, className = '' }: NotificationProps) {
  return (
    <div className={`pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2 ${className}`}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.article
            key={notification.id}
            initial={{ x: 100, opacity: 0, filter: 'blur(4px)' }}
            animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ x: 80, opacity: 0, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`pointer-events-auto group cursor-pointer rounded-[var(--radius-panel)] border-l-4 bg-[var(--color-surface-base)] p-[var(--spacing-card)] text-slate-100 shadow-[var(--shadow-notification)] transition-transform hover:-translate-y-0.5 ${levelClassName[notification.level]}`}
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
            <p className="mt-3 text-xs font-medium text-cyan-200 transition-colors group-hover:text-cyan-100">查看详情 →</p>
          </motion.article>
        ))}
      </AnimatePresence>
    </div>
  );
}
