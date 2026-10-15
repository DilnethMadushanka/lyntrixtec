import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download, LayoutList, Columns3, Mail, Trash2, Check, Video, Send, Inbox, CalendarClock, Phone, MessageSquarePlus } from 'lucide-react';
import { db } from '../../../services/db';
import { emailService } from '../../../services/emailService';
import { useAdmin } from '../context';
import { Panel, PageHeader, Badge, Segmented, Drawer, DetailList, Field, EmptyState, IconButton, Avatar } from '../ui';
import { STAGES, stageTone, budgetValue, money, matches, timeAgo, downloadCsv, today } from '../lib';

const DEFAULT_MEET = 'https://meet.google.com/lyntrix-arch-session';

function gmailReply(lead) {
  const subject = `Lyntrix IT Services: Update Regarding Your Proposal [${lead.id}] - ${lead.service}`;
  const body = `Dear ${lead.name},\n\nThank you for choosing Lyntrix IT Services for your ${lead.service} project (${lead.scale || 'Enterprise'}).\n\nWe have reviewed your project requirements:\n"${lead.details}"\n\nProposal Tracking ID: ${lead.id}\nEstimated Investment: ${lead.budget}\n\nBest regards,\nLyntrix Architecture & Engineering Advisory Team\nlyntrixtec@gmail.com | Hotline & WhatsApp: +94 71 455 7857`;
  emailService.openDirectGmailComposer(lead.email, subject, body);
}

/* ------------------------------------------------------------------ detail drawer */

function ProposalDrawer({ lead, onClose }) {
  const { act, confirm } = useAdmin();
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState('');
  const [link, setLink] = useState(lead.meetingLink || DEFAULT_MEET);
  const status = lead.status || 'New';

  const changeStatus = (next) =>
    act(
      async () => {
        await db.updateInquiryStatus(lead.id, next);
        if (notify) {
          if (next === 'Accepted') await emailService.sendClientOrderAccepted(lead);
          else await emailService.sendOrderStatusUpdate(lead, next);
        }
      },
      {
        success: `${lead.id} moved to "${next}"${notify ? ' · client emailed' : ''}.`,
        log: { action: `moved ${lead.id} to ${next}`, detail: `${lead.name} · ${lead.service}` },
      }
    );

  const approveCall = (e) => {
    e.preventDefault();
    act(
      async () => {
        const updated = db.getInquiries().map((i) =>
          i.id === lead.id ? { ...i, status: 'Accepted', consultationStatus: 'Approved', meetingLink: link, updatedAt: new Date().toISOString() } : i
        );
        await db.saveInquiries(updated);
        await emailService.sendClientConsultationApproved({ ...lead, meetingLink: link }, link);
      },
      {
        success: `Consultation approved. Meeting link emailed to ${lead.email}.`,
        log: { action: `approved the consultation for ${lead.id}`, detail: `${lead.consultationDate} · ${lead.consultationTime}` },
        kind: 'ok',
      }
    );
  };

  const addNote = (e) => {
    e.preventDefault();
    const text = note.trim();
    if (!text) return;
    act(() => db.addInquiryNote(lead.id, text), { log: { action: `added a note to ${lead.id}`, detail: text.slice(0, 80) } });
    setNote('');
  };

  const remove = async () => {
    const ok = await confirm({ title: `Delete ${lead.id}?`, body: `${lead.name}'s proposal will be permanently removed for every admin.`, confirmLabel: 'Delete proposal', danger: true });
    if (!ok) return;
    await act(() => db.deleteInquiry(lead.id), { success: `${lead.id} deleted.`, log: { action: `deleted proposal ${lead.id}`, detail: lead.name }, kind: 'danger' });
    onClose();
  };

  const timeline = [
    { label: 'Submitted', at: lead.date },
    ...(lead.statusHistory || []).map((h) => ({ label: h.status, at: h.at })),
  ];

  return (
    <Drawer
      eyebrow={`${lead.id} · ${timeAgo(lead.date)}`}
      title={lead.name}
      onClose={onClose}
      headerExtra={
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => s.id !== status && changeStatus(s.id)}
                className={`h-8 px-3 rounded-full text-xs border transition-colors ${
                  s.id === status ? 'bg-[var(--text)] text-[var(--accent-ink)] border-[var(--text)] font-medium' : 'border-[var(--line)] text-[var(--text-2)] hover:text-white hover:border-[var(--line-strong)]'
                }`}
              >
                {s.short}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer select-none w-fit">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
            Email the client when the stage changes
          </label>
        </div>
      }
      footer={
        <>
          <button onClick={remove} className="btn btn-ghost btn-sm mr-auto hover:!text-rose-300"><Trash2 className="w-4 h-4" /> Delete</button>
          <button onClick={() => gmailReply(lead)} className="btn btn-ghost btn-sm"><Mail className="w-4 h-4" /> Reply in Gmail</button>
          {status !== 'Accepted' && status !== 'Closed Won' && (
            <button onClick={() => changeStatus('Accepted')} className="btn btn-primary btn-sm"><Check className="w-4 h-4" /> Accept</button>
          )}
        </>
      }
    >
      <div className="space-y-7">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--line)] p-4">
            <div className="label">Budget</div>
            <div className="mt-1.5 text-lg font-medium text-white">{lead.budget}</div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] p-4">
            <div className="label">Service</div>
            <div className="mt-1.5 text-sm text-white leading-snug">{lead.service}</div>
            <div className="text-xs text-[var(--muted)]">{lead.scale || 'Custom'}</div>
          </div>
        </div>

        <DetailList
          rows={[
            ['Email', <a href={`mailto:${lead.email}`} className="text-[var(--accent)] hover:underline break-all">{lead.email}</a>],
            ['Phone', lead.phone && lead.phone !== 'N/A' ? <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a> : '—'],
            ['Received', lead.date],
          ]}
        />

        <div>
          <div className="label mb-2">Project scope</div>
          <p className="p-4 rounded-2xl bg-white/[0.02] border border-[var(--line)] text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-wrap break-words">{lead.details || 'No details provided.'}</p>
        </div>

        {lead.hasConsultation && (
          <div className="rounded-2xl border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><Video className="w-4 h-4 text-[var(--accent)]" /> Consultation call</div>
              <Badge tone={lead.consultationStatus === 'Approved' ? 'ok' : 'warn'} dot>{lead.consultationStatus === 'Approved' ? 'Approved' : 'Awaiting approval'}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[['Date', lead.consultationDate], ['Time', (lead.consultationTime || '').split(' (')[0]], ['Platform', (lead.meetingPlatform || '').split(' (')[0]]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/[0.03] p-2.5 min-w-0">
                  <div className="text-[var(--muted)]">{k}</div>
                  <div className="text-white mt-0.5 truncate">{v || '—'}</div>
                </div>
              ))}
            </div>
            <form onSubmit={approveCall} className="space-y-3">
              <Field label="Meeting link" hint="Included in the confirmation email.">
                <input type="url" required value={link} onChange={(e) => setLink(e.target.value)} className="field font-mono !text-sm" />
              </Field>
              <button type="submit" className="btn btn-primary btn-sm w-full sm:w-auto">
                <Send className="w-4 h-4" /> {lead.consultationStatus === 'Approved' ? 'Resend confirmation' : 'Approve & email link'}
              </button>
            </form>
          </div>
        )}

        <div>
          <div className="label mb-3">Internal notes</div>
          <div className="space-y-2.5">
            {(lead.notes || []).map((n, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-[var(--line)] p-3.5">
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap break-words">{n.text}</p>
                <div className="mt-1.5 text-[11px] text-[var(--muted)]">{n.by} · {timeAgo(n.at)}</div>
              </div>
            ))}
            {!lead.notes?.length && <p className="text-sm text-[var(--muted)]">No notes yet. Only admins can see these.</p>}
          </div>
          <form onSubmit={addNote} className="mt-3 flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note for the team…" className="field" />
            <button type="submit" className="btn btn-ghost shrink-0" aria-label="Add note"><MessageSquarePlus className="w-4 h-4" /></button>
          </form>
        </div>

        <div>
          <div className="label mb-3">History</div>
          <ol className="relative border-l border-[var(--line-strong)] ml-1.5 space-y-4">
            {timeline.map((t, i) => (
              <li key={i} className="pl-5 relative">
                <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${i === timeline.length - 1 ? 'bg-[var(--accent)]' : 'bg-[var(--line-strong)]'}`} />
                <div className="text-sm text-white">{t.label}</div>
                <div className="text-xs text-[var(--muted)]">{timeAgo(t.at)}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ page */

function LeadCard({ lead, onOpen, compact }) {
  return (
    <button onClick={onOpen} className="w-full text-left surface surface-interactive !rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{lead.name}</div>
          <div className="text-xs text-[var(--muted)] truncate">{lead.email}</div>
        </div>
        {!compact && <Badge tone={stageTone(lead.status)}>{lead.status || 'New'}</Badge>}
      </div>
      <div className="text-xs text-[var(--text-2)] line-clamp-1">{lead.service}</div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-white font-medium">{lead.budget}</span>
        <span className="flex items-center gap-1.5 text-[var(--muted)]">
          {lead.hasConsultation && <CalendarClock className={`w-3.5 h-3.5 ${lead.consultationStatus === 'Approved' ? 'text-emerald-300' : 'text-amber-300'}`} />}
          {lead.notes?.length > 0 && <span className="tabular-nums">{lead.notes.length} note{lead.notes.length > 1 ? 's' : ''}</span>}
          <span>{timeAgo(lead.date)}</span>
        </span>
      </div>
    </button>
  );
}

export default function Proposals({ params }) {
  const { inquiries } = useAdmin();
  const [stage, setStage] = useState(params?.stage || 'all');
  const [q, setQ] = useState('');
  const [view, setView] = useState('list');
  const [openId, setOpenId] = useState(params?.open || null);

  useEffect(() => {
    if (params?.stage) setStage(params.stage);
    if (params?.open) setOpenId(params.open);
  }, [params]);

  const searched = useMemo(
    () =>
      inquiries
        .filter((i) => matches(i, q, ['id', 'name', 'email', 'service', 'phone', 'details']))
        .sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [inquiries, q]
  );
  const rows = stage === 'all' ? searched : searched.filter((i) => (i.status || 'New') === stage);
  const open = inquiries.find((i) => i.id === openId);

  const stageOptions = [
    { id: 'all', label: 'All', count: searched.length },
    ...STAGES.map((s) => ({ id: s.id, label: s.short, count: searched.filter((i) => (i.status || 'New') === s.id).length })).filter((o) => o.count > 0 || o.id === stage),
  ];

  const exportCsv = () =>
    downloadCsv(`lyntrix-proposals-${today()}.csv`, rows, [
      { label: 'ID', get: (r) => r.id },
      { label: 'Date', get: (r) => r.date },
      { label: 'Name', get: (r) => r.name },
      { label: 'Email', get: (r) => r.email },
      { label: 'Phone', get: (r) => r.phone },
      { label: 'Service', get: (r) => r.service },
      { label: 'Scale', get: (r) => r.scale },
      { label: 'Budget', get: (r) => r.budget },
      { label: 'Status', get: (r) => r.status },
      { label: 'Consultation', get: (r) => (r.hasConsultation ? `${r.consultationDate} ${r.consultationTime} (${r.consultationStatus})` : '') },
      { label: 'Details', get: (r) => r.details },
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Proposals"
        description={`${inquiries.length} total · ${money(rows.reduce((s, r) => s + budgetValue(r.budget), 0))} in the current view`}
        actions={
          <>
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[{ id: 'list', label: <LayoutList className="w-4 h-4" aria-label="List" /> }, { id: 'board', label: <Columns3 className="w-4 h-4" aria-label="Board" /> }]}
            />
            <button onClick={exportCsv} disabled={!rows.length} className="btn btn-ghost btn-sm disabled:opacity-40"><Download className="w-4 h-4" /> CSV</button>
          </>
        }
      />

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative xl:w-80 shrink-0">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" placeholder="Search name, email, ID, service…" value={q} onChange={(e) => setQ(e.target.value)} className="field !pl-10 !rounded-full" />
        </div>
        {view === 'list' && <Segmented label="Stage" value={stage} onChange={setStage} options={stageOptions} />}
      </div>

      {view === 'board' ? (
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto pb-2 snap-x snap-mandatory sm:snap-none">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((s) => {
              const col = searched.filter((i) => (i.status || 'New') === s.id);
              return (
                <section key={s.id} className="w-[78vw] sm:w-72 shrink-0 snap-start rounded-[var(--radius-lg)] bg-white/[0.015] border border-[var(--line)] p-2.5">
                  <header className="flex items-center justify-between px-1.5 pb-2.5">
                    <Badge tone={s.tone} dot>{s.id}</Badge>
                    <span className="text-xs text-[var(--muted)] tabular-nums">{col.length} · {money(col.reduce((sum, r) => sum + budgetValue(r.budget), 0))}</span>
                  </header>
                  <div className="space-y-2">
                    {col.map((lead) => <LeadCard key={lead.id} lead={lead} compact onOpen={() => setOpenId(lead.id)} />)}
                    {!col.length && <div className="text-xs text-[var(--muted)] text-center py-6 border border-dashed border-[var(--line)] rounded-2xl">Empty</div>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Panel className="overflow-hidden">
          {rows.length === 0 ? (
            <EmptyState icon={Inbox} title="No proposals here">{q ? 'Try a different search.' : 'New proposals from the website will appear here.'}</EmptyState>
          ) : (
            <>
              <table className="hidden lg:table w-full text-sm">
                <thead className="border-b border-[var(--line)] bg-white/[0.015]">
                  <tr>
                    {['Client', 'Service', 'Budget', 'Stage', 'Received', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left label font-normal whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {rows.map((lead) => (
                    <tr key={lead.id} onClick={() => setOpenId(lead.id)} className="cursor-pointer hover:bg-white/[0.025] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={lead.name} size="sm" tone="plain" />
                          <div className="min-w-0">
                            <div className="font-medium text-white truncate max-w-[14rem]">{lead.name}</div>
                            <div className="text-xs text-[var(--muted)] truncate max-w-[14rem]">{lead.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-2)]">
                        <div className="truncate max-w-[16rem]">{lead.service}</div>
                        <div className="text-[11px] font-mono text-[var(--muted)]">{lead.id}</div>
                      </td>
                      <td className="px-5 py-3.5 text-white whitespace-nowrap">{lead.budget}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={stageTone(lead.status)}>{lead.status || 'New'}</Badge>
                          {lead.hasConsultation && (
                            <CalendarClock className={`w-4 h-4 ${lead.consultationStatus === 'Approved' ? 'text-emerald-300' : 'text-amber-300'}`} aria-label={lead.consultationStatus === 'Approved' ? 'Call booked' : 'Call pending'} />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--muted)] whitespace-nowrap">{timeAgo(lead.date)}</td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {lead.phone && lead.phone !== 'N/A' && (
                            <a href={`tel:${lead.phone}`} title="Call" aria-label="Call" className="w-9 h-9 grid place-items-center rounded-full border border-[var(--line)] bg-white/[0.03] text-[var(--muted)] hover:text-white"><Phone className="w-4 h-4" /></a>
                          )}
                          <IconButton title="Reply in Gmail" tone="info" onClick={() => gmailReply(lead)}><Mail className="w-4 h-4" /></IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="lg:hidden p-3 space-y-2">
                {rows.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={() => setOpenId(lead.id)} />)}
              </div>
            </>
          )}
        </Panel>
      )}

      {open && <ProposalDrawer key={open.id} lead={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
