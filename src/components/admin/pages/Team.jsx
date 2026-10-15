import React, { useState } from 'react';
import { Plus, Key, Pencil, Trash2, Ban, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { db } from '../../../services/db';
import { useAdmin } from '../context';
import { Panel, PageHeader, Badge, Modal, Field, PasswordInput, Avatar, IconButton } from '../ui';
import { ADMIN_ROLES } from '../lib';

export default function Team() {
  const { admins, users, act, confirm, currentAdmin } = useAdmin();
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'password', admin? }
  const [draft, setDraft] = useState({});

  const me = (a) => currentAdmin && a.email.toLowerCase() === (currentAdmin.email || '').toLowerCase();
  const activeCount = admins.filter((a) => a.status !== 'Suspended').length;
  const defaultPasswordAdmins = admins.filter((a) => a.status !== 'Suspended' && a.password === 'admin123');

  const openAdd = () => {
    setDraft({ name: '', email: '', password: '', role: ADMIN_ROLES[0], fromUser: '' });
    setModal({ type: 'add' });
  };

  const submit = (e) => {
    e.preventDefault();
    const close = () => setModal(null);
    if (modal.type === 'add') {
      act(() => db.addAdmin(draft), { success: `${draft.email} can now sign in to the console.`, log: { action: `added admin ${draft.email}`, detail: draft.role }, kind: 'warn' }).then((r) => r && close());
    } else if (modal.type === 'edit') {
      act(() => db.updateAdmin(modal.admin.id, { name: draft.name, role: draft.role }), { success: 'Admin updated.', log: { action: `edited admin ${modal.admin.email}` } }).then(close);
    } else {
      act(() => db.updateAdminPassword(modal.admin.id, draft.password), { success: `Password changed for ${modal.admin.email}.`, log: { action: `changed the password for ${modal.admin.email}` }, kind: 'warn' }).then(close);
    }
  };

  const toggle = async (a) => {
    const suspending = a.status !== 'Suspended';
    if (suspending) {
      const ok = await confirm({ title: `Disable ${a.email}?`, body: 'They will not be able to sign in until re-enabled.', confirmLabel: 'Disable', danger: true });
      if (!ok) return;
    }
    act(() => db.updateAdmin(a.id, { status: suspending ? 'Suspended' : 'Active' }), {
      success: suspending ? 'Admin disabled.' : 'Admin re-enabled.',
      log: { action: `${suspending ? 'disabled' : 're-enabled'} admin ${a.email}` },
      kind: 'warn',
    });
  };

  const remove = async (a) => {
    const builtIn = db.isBuiltInAdmin(a.id);
    const ok = await confirm({
      title: `Remove ${a.email}?`,
      body: builtIn ? 'This is a built-in account, so it will be disabled rather than deleted.' : 'The account is deleted and loses console access immediately.',
      confirmLabel: builtIn ? 'Disable account' : 'Remove admin',
      danger: true,
    });
    if (!ok) return;
    act(() => db.deleteAdmin(a.id), { success: builtIn ? 'Built-in admin disabled.' : 'Admin removed.', log: { action: `removed admin ${a.email}` }, kind: 'danger' });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team"
        description="People who can sign in to this console."
        actions={<button onClick={openAdd} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Add admin</button>}
      />

      {defaultPasswordAdmins.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-amber-100 font-medium">{defaultPasswordAdmins.length} admin account{defaultPasswordAdmins.length > 1 ? 's still use' : ' still uses'} the default password</div>
            <div className="text-amber-100/70 mt-0.5 break-words">{defaultPasswordAdmins.map((a) => a.email).join(', ')}. Change the password or disable accounts you don't use.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {admins.map((a) => {
          const suspended = a.status === 'Suspended';
          const self = me(a);
          const lastActive = !suspended && activeCount <= 1;
          return (
            <Panel key={a.id} className={`p-5 flex flex-col gap-4 ${suspended ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Avatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium truncate flex items-center gap-2">
                    {a.name}
                    {self && <Badge tone="info">You</Badge>}
                  </div>
                  <div className="text-xs text-[var(--muted)] truncate">{a.email}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="violet"><ShieldCheck className="w-3 h-3" /> {a.role}</Badge>
                <Badge tone={suspended ? 'danger' : 'ok'} dot>{suspended ? 'Disabled' : 'Active'}</Badge>
                {db.isBuiltInAdmin(a.id) && <Badge>Built-in</Badge>}
              </div>
              <div className="mt-auto pt-4 border-t border-[var(--line)] flex items-center gap-1.5">
                <button onClick={() => { setDraft({ password: '' }); setModal({ type: 'password', admin: a }); }} className="btn btn-ghost btn-sm flex-1"><Key className="w-4 h-4" /> Password</button>
                <IconButton title="Edit name and role" tone="info" onClick={() => { setDraft({ name: a.name, role: a.role }); setModal({ type: 'edit', admin: a }); }}><Pencil className="w-4 h-4" /></IconButton>
                <IconButton title={suspended ? 'Re-enable' : self ? "You can't disable yourself" : 'Disable'} tone="warn" disabled={!suspended && (self || lastActive)} onClick={() => toggle(a)}>
                  {suspended ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                </IconButton>
                <IconButton title={self ? "You can't remove yourself" : 'Remove'} tone="danger" disabled={self || lastActive} onClick={() => remove(a)}><Trash2 className="w-4 h-4" /></IconButton>
              </div>
            </Panel>
          );
        })}
      </div>

      {modal && (
        <Modal
          size="sm"
          eyebrow={modal.admin?.email}
          title={modal.type === 'add' ? 'Add admin' : modal.type === 'edit' ? 'Edit admin' : 'Change password'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button onClick={() => setModal(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="team-form" className="btn btn-primary">{modal.type === 'add' ? 'Add admin' : 'Save'}</button>
            </>
          }
        >
          <form id="team-form" onSubmit={submit} className="space-y-4">
            {modal.type === 'add' && (
              <Field label="Promote an existing client (optional)">
                <select
                  value={draft.fromUser}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    setDraft(u ? { ...draft, fromUser: u.id, name: u.name, email: u.email } : { ...draft, fromUser: '' });
                  }}
                  className="field"
                >
                  <option value="">New person</option>
                  {users.filter((u) => !admins.some((a) => a.email.toLowerCase() === u.email.toLowerCase())).map((u) => (
                    <option key={u.id} value={u.id}>{u.name} · {u.email}</option>
                  ))}
                </select>
              </Field>
            )}
            {modal.type !== 'password' && (
              <>
                <Field label="Name *"><input required value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="field" /></Field>
                {modal.type === 'add' && (
                  <Field label="Login email *"><input type="email" required value={draft.email || ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="field" /></Field>
                )}
                <Field label="Role">
                  <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="field">
                    {ADMIN_ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
              </>
            )}
            {modal.type !== 'edit' && (
              <Field label={modal.type === 'add' ? 'Password *' : 'New password *'} hint="At least 6 characters.">
                <PasswordInput value={draft.password || ''} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder="Password" />
              </Field>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
