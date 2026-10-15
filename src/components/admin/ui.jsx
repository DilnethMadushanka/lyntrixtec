import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, X } from 'lucide-react';

/* Shared primitives for the admin console. Styling comes from the global design system in index.css. */

const TONES = {
  ok: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
  warn: 'text-amber-300 bg-amber-400/10 border-amber-400/25',
  danger: 'text-rose-300 bg-rose-400/10 border-rose-400/25',
  info: 'text-[var(--accent-strong)] bg-[var(--accent-soft)] border-[var(--accent)]/25',
  violet: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/25',
  neutral: 'text-[var(--text-2)] bg-white/[0.04] border-[var(--line)]',
};

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium leading-5 whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function IconButton({ title, onClick, tone = 'neutral', children, type = 'button' }) {
  const hover = {
    neutral: 'hover:text-white',
    info: 'hover:text-[var(--accent)]',
    warn: 'hover:text-amber-300',
    ok: 'hover:text-emerald-300',
    danger: 'hover:text-rose-300',
  }[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-9 h-9 grid place-items-center rounded-lg border border-[var(--line)] bg-white/[0.03] text-[var(--muted)] transition-colors hover:bg-white/[0.07] ${hover}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = '' }) {
  return <div className={`surface ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="h3">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-[var(--muted)] max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'info' }) {
  const color = { info: 'text-[var(--accent)]', ok: 'text-emerald-300', warn: 'text-amber-300', violet: 'text-indigo-300' }[tone];
  return (
    <div className="surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>
      <div className={`stat mt-3 !text-[clamp(1.5rem,3vw,2rem)] ${tone === 'ok' || tone === 'warn' ? color : ''}`}>{value}</div>
      {hint && <div className="mt-2 text-xs text-[var(--muted)] truncate">{hint}</div>}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[var(--text-2)]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

export function PasswordInput({ value, onChange, show, onToggle, placeholder, required = true }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="field pr-11 font-mono"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center text-[var(--muted)] hover:text-white"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="py-14 px-6 text-center text-sm text-[var(--muted)]">{children}</div>;
}

/** Bottom sheet on phones, centered dialog from `sm` up. Closes on Escape / backdrop, locks page scroll. */
export function Modal({ title, eyebrow, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`fade-up w-full ${width} max-h-[92dvh] flex flex-col bg-[var(--surface)] border border-[var(--line-strong)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-2xl shadow-black/60`}
      >
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[var(--line)]">
          <div className="min-w-0">
            {eyebrow && <div className="label break-all">{eyebrow}</div>}
            <h3 className="font-sans text-xl font-semibold text-white mt-1 leading-snug">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 -mr-2 -mt-1 grid place-items-center rounded-xl text-[var(--muted)] hover:text-white hover:bg-white/5 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">{children}</div>
        {footer && (
          <div className="p-5 sm:p-6 pt-4 border-t border-[var(--line)] flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Label / value rows for read-only detail modals. */
export function DetailList({ rows }) {
  return (
    <dl className="divide-y divide-[var(--line)] text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 py-3">
          <dt className="text-[var(--muted)] shrink-0">{k}</dt>
          <dd className="text-right text-[var(--text)] break-words min-w-0">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
