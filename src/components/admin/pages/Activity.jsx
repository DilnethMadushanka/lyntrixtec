import React, { useState } from 'react';
import { Search, Download, History } from 'lucide-react';
import { useAdmin } from '../context';
import { Panel, PageHeader, Avatar, EmptyState, Segmented } from '../ui';
import { matches, timeAgo, downloadCsv, today } from '../lib';

const KIND_DOT = { ok: 'bg-emerald-400', warn: 'bg-amber-400', danger: 'bg-rose-400', info: 'bg-[var(--accent)]' };

export default function Activity() {
  const { activity, admins } = useAdmin();
  const [q, setQ] = useState('');
  const [who, setWho] = useState('all');

  const actors = [...new Set(activity.map((a) => a.actor))];
  const rows = activity.filter((a) => (who === 'all' || a.actor === who) && matches(a, q, ['actor', 'action', 'detail']));

  // Group by calendar day
  const days = [];
  rows.forEach((a) => {
    const key = String(a.at).slice(0, 10);
    const last = days[days.length - 1];
    if (last && last.key === key) last.items.push(a);
    else days.push({ key, items: [a] });
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity"
        description={`Every change made in this console, shared between all ${admins.length} admins. Last ${activity.length} entries.`}
        actions={
          <button
            onClick={() => downloadCsv(`lyntrix-activity-${today()}.csv`, rows, [
              { label: 'Time', get: (r) => r.at },
              { label: 'Admin', get: (r) => r.actor },
              { label: 'Action', get: (r) => r.action },
              { label: 'Detail', get: (r) => r.detail },
            ])}
            disabled={!rows.length}
            className="btn btn-ghost btn-sm disabled:opacity-40"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
        }
      />

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative xl:w-80 shrink-0">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} className="field !pl-10 !rounded-full" />
        </div>
        {actors.length > 1 && (
          <Segmented label="Admin" value={who} onChange={setWho} options={[{ id: 'all', label: 'Everyone' }, ...actors.map((a) => ({ id: a, label: a.split(' ')[0] }))]} />
        )}
      </div>

      {days.length === 0 ? (
        <Panel><EmptyState icon={History} title="Nothing logged yet">Approvals, edits and deletions will be recorded here.</EmptyState></Panel>
      ) : (
        days.map(({ key, items }) => (
          <section key={key}>
            <h2 className="label mb-2.5">{new Date(`${key}T00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
            <Panel className="divide-y divide-[var(--line)] overflow-hidden">
              {items.map((a) => (
                <div key={a.id} className="p-4 flex items-start gap-3">
                  <span className="relative">
                    <Avatar name={a.actor} size="sm" tone="plain" />
                    <span className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--surface)] ${KIND_DOT[a.kind] || KIND_DOT.info}`} />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="text-white">{a.actor}</span> <span className="text-[var(--text-2)]">{a.action}</span>
                    {a.detail && <div className="text-xs text-[var(--muted)] mt-0.5 break-words">{a.detail}</div>}
                  </div>
                  <time className="text-xs text-[var(--muted)] shrink-0" dateTime={a.at} title={new Date(a.at).toLocaleString()}>{timeAgo(a.at)}</time>
                </div>
              ))}
            </Panel>
          </section>
        ))
      )}
    </div>
  );
}
