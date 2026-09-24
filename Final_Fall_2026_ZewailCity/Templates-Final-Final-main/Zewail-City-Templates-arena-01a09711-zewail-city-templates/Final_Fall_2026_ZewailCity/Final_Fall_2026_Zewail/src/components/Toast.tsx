export interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Toast({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className="toast-shell no-print" role="status" aria-live="polite">
      <div className="toast-card">
        <span aria-hidden>✓</span>
        <span className="min-w-0 flex-1">{toast.message}</span>
        {toast.onAction && toast.actionLabel && (
          <button type="button" className="toast-action" onClick={toast.onAction}>
            {toast.actionLabel}
          </button>
        )}
        <button type="button" className="toast-close" onClick={onClose} aria-label="Dismiss notification">×</button>
      </div>
    </div>
  );
}
