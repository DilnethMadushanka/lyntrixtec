import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../../services/db';
import { Toasts, ConfirmDialog } from './ui';

/**
 * Admin console state: one snapshot of everything in db.js, refreshed on every
 * `lyntrix-db-updated` event, plus toast / confirm / activity-log helpers for the pages.
 */
const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

const snapshot = () => ({
  users: db.getUsers(),
  inquiries: db.getInquiries(),
  services: db.getServices(),
  addons: db.getAddons(),
  admins: db.getAdmins(),
  activity: db.getActivity(),
  maintenance: db.getMaintenanceConfig(),
});

export function AdminProvider({ children, onDataUpdated, navigate }) {
  const [data, setData] = useState(snapshot);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const toastId = useRef(0);

  const refresh = useCallback(() => setData(snapshot()), []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      await db.syncWithCloud();
    } finally {
      setData(snapshot());
      setLastSync(new Date());
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('lyntrix-db-updated', refresh);
    window.addEventListener('lyntrix-maintenance-updated', refresh);
    return () => {
      window.removeEventListener('lyntrix-db-updated', refresh);
      window.removeEventListener('lyntrix-maintenance-updated', refresh);
    };
  }, [sync, refresh]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (text, tone = 'ok') => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((t) => [...t.slice(-2), { id, text, tone }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  /** await confirm({ title, body, confirmLabel, danger }) -> boolean */
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setConfirmState({
          ...opts,
          onConfirm: () => { setConfirmState(null); resolve(true); },
          onCancel: () => { setConfirmState(null); resolve(false); },
        });
      }),
    []
  );

  /** Run a write, refresh, log it to the shared activity feed and tell the public site. */
  const act = useCallback(
    async (fn, { success, log, kind = 'info', error = 'Something went wrong.' } = {}) => {
      try {
        const result = await fn();
        setData(snapshot());
        if (onDataUpdated) onDataUpdated();
        if (log) db.logActivity(log.action, log.detail, kind);
        if (success) toast(success);
        return result;
      } catch (e) {
        toast(e?.message || error, 'danger');
        return undefined;
      }
    },
    [onDataUpdated, toast]
  );

  const value = {
    ...data,
    syncing,
    lastSync,
    sync,
    refresh,
    toast,
    confirm,
    act,
    navigate,
    currentAdmin: db.getCurrentAdmin() || db.getCurrentUser(),
    cloudOnline: db.isCloudConnected(),
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
      <Toasts items={toasts} onDismiss={dismiss} />
      {confirmState && <ConfirmDialog {...confirmState} />}
    </AdminContext.Provider>
  );
}
