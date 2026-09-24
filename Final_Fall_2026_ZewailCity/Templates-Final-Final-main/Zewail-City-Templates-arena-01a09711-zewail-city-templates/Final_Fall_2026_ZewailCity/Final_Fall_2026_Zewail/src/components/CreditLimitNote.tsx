import type { CreditCap } from '../lib/appState';

/**
 * Dismissible credit-limit note — an informational banner, never a data-collection step.
 * It explains the normal GPA-based caps plus the explicit Over Load option.
 * The app stores only the selected cap (13/18/21), never the student's GPA.
 * Dismissing without choosing leaves the planner's general 21-credit ceiling active.
 */
export function CreditLimitNote({
  onChoose,
  onDismiss,
}: {
  onChoose: (cap: CreditCap) => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="panel-soft fade-up flex flex-wrap items-start gap-3 px-3.5 py-3"
      role="status"
      aria-live="polite"
      style={{ borderColor: 'color-mix(in srgb, var(--accent) 45%, var(--line))' }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--accent)' }}>
          Credit limits
        </p>
        <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Credit limits: below 2.00 GPA → up to 13 credits · GPA 2.00 or higher → up to 18 credits ·
          Over Load → up to 21 credits. Pick the limit that applies to you — nothing is stored except the cap itself,
          on this device only.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-tap px-2.5 py-1.5 text-[11px]" onClick={() => onChoose(13)}>
            Below 2.00 · 13 cr
          </button>
          <button type="button" className="btn btn-tap px-2.5 py-1.5 text-[11px]" onClick={() => onChoose(18)}>
            GPA 2.00+ · 18 cr
          </button>
          <button type="button" className="btn btn-tap px-2.5 py-1.5 text-[11px]" onClick={() => onChoose(21)}>
            Over Load · 21 cr
          </button>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-tap flex-none px-2.5 py-1.5 text-[11px]"
        onClick={onDismiss}
        aria-label="Dismiss credit limit note"
        title="Dismiss — the planner's 21-credit ceiling stays active"
      >
        ✕
      </button>
    </div>
  );
}
