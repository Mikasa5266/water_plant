export interface HelpShortcutItem {
  keys: string;
  description: string;
}

export interface HelpOverlayProps {
  isOpen: boolean;
  shortcuts: HelpShortcutItem[];
  onClose: () => void;
  className?: string;
}

export function HelpOverlay({ isOpen, shortcuts, onClose, className = '' }: HelpOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 text-slate-100 ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard help"
    >
      <section className="w-full max-w-lg rounded-[var(--radius-panel)] border border-[var(--color-border-default)] bg-slate-950 p-[var(--spacing-panel)] shadow-[var(--shadow-panel)]">
        <header className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Keyboard Help</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded text-slate-300 hover:bg-slate-800"
            aria-label="Close keyboard help"
          >
            x
          </button>
        </header>

        <dl className="mt-4 grid gap-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.keys} className="grid grid-cols-[120px_1fr] gap-3 rounded-[var(--radius-card)] bg-[var(--color-surface-elevated)] p-2 text-sm">
              <dt className="font-mono text-cyan-200">{shortcut.keys}</dt>
              <dd className="text-slate-300">{shortcut.description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
