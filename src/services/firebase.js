import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  deleteDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('your-')
);

// Firestore rejects `undefined` field values; drop them instead of failing the write
export const firestore = isFirebaseConfigured
  ? initializeFirestore(initializeApp(firebaseConfig), { ignoreUndefinedProperties: true })
  : null;

// Local development against the Firestore emulator, e.g. VITE_FIRESTORE_EMULATOR=127.0.0.1:8080
const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR;
if (firestore && emulatorHost) {
  const [host, port] = emulatorHost.split(':');
  connectFirestoreEmulator(firestore, host, Number(port) || 8080);
}

// Firestore batches are capped at 500 writes
const BATCH_LIMIT = 450;

/**
 * Thin collection adapter used by db.js. Every record is stored as a document whose id is the
 * record's own `id` field (e.g. USR-1001, LYN-9024), mirroring the old Postgres primary keys.
 * All methods throw on failure so callers can decide how loud to be.
 */
export const cloud = {
  async list(name) {
    const snap = await getDocs(collection(firestore, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async upsert(name, records) {
    const list = (Array.isArray(records) ? records : [records]).filter((r) => r && r.id);
    for (let i = 0; i < list.length; i += BATCH_LIMIT) {
      const batch = writeBatch(firestore);
      list.slice(i, i + BATCH_LIMIT).forEach((r) => batch.set(doc(firestore, name, String(r.id)), r, { merge: true }));
      await batch.commit();
    }
  },

  async remove(name, id) {
    await deleteDoc(doc(firestore, name, String(id)));
  },
};
