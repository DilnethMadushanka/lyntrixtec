import React, { useEffect, useState } from 'react';
import { Plus, Pencil, EyeOff, Eye, Save, Undo2, Star } from 'lucide-react';
import { db } from '../../../services/db';
import { useAdmin } from '../context';
import { Panel, PageHeader, Badge, Modal, Field, IconButton } from '../ui';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `item-${Date.now()}`;

function PriceInput({ value, onChange, label }) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]">$</span>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="50"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
        className="field !pl-8 font-medium tabular-nums"
      />
    </div>
  );
}

function ItemModal({ kind, item, onClose, onSave }) {
  const isService = kind === 'service';
  const [draft, setDraft] = useState(item || (isService ? { title: '', basePrice: 1000, badge: '', tagline: '', description: '', sla: '' } : { title: '', price: 500, popular: false }));
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });

  return (
    <Modal
      title={item ? `Edit ${item.title}` : isService ? 'New service' : 'New add-on'}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button type="submit" form="catalog-item" className="btn btn-primary">{item ? 'Save' : 'Create'}</button>
        </>
      }
    >
      <form
        id="catalog-item"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...draft, id: draft.id || slug(draft.title) });
        }}
        className="space-y-4"
      >
        <Field label="Name *"><input required value={draft.title} onChange={set('title')} className="field" /></Field>
        <Field label={isService ? 'Base price (USD) *' : 'Price (USD) *'}>
          <PriceInput label="Price" value={isService ? draft.basePrice : draft.price} onChange={(v) => setDraft({ ...draft, [isService ? 'basePrice' : 'price']: v })} />
        </Field>
        {isService ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Badge"><input value={draft.badge || ''} onChange={set('badge')} placeholder="e.g. Core competency" className="field" /></Field>
              <Field label="SLA"><input value={draft.sla || ''} onChange={set('sla')} placeholder="e.g. 99.99% uptime" className="field" /></Field>
            </div>
            <Field label="Tagline"><input value={draft.tagline || ''} onChange={set('tagline')} className="field" /></Field>
            <Field label="Description"><textarea rows={3} value={draft.description || ''} onChange={set('description')} className="field resize-y" /></Field>
          </>
        ) : (
          <label className="flex items-center gap-2.5 text-sm text-[var(--text-2)] cursor-pointer w-fit">
            <input type="checkbox" checked={Boolean(draft.popular)} onChange={(e) => setDraft({ ...draft, popular: e.target.checked })} className="w-4 h-4 accent-[var(--accent)]" />
            Mark as popular
          </label>
        )}
      </form>
    </Modal>
  );
}

export default function Catalog() {
  const { services, addons, act } = useAdmin();
  const [svc, setSvc] = useState(services);
  const [add, setAdd] = useState(addons);
  const [editing, setEditing] = useState(null); // { kind, item }

  // Pick up changes made elsewhere unless there are unsaved edits here
  const dirty = JSON.stringify(svc) !== JSON.stringify(services) || JSON.stringify(add) !== JSON.stringify(addons);
  useEffect(() => {
    if (!dirty) {
      setSvc(services);
      setAdd(addons);
    }
  }, [services, addons]); // eslint-disable-line react-hooks/exhaustive-deps

  const savePrices = () =>
    act(
      async () => {
        await db.saveServices(svc);
        await db.saveAddons(add);
      },
      { success: 'Prices saved. The public estimator is updated.', log: { action: 'updated catalog prices' }, kind: 'ok' }
    );

  const discard = () => {
    setSvc(services);
    setAdd(addons);
  };

  // Item edits start from the local lists, so pending price edits are saved along with them
  const persist = (kind, next) => {
    (kind === 'service' ? setSvc : setAdd)(next);
    return kind === 'service' ? db.saveServices(next) : db.saveAddons(next);
  };

  const saveItem = (kind, item) => {
    const list = kind === 'service' ? svc : add;
    const exists = list.some((x) => x.id === item.id);
    if (!editing.item && exists) {
      act(() => { throw new Error(`An item with the id "${item.id}" already exists.`); });
      return;
    }
    const next = exists ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x)) : [...list, item];
    act(() => persist(kind, next), {
      success: `${item.title} ${exists ? 'updated' : 'added'}.`,
      log: { action: `${exists ? 'edited' : 'added'} ${kind} "${item.title}"` },
    }).then(() => setEditing(null));
  };

  const toggleArchived = (kind, item) => {
    const list = kind === 'service' ? svc : add;
    const next = list.map((x) => (x.id === item.id ? { ...x, archived: !x.archived } : x));
    act(() => persist(kind, next), {
      success: item.archived ? `${item.title} is visible in the estimator again.` : `${item.title} hidden from the estimator.`,
      log: { action: `${item.archived ? 'restored' : 'hid'} ${kind} "${item.title}"` },
    });
  };

  const section = (kind, list, setList, priceKey) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="label">{kind === 'service' ? `Services (${list.length})` : `Add-ons (${list.length})`}</h2>
        <button onClick={() => setEditing({ kind, item: null })} className="btn btn-ghost btn-sm"><Plus className="w-4 h-4" /> New {kind === 'service' ? 'service' : 'add-on'}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((item) => (
          <Panel key={item.id} className={`p-4 sm:p-5 flex flex-col gap-4 ${item.archived ? 'opacity-55' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-white font-medium leading-snug">{item.title}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {item.archived && <Badge tone="warn">Hidden</Badge>}
                  {item.badge && <Badge>{item.badge}</Badge>}
                  {item.popular && <Badge tone="info"><Star className="w-3 h-3" /> Popular</Badge>}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <IconButton title={item.archived ? 'Show in estimator' : 'Hide from estimator'} onClick={() => toggleArchived(kind, item)}>
                  {item.archived ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconButton>
                <IconButton title="Edit details" tone="info" onClick={() => setEditing({ kind, item })}><Pencil className="w-4 h-4" /></IconButton>
              </div>
            </div>
            <div className="mt-auto">
              <PriceInput
                label={`${item.title} price`}
                value={item[priceKey]}
                onChange={(v) => setList(list.map((x) => (x.id === item.id ? { ...x, [priceKey]: v } : x)))}
              />
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Pricing & services"
        description="Everything the public cost estimator offers. Hidden items stay saved but are not shown to visitors."
      />
      {section('service', svc, setSvc, 'basePrice')}
      {section('addon', add, setAdd, 'price')}

      {dirty && (
        <div className="fixed z-50 inset-x-3 lg:left-[calc(16rem+1.5rem)] lg:right-6 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6 fade-up">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 rounded-full border border-white/10 bg-[#15151c]/95 backdrop-blur-xl pl-5 pr-1.5 py-1.5 shadow-2xl shadow-black/70">
            <span className="text-sm text-white truncate">Unsaved price changes</span>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={discard} className="btn btn-ghost btn-sm"><Undo2 className="w-4 h-4" /> <span className="hidden sm:inline">Discard</span></button>
              <button onClick={savePrices} className="btn btn-primary btn-sm"><Save className="w-4 h-4" /> Save</button>
            </div>
          </div>
        </div>
      )}

      {editing && <ItemModal kind={editing.kind} item={editing.item} onClose={() => setEditing(null)} onSave={(item) => saveItem(editing.kind, item)} />}
    </div>
  );
}
