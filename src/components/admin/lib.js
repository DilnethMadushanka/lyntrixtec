/* Shared helpers for the admin console: lead stages, formatting, CSV / JSON download. */

// Pipeline order. "Pending Approval" is what the public contact form writes on submit.
export const STAGES = [
  { id: 'Pending Approval', tone: 'info', short: 'Pending' },
  { id: 'New', tone: 'info', short: 'New' },
  { id: 'In Review', tone: 'warn', short: 'Review' },
  { id: 'Accepted', tone: 'violet', short: 'Accepted' },
  { id: 'Proposal Sent', tone: 'violet', short: 'Proposal' },
  { id: 'Closed Won', tone: 'ok', short: 'Won' },
  { id: 'Closed Lost', tone: 'danger', short: 'Lost' },
];

export const stageTone = (status) => STAGES.find((s) => s.id === status)?.tone || 'neutral';
export const isOpenStage = (status) => status !== 'Closed Won' && status !== 'Closed Lost';

export const CLIENT_ROLES = ['Client', 'Enterprise Client', 'VIP Client'];
export const ADMIN_ROLES = ['Master Admin', 'Lead Architect & Admin', 'Security Officer'];

/** "$5,000 - $15,000" -> 10000 (midpoint); "Free Consultation" -> 0 */
export function budgetValue(budget) {
  const nums = String(budget || '')
    .replace(/,/g, '')
    .match(/\d+(\.\d+)?/g);
  if (!nums) return 0;
  const vals = nums.map(Number);
  return vals.length > 1 ? (vals[0] + vals[1]) / 2 : vals[0];
}

export const money = (n) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 10000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n).toLocaleString()}`;

/** Inquiry dates are stored as "YYYY-MM-DD HH:mm" strings. */
export function parseDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function timeAgo(value) {
  const d = value instanceof Date ? value : parseDate(value) || new Date(value);
  if (!d || Number.isNaN(d.getTime())) return '';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const initials = (name = '') =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

export function matches(item, q, keys) {
  if (!q) return true;
  const needle = q.toLowerCase().trim();
  return keys.some((k) => String(item?.[k] ?? '').toLowerCase().includes(needle));
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(filename, rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(','), ...rows.map((r) => columns.map((c) => esc(c.get(r))).join(','))];
  download(filename, `﻿${lines.join('\n')}`, 'text/csv;charset=utf-8');
}

export const downloadJson = (filename, data) => download(filename, JSON.stringify(data, null, 2), 'application/json');

export const today = () => new Date().toISOString().slice(0, 10);
