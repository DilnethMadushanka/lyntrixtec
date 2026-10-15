import React, { useEffect, useMemo, useState } from 'react';
import { Search, Download, UserPlus, Users, Key, Ban, CheckCircle2, Trash2, ShieldPlus, Pencil, ChevronRight } from 'lucide-react';
import { db } from '../../../services/db';
import { useAdmin } from '../context';
import { Panel, PageHeader, Badge, Segmented, Drawer, DetailList, Field, EmptyState, Avatar, Modal, PasswordInput } from '../ui';
import { CLIENT_ROLES, stageTone, matches, timeAgo, downloadCsv, today } from '../lib';

const EMPTY = { name: '', email: '', password: '', company: '', birthday: '', phone: '', country: 'Sri Lanka', role: 'Client' };

function ClientForm({ id, value, onChange, onSubmit, withPassword }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <form id={id} onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Full name *"><input required value={value.name || ''} onChange={set('name')} className="field" /></Field>
      <Field label="Email *"><input type="email" required value={value.email || ''} onChange={set('email')} className="field" /></Field>
      {withPassword && (
        <div className="sm:col-span-2">
          <Field label="Initial password *" hint="At least 6 characters. Share it with the client securely.">
            <PasswordInput value={value.password} onChange={set('password')} placeholder="Set a password" />
          </Field>
        </div>
      )}
      <Field label="Company"><input value={value.company || ''} onChange={set('company')} className="field" /></Field>
      <Field label="Phone"><input type="tel" value={value.phone || ''} onChange={set('phone')} className="field" /></Field>
      <Field label="Country"><input value={value.country || ''} onChange={set('country')} className="field" /></Field>
      <Field label="Tier">
        <select value={value.role || 'Client'} onChange={set('role')} className="field">
          {CLIENT_ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Date of birth / founded"><input type="date" value={value.birthday || ''} onChange={set('birthday')} className="field" /></Field>
    </form>
  );
}

function ClientDrawer({ user, onClose }) {
  const { inquiries, act, confirm, navigate, admins } = useAdmin();
  const [mode, setMode] = useState('view'); // view | edit | password
  const [draft, setDraft] = useState(user);
  const [password, setPassword] = useState('');
  const theirs = inquiries.filter((i) => (i.email || '').toLowerCase() === (user.email || '').toLowerCase());
  const isAdmin = admins.some((a) => a.email.toLowerCase() === (user.email || '').toLowerCase());
  const suspended = user.status === 'Suspended';

  const save = (e) => {
    e.preventDefault();
    act(() => db.updateUserByAdmin(user.id, draft), { success: 'Client updated.', log: { action: `edited client ${user.name}`, detail: user.email } }).then(() => setMode('view'));
  };

  const savePassword = (e) => {
    e.preventDefault();
    act(() => db.resetUserPasswordByAdmin(user.id, password), { success: `Password reset for ${user.email}.`, log: { action: `reset the password for ${user.email}` }, kind: 'warn' }).then(() => {
      setPassword('');
      setMode('view');
    });
  };

  const toggleStatus = () =>
    act(() => db.updateUserByAdmin(user.id, { status: suspended ? 'Active' : 'Suspended' }), {
      success: suspended ? 'Account reactivated.' : 'Account suspended. They can no longer sign in.',
      log: { action: `${suspended ? 'reactivated' : 'suspended'} ${user.email}` },
      kind: suspended ? 'ok' : 'warn',
    });

  const promote = async () => {
    const ok = await confirm({
      title: `Make ${user.name} an admin?`,
      body: 'They will get full access to this console with their current password.',
      confirmLabel: 'Grant admin access',
    });
    if (!ok) return;
    act(
      async () => {
        await db.addAdmin({ name: user.name, email: user.email, password: user.password || Math.random().toString(36).slice(2, 10), role: 'Master Admin' });
      },
      { success: `${user.name} is now an admin.`, log: { action: `granted admin access to ${user.email}` }, kind: 'warn' }
    );
  };

  const remove = async () => {
    const ok = await confirm({ title: `Delete ${user.name}?`, body: 'The account is removed permanently. Their proposals are kept.', confirmLabel: 'Delete account', danger: true });
    if (!ok) return;
    await act(() => db.deleteUser(user.id), { success: 'Client deleted.', log: { action: `deleted client ${user.email}` }, kind: 'danger' });
    onClose();
  };

  return (
    <Drawer
      eyebrow={`${user.id} · joined ${user.joinedDate || '—'}`}
      title={
        <span className="flex items-center gap-3">
          <Avatar name={user.name} size="lg" />
          <span className="min-w-0">
            <span className="block truncate">{user.name}</span>
            <span className="block text-sm text-[var(--muted)] font-normal truncate">{user.email}</span>
          </span>
        </span>
      }
      onClose={onClose}
      headerExtra={
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={suspended ? 'danger' : 'ok'} dot>{user.status || 'Active'}</Badge>
          <Badge tone="info">{user.role || 'Client'}</Badge>
          <Badge>{user.authProvider === 'Google' ? 'Google sign-in' : 'Email sign-in'}</Badge>
          {isAdmin && <Badge tone="violet">Admin</Badge>}
        </div>
      }
      footer={
        mode === 'edit' ? (
          <>
            <button onClick={() => { setDraft(user); setMode('view'); }} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="submit" form="edit-client" className="btn btn-primary btn-sm">Save changes</button>
          </>
        ) : mode === 'password' ? (
          <>
            <button onClick={() => setMode('view')} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="submit" form="client-password" className="btn btn-primary btn-sm">Update password</button>
          </>
        ) : (
          <>
            <button onClick={remove} className="btn btn-ghost btn-sm mr-auto hover:!text-rose-300"><Trash2 className="w-4 h-4" /> Delete</button>
            <button onClick={() => setMode('edit')} className="btn btn-primary btn-sm"><Pencil className="w-4 h-4" /> Edit</button>
          </>
        )
      }
    >
      {mode === 'edit' ? (
        <ClientForm id="edit-client" value={draft} onChange={setDraft} onSubmit={save} />
      ) : mode === 'password' ? (
        <form id="client-password" onSubmit={savePassword}>
          <Field label="New password" hint="At least 6 characters.">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
          </Field>
        </form>
      ) : (
        <div className="space-y-7">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setMode('password')} className="btn btn-ghost btn-sm !px-2"><Key className="w-4 h-4" /> Password</button>
            <button onClick={toggleStatus} className="btn btn-ghost btn-sm !px-2">
              {suspended ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Ban className="w-4 h-4 text-amber-300" />}
              {suspended ? 'Activate' : 'Suspend'}
            </button>
            <button onClick={promote} disabled={isAdmin} className="btn btn-ghost btn-sm !px-2 disabled:opacity-40"><ShieldPlus className="w-4 h-4" /> Admin</button>
          </div>

          <DetailList
            rows={[
              ['Company', user.company],
              ['Phone', user.phone && user.phone !== 'N/A' ? <a href={`tel:${user.phone}`} className="hover:underline">{user.phone}</a> : '—'],
              ['Country', user.country],
              ['Date of birth / founded', user.birthday],
            ]}
          />

          <div>
            <div className="label mb-3">Proposals ({theirs.length})</div>
            {theirs.length ? (
              <ul className="space-y-2">
                {theirs.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => { onClose(); navigate('proposals', { open: p.id }); }} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[var(--line)] hover:border-[var(--line-strong)] text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-white truncate">{p.service}</span>
                        <span className="block text-xs text-[var(--muted)]">{p.id} · {p.budget} · {timeAgo(p.date)}</span>
                      </span>
                      <Badge tone={stageTone(p.status)}>{p.status || 'New'}</Badge>
                      <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)]">No proposals from this client yet.</p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function Clients({ params }) {
  const { users, inquiries, act } = useAdmin();
  const [q, setQ] = useState(params?.q || '');
  const [tier, setTier] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(EMPTY);

  const proposalCount = useMemo(() => {
    const m = {};
    inquiries.forEach((i) => { const k = (i.email || '').toLowerCase(); m[k] = (m[k] || 0) + 1; });
    return m;
  }, [inquiries]);

  const searched = users.filter((u) => matches(u, q, ['name', 'email', 'company', 'id', 'phone']));
  const rows = searched
    .filter((u) => (tier === 'all' ? true : tier === 'suspended' ? u.status === 'Suspended' : (u.role || 'Client') === tier))
    .sort((a, b) => String(b.joinedDate || '').localeCompare(String(a.joinedDate || '')));
  const open = users.find((u) => u.id === openId);

  // Opened from the search palette: filter to that client and open their record
  useEffect(() => {
    if (!params?.q) return;
    setQ(params.q);
    const hit = users.find((u) => (u.email || '').toLowerCase() === params.q.toLowerCase());
    if (hit) setOpenId(hit.id);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = (e) => {
    e.preventDefault();
    act(async () => {
      // registerUser signs the new account in on this device; put the admin's session back afterwards
      const session = db.getCurrentUser();
      const created = await db.registerUser(draft);
      if (session) db.setCurrentUser(session);
      return created;
    }, { success: `${draft.name} added.`, log: { action: `added client ${draft.email}` }, kind: 'ok' }).then((created) => {
      if (created) {
        setAdding(false);
        setDraft(EMPTY);
      }
    });
  };

  const exportCsv = () =>
    downloadCsv(`lyntrix-clients-${today()}.csv`, rows, [
      { label: 'ID', get: (r) => r.id },
      { label: 'Name', get: (r) => r.name },
      { label: 'Email', get: (r) => r.email },
      { label: 'Company', get: (r) => r.company },
      { label: 'Phone', get: (r) => r.phone },
      { label: 'Country', get: (r) => r.country },
      { label: 'Tier', get: (r) => r.role },
      { label: 'Status', get: (r) => r.status },
      { label: 'Sign-in', get: (r) => r.authProvider },
      { label: 'Joined', get: (r) => r.joinedDate },
      { label: 'Proposals', get: (r) => proposalCount[(r.email || '').toLowerCase()] || 0 },
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        description={`${users.length} registered accounts`}
        actions={
          <>
            <button onClick={exportCsv} disabled={!rows.length} className="btn btn-ghost btn-sm disabled:opacity-40"><Download className="w-4 h-4" /> CSV</button>
            <button onClick={() => setAdding(true)} className="btn btn-primary btn-sm"><UserPlus className="w-4 h-4" /> Add client</button>
          </>
        }
      />

      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative xl:w-80 shrink-0">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input type="search" placeholder="Search name, email, company…" value={q} onChange={(e) => setQ(e.target.value)} className="field !pl-10 !rounded-full" />
        </div>
        <Segmented
          label="Tier"
          value={tier}
          onChange={setTier}
          options={[
            { id: 'all', label: 'All', count: searched.length },
            ...CLIENT_ROLES.map((r) => ({ id: r, label: r.replace(' Client', ''), count: searched.filter((u) => (u.role || 'Client') === r).length })),
            { id: 'suspended', label: 'Suspended', count: searched.filter((u) => u.status === 'Suspended').length },
          ]}
        />
      </div>

      <Panel className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No clients found">{q ? 'Try a different search.' : 'Accounts created on the website appear here.'}</EmptyState>
        ) : (
          <>
            <table className="hidden lg:table w-full text-sm">
              <thead className="border-b border-[var(--line)] bg-white/[0.015]">
                <tr>
                  {['Client', 'Company', 'Tier', 'Proposals', 'Status', 'Joined'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left label font-normal whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rows.map((u) => (
                  <tr key={u.id} onClick={() => setOpenId(u.id)} className="cursor-pointer hover:bg-white/[0.025] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate max-w-[15rem]">{u.name}</div>
                          <div className="text-xs text-[var(--muted)] truncate max-w-[15rem]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-2)] truncate max-w-[12rem]">{u.company || '—'}</td>
                    <td className="px-5 py-3.5"><Badge tone="info">{u.role || 'Client'}</Badge></td>
                    <td className="px-5 py-3.5 text-white tabular-nums">{proposalCount[(u.email || '').toLowerCase()] || 0}</td>
                    <td className="px-5 py-3.5"><Badge tone={u.status === 'Suspended' ? 'danger' : 'ok'} dot>{u.status || 'Active'}</Badge></td>
                    <td className="px-5 py-3.5 text-[var(--muted)] whitespace-nowrap">{u.joinedDate || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="lg:hidden divide-y divide-[var(--line)]">
              {rows.map((u) => (
                <li key={u.id}>
                  <button onClick={() => setOpenId(u.id)} className="w-full p-4 flex items-center gap-3 text-left active:bg-white/[0.03]">
                    <Avatar name={u.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white truncate">{u.name}</span>
                      <span className="block text-xs text-[var(--muted)] truncate">{u.email}</span>
                      <span className="block text-xs text-[var(--muted)] truncate">{u.role || 'Client'} · {proposalCount[(u.email || '').toLowerCase()] || 0} proposals</span>
                    </span>
                    <Badge tone={u.status === 'Suspended' ? 'danger' : 'ok'} dot>{u.status || 'Active'}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      {open && <ClientDrawer key={open.id} user={open} onClose={() => setOpenId(null)} />}

      {adding && (
        <Modal
          title="Add client"
          onClose={() => setAdding(false)}
          footer={
            <>
              <button onClick={() => setAdding(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="new-client" className="btn btn-primary">Create account</button>
            </>
          }
        >
          <ClientForm id="new-client" value={draft} onChange={setDraft} onSubmit={create} withPassword />
        </Modal>
      )}
    </div>
  );
}
