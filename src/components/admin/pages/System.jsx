import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCcw, Globe, Database, Mail, AlertTriangle, Download, HardDrive, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { db } from '../../../services/db';
import { cloud, isFirebaseConfigured } from '../../../services/firebase';
import { useAdmin } from '../context';
import { Panel, PanelHeader, PageHeader, Badge, Field } from '../ui';
import { downloadJson, today, timeAgo } from '../lib';

async function timed(fn) {
  const t0 = performance.now();
  try {
    const detail = await fn();
    return { state: 'up', ms: Math.round(performance.now() - t0), detail };
  } catch (e) {
    return { state: e.skip ? 'skip' : 'down', ms: Math.round(performance.now() - t0), detail: e.message };
  }
}

const CHECKS = [
  {
    id: 'web',
    name: 'Website',
    icon: Globe,
    run: async () => {
      const r = await fetch(`/?health=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return window.location.host;
    },
  },
  {
    id: 'db',
    name: 'Cloud Firestore',
    icon: Database,
    run: async () => {
      if (!isFirebaseConfigured) throw Object.assign(new Error('Firebase env keys missing; running local-only'), { skip: true });
      await cloud.list('settings');
      return import.meta.env.VITE_FIREBASE_PROJECT_ID;
    },
  },
  {
    id: 'mail',
    name: 'Email API',
    icon: Mail,
    // GET is rejected with 405 by the function itself, which proves it is deployed without sending mail
    run: async () => {
      const r = await fetch('/api/send-email', { cache: 'no-store' });
      if (r.status === 404) throw Object.assign(new Error('Not deployed here (works on Vercel only)'), { skip: true });
      if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
      return '/api/send-email';
    },
  },
];

const STATE = {
  up: { tone: 'ok', label: 'Operational', Icon: CheckCircle2 },
  down: { tone: 'danger', label: 'Down', Icon: XCircle },
  skip: { tone: 'neutral', label: 'Not available', Icon: MinusCircle },
};

export default function System() {
  const { maintenance, act, toast, inquiries, users } = useAdmin();
  const [results, setResults] = useState({});
  const [checkedAt, setCheckedAt] = useState(null);
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState(maintenance);

  useEffect(() => setDraft(maintenance), [maintenance]);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const entries = await Promise.all(CHECKS.map(async (c) => [c.id, await timed(c.run)]));
    setResults(Object.fromEntries(entries));
    setCheckedAt(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const down = Object.values(results).filter((r) => r.state === 'down').length;

  const saveMaintenance = (next) =>
    act(() => db.saveMaintenanceConfig(next), {
      success: next.enabled ? `Maintenance ${next.mode === 'full' ? 'lock' : 'banner'} is live for every visitor.` : 'Maintenance mode turned off.',
      log: { action: next.enabled ? `enabled maintenance (${next.mode})` : 'disabled maintenance mode', detail: next.enabled ? next.message : '' },
      kind: 'warn',
    });

  const backup = () => {
    downloadJson(`lyntrix-backup-${today()}.json`, db.exportBackup());
    db.logActivity('downloaded a full data backup');
    toast('Backup downloaded.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System"
        description="Live service checks, maintenance mode and backups."
        actions={
          <button onClick={runChecks} disabled={running} className="btn btn-primary btn-sm">
            <RefreshCcw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} /> {running ? 'Checking…' : 'Run checks'}
          </button>
        }
      />

      <Panel className="p-5 sm:p-6 flex items-center gap-4">
        <span className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${down ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
          {down ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </span>
        <div className="min-w-0">
          <div className="text-white font-medium">{running && !checkedAt ? 'Checking services…' : down ? `${down} service${down > 1 ? 's' : ''} not responding` : 'All available services are responding'}</div>
          <div className="text-xs text-[var(--muted)]">{checkedAt ? `Last checked ${timeAgo(checkedAt)} from this browser` : 'Measured from this browser'}</div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CHECKS.map(({ id, name, icon: Icon }) => {
          const r = results[id];
          const s = r ? STATE[r.state] : null;
          return (
            <Panel key={id} className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-full border border-[var(--line)] grid place-items-center text-[var(--accent)]"><Icon className="w-4 h-4" /></span>
                {s ? <Badge tone={s.tone} dot>{s.label}</Badge> : <Badge>Checking…</Badge>}
              </div>
              <div>
                <div className="text-white font-medium">{name}</div>
                <div className="text-xs text-[var(--muted)] truncate" title={r?.detail}>{r?.detail || '—'}</div>
              </div>
              <div className="pt-3 border-t border-[var(--line)] flex items-baseline justify-between">
                <span className="label">Response</span>
                <span className="text-white tabular-nums">{r && r.state !== 'skip' ? `${r.ms} ms` : '—'}</span>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="pb-5 sm:pb-6">
        <PanelHeader
          title={<span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-300" /> Maintenance mode</span>}
          description="Shown to every visitor (synced through the cloud database). Admins can still sign in."
          actions={
            <button
              type="button"
              role="switch"
              aria-checked={draft.enabled}
              aria-label="Maintenance mode"
              onClick={() => saveMaintenance({ ...draft, enabled: !draft.enabled })}
              className={`relative w-12 h-7 rounded-full transition-colors ${draft.enabled ? 'bg-amber-400' : 'bg-white/10'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${draft.enabled ? 'translate-x-5' : ''}`} />
            </button>
          }
        />
        <form
          className="px-5 sm:px-6 mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMaintenance(draft);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-sm text-[var(--text-2)]">Style</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'banner', title: 'Banner', text: 'Site stays usable' },
                  { id: 'full', title: 'Full lock', text: 'Visitors see only the notice' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, mode: m.id })}
                    className={`p-3 rounded-2xl border text-left transition-colors ${draft.mode === m.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-[var(--line)] hover:border-[var(--line-strong)]'}`}
                  >
                    <div className="text-sm font-medium text-white">{m.title}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">{m.text}</div>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Expected duration">
              <input value={draft.eta || ''} onChange={(e) => setDraft({ ...draft, eta: e.target.value })} placeholder="e.g. 30 minutes" className="field" />
            </Field>
          </div>
          <Field label="Message">
            <textarea rows={2} value={draft.message || ''} onChange={(e) => setDraft({ ...draft, message: e.target.value })} className="field resize-y" />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[var(--muted)]">{maintenance.updatedAt ? `Last changed ${timeAgo(maintenance.updatedAt)}` : ''}</span>
            <button type="submit" disabled={JSON.stringify(draft) === JSON.stringify(maintenance)} className="btn btn-ghost btn-sm disabled:opacity-40">Save notice</button>
          </div>
        </form>
      </Panel>

      <Panel className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-11 h-11 rounded-full border border-[var(--line)] grid place-items-center text-[var(--accent)] shrink-0"><HardDrive className="w-5 h-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-white font-medium">Data backup</div>
          <div className="text-xs text-[var(--muted)]">Download everything ({users.length} clients, {inquiries.length} proposals, prices, admins, settings) as one JSON file. Contains passwords: store it securely.</div>
        </div>
        <button onClick={backup} className="btn btn-ghost btn-sm shrink-0"><Download className="w-4 h-4" /> Download backup</button>
      </Panel>
    </div>
  );
}
