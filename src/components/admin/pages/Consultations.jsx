import React, { useMemo, useState } from 'react';
import { CalendarClock, CalendarPlus, ExternalLink, Video } from 'lucide-react';
import { useAdmin } from '../context';
import { Panel, PageHeader, Badge, Segmented, EmptyState } from '../ui';
import { today } from '../lib';

/** "09:00 AM - 09:30 AM (IST)" + "2026-11-02" -> Google Calendar template link (Colombo time). */
function calendarLink(lead) {
  const m = String(lead.consultationTime || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m || !lead.consultationDate) return null;
  const to24 = (h, min, ap) => {
    let hh = Number(h) % 12;
    if (ap.toUpperCase() === 'PM') hh += 12;
    return `${String(hh).padStart(2, '0')}${min}00`;
  };
  const day = lead.consultationDate.replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Lyntrix consultation · ${lead.name}`,
    dates: `${day}T${to24(m[1], m[2], m[3])}/${day}T${to24(m[4], m[5], m[6])}`,
    ctz: 'Asia/Colombo',
    details: `${lead.service}\n${lead.email}${lead.phone && lead.phone !== 'N/A' ? ` · ${lead.phone}` : ''}\n${lead.meetingLink || ''}`,
    add: lead.email,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export default function Consultations() {
  const { inquiries, navigate } = useAdmin();
  const [tab, setTab] = useState('pending');

  const groups = useMemo(() => {
    const calls = inquiries.filter((i) => i.hasConsultation);
    const now = today();
    const byDate = (a, b) => `${a.consultationDate}${a.consultationTime}`.localeCompare(`${b.consultationDate}${b.consultationTime}`);
    return {
      pending: calls.filter((i) => i.consultationStatus !== 'Approved' && (i.consultationDate || '') >= now).sort(byDate),
      upcoming: calls.filter((i) => i.consultationStatus === 'Approved' && (i.consultationDate || '') >= now).sort(byDate),
      past: calls.filter((i) => (i.consultationDate || '') < now).sort((a, b) => byDate(b, a)),
    };
  }, [inquiries]);

  const list = groups[tab];

  // group rows under a date heading
  const days = [];
  list.forEach((c) => {
    const last = days[days.length - 1];
    if (last && last.date === c.consultationDate) last.items.push(c);
    else days.push({ date: c.consultationDate, items: [c] });
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Consultations" description="Free 1-on-1 architecture calls booked from the website." />

      <Segmented
        label="Consultations"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'pending', label: 'To approve', count: groups.pending.length },
          { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { id: 'past', label: 'Past', count: groups.past.length },
        ]}
      />

      {days.length === 0 ? (
        <Panel>
          <EmptyState icon={CalendarClock} title={tab === 'pending' ? 'Nothing waiting for approval' : tab === 'upcoming' ? 'No calls booked' : 'No past calls'}>
            Consultation requests from the contact form show up here.
          </EmptyState>
        </Panel>
      ) : (
        <div className="space-y-6">
          {days.map(({ date, items }) => {
            const d = date ? new Date(`${date}T00:00`) : null;
            return (
              <section key={date || 'none'}>
                <h2 className="label mb-2.5">
                  {d ? d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                  {date === today() && <span className="ml-2 text-[var(--accent)]">· Today</span>}
                </h2>
                <Panel className="divide-y divide-[var(--line)] overflow-hidden">
                  {items.map((c) => {
                    const cal = calendarLink(c);
                    return (
                      <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
                        <div className="sm:w-28 shrink-0">
                          <div className="text-white font-medium tabular-nums">{(c.consultationTime || '—').split(' - ')[0]}</div>
                          <div className="text-xs text-[var(--muted)]">{(c.meetingPlatform || 'Call').split(' (')[0]}</div>
                        </div>
                        <button onClick={() => navigate('proposals', { open: c.id })} className="flex-1 min-w-0 text-left group">
                          <div className="text-white group-hover:text-[var(--accent-strong)] truncate">{c.name}</div>
                          <div className="text-xs text-[var(--muted)] truncate">{c.service} · {c.email}</div>
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={c.consultationStatus === 'Approved' ? 'ok' : 'warn'} dot>{c.consultationStatus === 'Approved' ? 'Approved' : 'Pending'}</Badge>
                          {c.meetingLink && c.consultationStatus === 'Approved' && (
                            <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><Video className="w-4 h-4" /> Join</a>
                          )}
                          {cal && (
                            <a href={cal} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" title="Add to Google Calendar"><CalendarPlus className="w-4 h-4" /> <span className="sm:hidden xl:inline">Calendar</span></a>
                          )}
                          <button onClick={() => navigate('proposals', { open: c.id })} className={`btn btn-sm ${c.consultationStatus === 'Approved' ? 'btn-ghost' : 'btn-primary'}`}>
                            {c.consultationStatus === 'Approved' ? <ExternalLink className="w-4 h-4" /> : null}
                            {c.consultationStatus === 'Approved' ? 'Open' : 'Review & approve'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </Panel>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
