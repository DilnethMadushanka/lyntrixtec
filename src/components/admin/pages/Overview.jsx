import React, { useMemo } from 'react';
import { Briefcase, CalendarClock, TrendingUp, Users, ArrowUpRight, AlertCircle, Inbox } from 'lucide-react';
import { useAdmin } from '../context';
import { Panel, PanelHeader, PageHeader, StatCard, ColumnChart, BarList, Badge, Avatar, EmptyState } from '../ui';
import { STAGES, stageTone, isOpenStage, budgetValue, money, parseDate, timeAgo } from '../lib';

const DAY = 86400000;

export default function Overview() {
  const { inquiries, users, activity, navigate, currentAdmin } = useAdmin();

  const stats = useMemo(() => {
    const now = Date.now();
    const open = inquiries.filter((i) => isOpenStage(i.status));
    const won = inquiries.filter((i) => i.status === 'Closed Won').length;
    const lost = inquiries.filter((i) => i.status === 'Closed Lost').length;
    const recent = inquiries.filter((i) => (parseDate(i.date)?.getTime() || 0) > now - 7 * DAY).length;
    const pendingCalls = inquiries.filter((i) => i.hasConsultation && i.consultationStatus !== 'Approved').length;
    const newClients = users.filter((u) => (parseDate(u.joinedDate)?.getTime() || 0) > now - 30 * DAY).length;

    // 12 weekly buckets ending this week
    const weeks = Array.from({ length: 12 }, (_, i) => {
      const end = now - (11 - i) * 7 * DAY;
      const start = end - 7 * DAY;
      const inWeek = inquiries.filter((q) => {
        const t = parseDate(q.date)?.getTime() || 0;
        return t > start && t <= end;
      });
      const d = new Date(end);
      return {
        key: `w${i}`,
        label: i === 11 ? 'This week' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: inWeek.length,
        detail: inWeek.length ? money(inWeek.reduce((s, q) => s + budgetValue(q.budget), 0)) : '',
      };
    });

    const byStage = STAGES.map((s) => {
      const rows = inquiries.filter((i) => (i.status || 'New') === s.id);
      return { key: s.id, label: s.id, value: rows.length, detail: money(rows.reduce((sum, r) => sum + budgetValue(r.budget), 0)) };
    }).filter((s) => s.value > 0);

    const serviceCounts = {};
    inquiries.forEach((i) => {
      const key = String(i.service || 'Other').replace(/^1-on-1 Consultation \((.*)\)$/, '$1');
      serviceCounts[key] = (serviceCounts[key] || 0) + 1;
    });
    const byService = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => ({ key: k, label: k, value: v }));

    const attention = inquiries
      .filter((i) => ['Pending Approval', 'New'].includes(i.status || 'New'))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 5);

    const upcoming = inquiries
      .filter((i) => i.hasConsultation && i.consultationDate && i.consultationDate >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => String(a.consultationDate).localeCompare(String(b.consultationDate)))
      .slice(0, 4);

    return {
      pipeline: open.reduce((s, i) => s + budgetValue(i.budget), 0),
      openCount: open.length,
      winRate: won + lost ? Math.round((won / (won + lost)) * 100) : null,
      recent,
      pendingCalls,
      newClients,
      weeks,
      byStage,
      byService,
      attention,
      upcoming,
    };
  }, [inquiries, users]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = (currentAdmin?.name || 'Admin').split(' ')[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={<>{greeting}, <span className="serif">{firstName}.</span></>}
        description="Here is what is happening across leads, consultations and clients."
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Open pipeline" value={money(stats.pipeline)} hint={`${stats.openCount} open proposals`} icon={Briefcase} onClick={() => navigate('proposals')} />
        <StatCard label="New leads · 7d" value={stats.recent} hint={`${inquiries.length} all time`} icon={Inbox} tone="violet" onClick={() => navigate('proposals')} />
        <StatCard label="Calls to approve" value={stats.pendingCalls} hint="Consultation requests" icon={CalendarClock} tone={stats.pendingCalls ? 'warn' : 'ok'} onClick={() => navigate('consultations')} />
        <StatCard label="Win rate" value={stats.winRate === null ? '—' : `${stats.winRate}%`} hint={`${users.length} clients · +${stats.newClients} in 30d`} icon={TrendingUp} tone="ok" onClick={() => navigate('clients')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <Panel className="lg:col-span-3 pb-5 sm:pb-6">
          <PanelHeader title="Leads per week" description="Proposals received, last 12 weeks. Hover a bar for the budget total." />
          <div className="px-5 sm:px-6 mt-6">
            <ColumnChart data={stats.weeks} caption="Leads per week" />
          </div>
        </Panel>

        <Panel className="lg:col-span-2 pb-5 sm:pb-6">
          <PanelHeader title="Pipeline by stage" description="Click a stage to open those proposals." />
          <div className="px-5 sm:px-6 mt-5">
            {stats.byStage.length ? (
              <BarList data={stats.byStage} onSelect={(stage) => navigate('proposals', { stage })} />
            ) : (
              <p className="text-sm text-[var(--muted)] py-8 text-center">No proposals yet.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Panel className="pb-2">
          <PanelHeader
            title="Needs attention"
            description="Oldest unanswered proposals first."
            actions={<button onClick={() => navigate('proposals', { stage: 'Pending Approval' })} className="text-xs text-[var(--accent)] hover:text-white">View all</button>}
          />
          {stats.attention.length ? (
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {stats.attention.map((i) => (
                <li key={i.id}>
                  <button onClick={() => navigate('proposals', { open: i.id })} className="w-full px-5 sm:px-6 py-3 flex items-center gap-3 text-left hover:bg-white/[0.02]">
                    <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white truncate">{i.name}</span>
                      <span className="block text-xs text-[var(--muted)] truncate">{i.service} · {timeAgo(i.date)}</span>
                    </span>
                    <Badge tone={stageTone(i.status)}>{i.status || 'New'}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Inbox zero. Every proposal has been picked up.</EmptyState>
          )}
        </Panel>

        <Panel className="pb-2">
          <PanelHeader
            title="Upcoming consultations"
            actions={<button onClick={() => navigate('consultations')} className="text-xs text-[var(--accent)] hover:text-white">Calendar</button>}
          />
          {stats.upcoming.length ? (
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {stats.upcoming.map((i) => {
                const d = new Date(`${i.consultationDate}T00:00`);
                return (
                  <li key={i.id} className="px-5 sm:px-6 py-3 flex items-center gap-3">
                    <span className="w-11 shrink-0 text-center rounded-xl border border-[var(--line)] py-1">
                      <span className="block text-[10px] uppercase text-[var(--muted)]">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="block text-base font-medium text-white leading-none pb-0.5">{d.getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-white truncate">{i.name}</span>
                      <span className="block text-xs text-[var(--muted)] truncate">{(i.consultationTime || '').split(' (')[0]} · {i.meetingPlatform || 'Call'}</span>
                    </span>
                    <Badge tone={i.consultationStatus === 'Approved' ? 'ok' : 'warn'} dot>{i.consultationStatus === 'Approved' ? 'Booked' : 'Pending'}</Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState>No calls scheduled.</EmptyState>
          )}
        </Panel>

        <Panel className="pb-5 sm:pb-6">
          <PanelHeader title="Leads by service" />
          <div className="px-5 sm:px-6 mt-5">
            {stats.byService.length ? <BarList data={stats.byService} /> : <p className="text-sm text-[var(--muted)] py-8 text-center">No data yet.</p>}
          </div>
        </Panel>
      </div>

      <Panel className="pb-2">
        <PanelHeader
          title="Recent activity"
          description="What admins changed, newest first."
          actions={<button onClick={() => navigate('activity')} className="text-xs text-[var(--accent)] hover:text-white inline-flex items-center gap-1">Full log <ArrowUpRight className="w-3 h-3" /></button>}
        />
        {activity.length ? (
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {activity.slice(0, 6).map((a) => (
              <li key={a.id} className="px-5 sm:px-6 py-3 flex items-center gap-3">
                <Avatar name={a.actor} size="sm" tone="plain" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="text-white">{a.actor}</span> <span className="text-[var(--text-2)]">{a.action}</span>
                  {a.detail && <span className="block text-xs text-[var(--muted)] truncate">{a.detail}</span>}
                </span>
                <span className="text-xs text-[var(--muted)] shrink-0">{timeAgo(a.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Users}>Changes made in this console will show up here.</EmptyState>
        )}
      </Panel>
    </div>
  );
}
