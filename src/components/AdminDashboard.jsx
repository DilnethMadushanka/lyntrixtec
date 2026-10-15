import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard, Inbox, CalendarClock, Users, Tags, ShieldCheck, History, Activity as ActivityIcon,
  Search, RefreshCcw, ArrowLeft, LogOut, MoreHorizontal, X, CornerDownLeft,
} from 'lucide-react';
import { AdminProvider, useAdmin } from './admin/context';
import { Avatar } from './admin/ui';
import { matches, stageTone, timeAgo } from './admin/lib';
import Overview from './admin/pages/Overview';
import Proposals from './admin/pages/Proposals';
import Consultations from './admin/pages/Consultations';
import Clients from './admin/pages/Clients';
import Catalog from './admin/pages/Catalog';
import Team from './admin/pages/Team';
import Activity from './admin/pages/Activity';
import System from './admin/pages/System';

const PAGES = {
  overview: { label: 'Overview', icon: LayoutDashboard, Component: Overview, group: 'Workspace' },
  proposals: { label: 'Proposals', icon: Inbox, Component: Proposals, group: 'Sales' },
  consultations: { label: 'Consultations', icon: CalendarClock, Component: Consultations, group: 'Sales', short: 'Calls' },
  clients: { label: 'Clients', icon: Users, Component: Clients, group: 'Sales' },
  catalog: { label: 'Pricing & services', icon: Tags, Component: Catalog, group: 'Business', short: 'Pricing' },
  team: { label: 'Team', icon: ShieldCheck, Component: Team, group: 'Settings' },
  activity: { label: 'Activity', icon: History, Component: Activity, group: 'Settings' },
  system: { label: 'System', icon: ActivityIcon, Component: System, group: 'Settings' },
};
const GROUPS = ['Workspace', 'Sales', 'Business', 'Settings'];
const MOBILE_TABS = ['overview', 'proposals', 'consultations', 'clients'];

/* ------------------------------------------------------------------ search palette */

function CommandPalette({ onClose, onGo }) {
  const { users, inquiries } = useAdmin();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);

  const results = useMemo(() => {
    const pages = Object.entries(PAGES)
      .filter(([, p]) => matches(p, q, ['label']))
      .map(([id, p]) => ({ key: `p-${id}`, icon: p.icon, title: p.label, sub: 'Page', go: () => onGo(id) }));
    if (!q.trim()) return pages;
    const leads = inquiries
      .filter((i) => matches(i, q, ['id', 'name', 'email', 'service']))
      .slice(0, 6)
      .map((i) => ({ key: `i-${i.id}`, icon: Inbox, title: `${i.name} · ${i.service}`, sub: `${i.id} · ${i.status || 'New'}`, tone: stageTone(i.status), go: () => onGo('proposals', { open: i.id }) }));
    const clients = users
      .filter((u) => matches(u, q, ['name', 'email', 'company', 'id']))
      .slice(0, 6)
      .map((u) => ({ key: `u-${u.id}`, icon: Users, title: u.name, sub: u.email, go: () => onGo('clients', { q: u.email }) }));
    return [...pages, ...leads, ...clients];
  }, [q, users, inquiries, onGo]);

  useEffect(() => setIndex(0), [q]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onKey = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[index]) results[index].go();
  };

  return createPortal(
    <div className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 sm:pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Search">
      <div className="fade-up w-full max-w-xl rounded-[var(--radius-lg)] border border-[var(--line-strong)] bg-[var(--surface)] shadow-2xl shadow-black/70 overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-[var(--line)]">
          <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search clients, proposals, pages…" className="flex-1 h-14 bg-transparent outline-none text-white placeholder:text-[var(--muted)]" />
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full text-[var(--muted)] hover:text-white" aria-label="Close search"><X className="w-4 h-4" /></button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <li key={r.key} role="option" aria-selected={i === index}>
                <button onMouseEnter={() => setIndex(i)} onClick={r.go} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left ${i === index ? 'bg-white/[0.06]' : ''}`}>
                  <Icon className="w-4 h-4 text-[var(--muted)] shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white truncate">{r.title}</span>
                    <span className="block text-xs text-[var(--muted)] truncate">{r.sub}</span>
                  </span>
                  {i === index && <CornerDownLeft className="w-3.5 h-3.5 text-[var(--muted)]" />}
                </button>
              </li>
            );
          })}
          {!results.length && <li className="px-3 py-8 text-center text-sm text-[var(--muted)]">No matches for “{q}”.</li>}
        </ul>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ shell */

function Shell({ page, params, go, onLogout, onReturnToSite }) {
  const { inquiries, syncing, sync, lastSync, cloudOnline, currentAdmin } = useAdmin();
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const counts = {
    proposals: inquiries.filter((i) => ['Pending Approval', 'New'].includes(i.status || 'New')).length,
    consultations: inquiries.filter((i) => i.hasConsultation && i.consultationStatus !== 'Approved' && (i.consultationDate || '') >= new Date().toISOString().slice(0, 10)).length,
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navTo = (id, p) => {
    setSearchOpen(false);
    setMoreOpen(false);
    go(id, p);
  };

  const { Component, label } = PAGES[page];

  const syncPill = (
    <button onClick={sync} disabled={syncing} className="flex items-center gap-2 h-9 px-3 rounded-full border border-[var(--line)] text-xs text-[var(--text-2)] hover:text-white hover:border-[var(--line-strong)]" title={lastSync ? `Synced ${timeAgo(lastSync)}` : 'Sync now'}>
      <span className={`w-1.5 h-1.5 rounded-full ${cloudOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      <span className="hidden sm:inline">{cloudOnline ? (syncing ? 'Syncing…' : 'Cloud synced') : 'Local only'}</span>
      <RefreshCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-[var(--line)] bg-[#0b0b0f] z-40">
        <div className="h-16 px-5 flex items-center gap-2.5 shrink-0">
          <img src="/logo-icon.svg" alt="" className="w-7 h-7" />
          <span className="font-semibold tracking-[-0.02em] text-white">Lyntrix</span>
          <span className="label !text-[10px] mt-0.5">Console</span>
        </div>

        <button onClick={() => setSearchOpen(true)} className="mx-3 mb-2 h-10 px-3 rounded-xl border border-[var(--line)] bg-white/[0.02] flex items-center gap-2.5 text-sm text-[var(--muted)] hover:border-[var(--line-strong)]">
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="text-[10px] font-mono border border-[var(--line)] rounded px-1.5 py-0.5">Ctrl K</kbd>
        </button>

        <nav className="flex-1 overflow-y-auto px-3 pb-3" aria-label="Console">
          {GROUPS.map((g) => (
            <div key={g} className="mt-4 first:mt-2">
              <div className="label !text-[10px] px-3 mb-1.5">{g}</div>
              {Object.entries(PAGES).filter(([, p]) => p.group === g).map(([id, p]) => {
                const Icon = p.icon;
                const active = page === id;
                return (
                  <button
                    key={id}
                    onClick={() => navTo(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm transition-colors ${active ? 'bg-white/[0.07] text-white' : 'text-[var(--text-2)] hover:bg-white/[0.035] hover:text-white'}`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                    <span className="flex-1 text-left">{p.label}</span>
                    {counts[id] > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[11px] font-semibold grid place-items-center tabular-nums">{counts[id]}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--line)] space-y-2">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <Avatar name={currentAdmin?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white truncate">{currentAdmin?.name || 'Admin'}</div>
              <div className="text-[11px] text-[var(--muted)] truncate">{currentAdmin?.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onReturnToSite} className="btn btn-ghost btn-sm"><ArrowLeft className="w-4 h-4" /> Site</button>
            <button onClick={onLogout} className="btn btn-ghost btn-sm"><LogOut className="w-4 h-4" /> Sign out</button>
          </div>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 lg:pl-64 bg-[var(--bg)]/85 backdrop-blur-xl border-b border-[var(--line)]">
        <div className="h-14 lg:h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
          <img src="/logo-icon.svg" alt="" className="w-7 h-7 lg:hidden" />
          <div className="min-w-0 flex-1">
            <div className="text-sm text-[var(--muted)] hidden lg:block">
              Console <span className="mx-1.5">/</span> <span className="text-white">{label}</span>
            </div>
            <div className="lg:hidden text-white font-medium truncate">{label}</div>
          </div>
          <button onClick={() => setSearchOpen(true)} className="lg:hidden w-9 h-9 grid place-items-center rounded-full border border-[var(--line)] text-[var(--text-2)]" aria-label="Search"><Search className="w-4 h-4" /></button>
          {syncPill}
        </div>
      </header>

      <main className="lg:pl-64">
        <div key={page} className="fade-up max-w-[78rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">
          <Component params={params} />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--line)] bg-[#0b0b0f]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]" aria-label="Console">
        <div className="grid grid-cols-5 h-16">
          {MOBILE_TABS.map((id) => {
            const p = PAGES[id];
            const Icon = p.icon;
            const active = page === id;
            return (
              <button key={id} onClick={() => navTo(id)} aria-current={active ? 'page' : undefined} className={`relative flex flex-col items-center justify-center gap-1 text-[11px] ${active ? 'text-white' : 'text-[var(--muted)]'}`}>
                {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[var(--accent)]" />}
                <span className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'text-[var(--accent)]' : ''}`} />
                  {counts[id] > 0 && <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] text-[9px] font-semibold grid place-items-center">{counts[id]}</span>}
                </span>
                {p.short || p.label}
              </button>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className={`flex flex-col items-center justify-center gap-1 text-[11px] ${!MOBILE_TABS.includes(page) ? 'text-white' : 'text-[var(--muted)]'}`}>
            <MoreHorizontal className={`w-5 h-5 ${!MOBILE_TABS.includes(page) ? 'text-[var(--accent)]' : ''}`} />
            More
          </button>
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end" onMouseDown={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
            <div className="fade-up w-full rounded-t-[var(--radius-lg)] border-t border-[var(--line-strong)] bg-[var(--surface)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4" />
              <div className="flex items-center gap-3 px-1 pb-4 mb-3 border-b border-[var(--line)]">
                <Avatar name={currentAdmin?.name} />
                <div className="min-w-0">
                  <div className="text-white truncate">{currentAdmin?.name || 'Admin'}</div>
                  <div className="text-xs text-[var(--muted)] truncate">{currentAdmin?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PAGES).filter(([id]) => !MOBILE_TABS.includes(id)).map(([id, p]) => {
                  const Icon = p.icon;
                  return (
                    <button key={id} onClick={() => navTo(id)} className={`flex items-center gap-3 p-4 rounded-2xl border text-sm text-left ${page === id ? 'border-[var(--accent)]/50 bg-[var(--accent-soft)] text-white' : 'border-[var(--line)] text-[var(--text-2)]'}`}>
                      <Icon className="w-5 h-5 text-[var(--accent)]" /> {p.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={onReturnToSite} className="btn btn-ghost"><ArrowLeft className="w-4 h-4" /> Website</button>
                <button onClick={onLogout} className="btn btn-ghost"><LogOut className="w-4 h-4" /> Sign out</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} onGo={navTo} />}
    </div>
  );
}

export default function AdminDashboard({ onLogout, onReturnToSite, onDataUpdated }) {
  const [route, setRoute] = useState({ page: 'overview', params: null });

  const go = useCallback((page, params = null) => {
    setRoute({ page: PAGES[page] ? page : 'overview', params: params ? { ...params, _t: Date.now() } : null });
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <AdminProvider onDataUpdated={onDataUpdated} navigate={go}>
      <Shell page={route.page} params={route.params} go={go} onLogout={onLogout} onReturnToSite={onReturnToSite} />
    </AdminProvider>
  );
}
