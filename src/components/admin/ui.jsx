import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { initials } from './lib';

/* Shared primitives for the admin console. Styling comes from the global design system in index.css. */

const TONES = {
  ok: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
  warn: 'text-amber-300 bg-amber-400/10 border-amber-400/25',
  danger: 'text-rose-300 bg-rose-400/10 border-rose-400/25',
  info: 'text-[var(--accent-strong)] bg-[var(--accent-soft)] border-[var(--accent)]/25',
  violet: 'text-fuchsia-200 bg-fuchsia-400/10 border-fuchsia-400/25',
  neutral: 'text-[var(--text-2)] bg-white/[0.04] border-[var(--line)]',
};

const DOT = { ok: 'bg-emerald-400', warn: 'bg-amber-400', danger: 'bg-rose-400', info: 'bg-[var(--accent)]', violet: 'bg-fuchsia-300', neutral: 'bg-[var(--muted)]' };

export function Badge({ tone = 'neutral', dot = false, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium leading-5 whitespace-nowrap ${TONES[tone]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT[tone]}`} />}
      {children}
    </span>
  );
}

export function IconButton({ title, onClick, tone = 'neutral', children, type = 'button', disabled }) {
  const hover = {
    neutral: 'hover:text-white',
    info: 'hover:text-[var(--accent)]',
    warn: 'hover:text-amber-300',
    ok: 'hover:text-emerald-300',
    danger: 'hover:text-rose-300 hover:border-rose-400/30',
  }[tone];
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`w-9 h-9 grid place-items-center rounded-full border border-[var(--line)] bg-white/[0.03] text-[var(--muted)] transition-colors hover:bg-white/[0.07] disabled:opacity-40 disabled:pointer-events-none ${hover}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = '', as: Tag = 'div' }) {
  return <Tag className={`surface ${className}`}>{children}</Tag>;
}

export function PanelHeader({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 sm:pt-6">
      <div className="min-w-0">
        <h3 className="text-base font-medium tracking-[-0.02em] text-white">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="label mb-2">{eyebrow}</div>}
        <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-medium tracking-[-0.04em] leading-tight text-white">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-[var(--muted)] max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'info', onClick }) {
  const color = { info: 'text-[var(--accent)]', ok: 'text-emerald-300', warn: 'text-amber-300', danger: 'text-rose-300', violet: 'text-fuchsia-200' }[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`surface edge-light p-4 sm:p-5 text-left w-full ${onClick ? 'surface-interactive' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="label truncate">{label}</span>
        {Icon && (
          <span className="hidden sm:grid w-8 h-8 rounded-full border border-[var(--line)] place-items-center shrink-0">
            <Icon className={`w-4 h-4 ${color}`} />
          </span>
        )}
      </div>
      <div className="stat mt-3 !text-[clamp(1.6rem,3vw,2.1rem)] tabular-nums truncate">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-[var(--muted)] truncate">{hint}</div>}
    </Tag>
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

export function PasswordInput({ value, onChange, placeholder, required = true, minLength = 6 }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
        className="field !pr-11 font-mono"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center text-[var(--muted)] hover:text-white"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="py-14 px-6 text-center">
      {Icon && (
        <span className="w-12 h-12 mx-auto mb-4 rounded-full border border-[var(--line-strong)] grid place-items-center text-[var(--muted)]">
          <Icon className="w-5 h-5" />
        </span>
      )}
      {title && <div className="text-white font-medium">{title}</div>}
      <div className="mt-1 text-sm text-[var(--muted)]">{children}</div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, size = 'md', tone = 'grad' }) {
  const dims = { sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-14 h-14 text-lg' }[size];
  const bg = tone === 'grad' ? 'bg-[image:var(--grad)] text-[var(--accent-ink)]' : 'bg-white/[0.06] text-[var(--text-2)] border border-[var(--line)]';
  return <span className={`${dims} ${bg} rounded-full grid place-items-center font-semibold shrink-0`}>{initials(name)}</span>;
}

/** Pill segmented control. options: [{ id, label, count? }] */
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full overflow-x-auto no-scrollbar gap-1 p-1 rounded-full border border-[var(--line)] bg-white/[0.02]">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`shrink-0 h-8 px-3.5 rounded-full text-sm transition-colors inline-flex items-center gap-1.5 ${
              active ? 'bg-[var(--text)] text-[var(--accent-ink)] font-medium' : 'text-[var(--text-2)] hover:text-white'
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`text-xs tabular-nums ${active ? 'opacity-60' : 'text-[var(--muted)]'}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function useOverlay(onClose) {
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
}

/** Bottom sheet on phones, centered dialog from `sm` up. Closes on Escape / backdrop, locks page scroll. */
export function Modal({ title, eyebrow, onClose, children, footer, size = 'md' }) {
  useOverlay(onClose);
  const width = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`fade-up w-full ${width} max-h-[92dvh] flex flex-col bg-[var(--surface)] border border-[var(--line-strong)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] shadow-2xl shadow-black/60`}>
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[var(--line)]">
          <div className="min-w-0">
            {eyebrow && <div className="label break-all">{eyebrow}</div>}
            <h3 className="text-xl font-medium tracking-[-0.03em] text-white mt-1 leading-snug">{title}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-2 -mt-1 grid place-items-center rounded-full text-[var(--muted)] hover:text-white hover:bg-white/5 shrink-0">
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

/** Right-hand detail panel (full screen on phones). */
export function Drawer({ title, eyebrow, onClose, children, footer, headerExtra }) {
  useOverlay(onClose);
  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-in w-full sm:max-w-xl h-full flex flex-col bg-[var(--surface)] border-l border-[var(--line-strong)] shadow-2xl shadow-black/70">
        <div className="p-5 sm:p-6 border-b border-[var(--line)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && <div className="label break-all">{eyebrow}</div>}
              <h3 className="text-xl font-medium tracking-[-0.03em] text-white mt-1 leading-snug break-words">{title}</h3>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-2 -mt-1 grid place-items-center rounded-full text-[var(--muted)] hover:text-white hover:bg-white/5 shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
          {headerExtra && <div className="mt-4">{headerExtra}</div>}
        </div>
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="p-4 sm:p-5 border-t border-[var(--line)] flex flex-wrap justify-end gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Label / value rows for read-only details. */
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

/* ---------------------------------------------------------------- Toasts & confirm */

const TOAST_ICON = { ok: CheckCircle2, danger: AlertTriangle, info: Info };
const TOAST_COLOR = { ok: 'text-emerald-400 border-emerald-400/30', danger: 'text-rose-400 border-rose-400/30', info: 'text-[var(--accent)] border-[var(--accent)]/30' };

export function Toasts({ items, onDismiss }) {
  return (
    <div className="fixed z-[90] top-16 inset-x-4 lg:top-auto lg:bottom-6 lg:left-auto lg:right-6 lg:w-[24rem] space-y-2 pointer-events-none" role="status" aria-live="polite">
      {items.map((t) => {
        const Icon = TOAST_ICON[t.tone] || Info;
        return (
          <div key={t.id} className={`pointer-events-auto fade-up p-3.5 rounded-2xl bg-[var(--surface-2)]/95 backdrop-blur border shadow-2xl shadow-black/50 flex items-start gap-3 text-sm text-[var(--text)] ${TOAST_COLOR[t.tone] || TOAST_COLOR.info}`}>
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="flex-1 min-w-0 text-[var(--text)]">{t.text}</span>
            <button onClick={() => onDismiss(t.id)} aria-label="Dismiss" className="text-[var(--muted)] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

export function ConfirmDialog({ title, body, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <Modal
      size="sm"
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`btn ${danger ? 'bg-rose-500 text-white hover:bg-rose-400 border-rose-400' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-[var(--text-2)] leading-relaxed">{body}</p>
    </Modal>
  );
}

/* ---------------------------------------------------------------- Charts
   Single-series, so no legend box: the panel title names the series. Bars are #8486f6
   (validated: in lightness band, >= 3:1 on the card surface). Values stay in text colours. */

const BAR = '#8486f6';

/** Vertical columns with a hover / focus tooltip. data: [{ key, label, value, detail }] */
export function ColumnChart({ data, format = (v) => v, height = 160, caption }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = [max, max / 2, 0];
  return (
    <figure className="w-full">
      <div className="relative" style={{ height }}>
        {ticks.map((t, i) => (
          <div key={i} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${(i / (ticks.length - 1)) * 100}%`, transform: 'translateY(-50%)' }}>
            <span className="w-8 text-right text-[10px] text-[var(--muted)] tabular-nums">{format(Math.round(t))}</span>
            <span className={`flex-1 h-px ${i === ticks.length - 1 ? 'bg-[var(--line-strong)]' : 'bg-[var(--line)]'}`} />
          </div>
        ))}
        <div className="absolute inset-y-0 left-10 right-0 flex items-end gap-[2px]">
          {data.map((d, i) => (
            <button
              key={d.key}
              type="button"
              className="relative flex-1 h-full flex items-end focus:outline-none group"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${d.label}: ${format(d.value)}`}
            >
              <span
                className="w-full rounded-t-[4px] transition-[opacity,height] duration-500"
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 3 : 0, background: BAR, opacity: hover === null || hover === i ? 1 : 0.45 }}
              />
              {hover === i && (
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg border border-[var(--line-strong)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs shadow-xl pointer-events-none">
                  <span className="block text-[var(--muted)]">{d.label}</span>
                  <span className="block text-white font-medium tabular-nums">{format(d.value)}{d.detail ? ` · ${d.detail}` : ''}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="ml-10 mt-2 flex justify-between text-[10px] text-[var(--muted)]">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>{data.map((d) => <tr key={d.key}><th>{d.label}</th><td>{format(d.value)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Horizontal bars with labels and values in text colours. data: [{ key, label, value, detail }] */
export function BarList({ data, format = (v) => v, onSelect }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.key}>
          <button
            type="button"
            onClick={onSelect ? () => onSelect(d.key) : undefined}
            className={`w-full grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm group ${onSelect ? 'cursor-pointer' : 'cursor-default'}`}
            title={d.detail ? `${d.label}: ${format(d.value)} · ${d.detail}` : `${d.label}: ${format(d.value)}`}
          >
            <span className="text-left text-[var(--text-2)] truncate group-hover:text-white">{d.label}</span>
            <span className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
              <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${(d.value / max) * 100}%`, background: BAR }} />
            </span>
            <span className="text-right text-white tabular-nums min-w-[2.5rem]">{format(d.value)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
