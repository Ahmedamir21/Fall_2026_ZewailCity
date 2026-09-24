import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function ScheduleAssistant({ context }: { context: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 100);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || sending) return;

    const previous = messages.slice(-6);
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: previous, context }),
      });

      const raw = await response.text();
      let data: { text?: string; error?: string } = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          response.status === 404
            ? 'The AI endpoint is not available on this deployment yet. Redeploy the latest branch and try again.'
            : 'The assistant service returned an unexpected response.',
        );
      }

      if (!response.ok) {
        throw new Error(data.error || 'The assistant could not answer right now.');
      }

      if (!data.text) {
        throw new Error('The assistant returned an empty response.');
      }

      setMessages((m) => [...m, { role: 'assistant', text: data.text! }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The assistant could not answer right now.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`assistant-fab no-print ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Schedule Assistant' : 'Open Schedule Assistant'}
        aria-expanded={open}
      >
        <span className="assistant-fab-icon" aria-hidden>✦</span>
        <span className="assistant-fab-label">Ask Assistant</span>
      </button>

      {open && (
        <div className="assistant-layer no-print" role="presentation" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <section className="assistant-panel" role="dialog" aria-modal="true" aria-label="Schedule Assistant">
            <header className="assistant-header">
              <div>
                <div className="flex items-center gap-2">
                  <span className="assistant-mark" aria-hidden>✦</span>
                  <h2 className="text-[14px] font-extrabold tracking-tight">Schedule Assistant</h2>
                  <span className="pill">Beta</span>
                </div>
                <p className="mt-0.5 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                  Arabic · English · Franco — grounded in your current planner
                </p>
              </div>
              <button type="button" className="btn btn-tap px-3" onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
            </header>

            <div ref={listRef} className="assistant-messages">
              {messages.length === 0 && (
                <div className="assistant-empty">
                  <span className="assistant-empty-icon" aria-hidden>✦</span>
                  <p className="font-bold">Ask naturally.</p>
                  <p className="mt-1 text-[11.5px]" style={{ color: 'var(--muted)' }}>
                    Ask about your courses, sections, conflicts, timetable or preferences in your own words.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`assistant-message ${message.role}`}>
                  <p>{message.text}</p>
                </div>
              ))}

              {sending && (
                <div className="assistant-message assistant">
                  <span className="assistant-typing" aria-label="Assistant is thinking"><i /><i /><i /></span>
                </div>
              )}

              {error && (
                <div className="assistant-error" role="alert">
                  {error}
                </div>
              )}
            </div>

            <form className="assistant-compose" onSubmit={submit}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 900))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder="Ask anything about your schedule..."
                aria-label="Message Schedule Assistant"
                disabled={sending}
              />
              <button type="submit" className="assistant-send" disabled={!input.trim() || sending} aria-label="Send message">
                ↑
              </button>
            </form>
            <p className="assistant-disclaimer">Schedule data is manually verified, not live. Confirm final registration details on Self-Service.</p>
          </section>
        </div>
      )}
    </>
  );
}
