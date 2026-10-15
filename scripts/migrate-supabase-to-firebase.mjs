/**
 * One-time copy of the old Supabase tables into Cloud Firestore.
 *
 *   node scripts/migrate-supabase-to-firebase.mjs            # dry run: counts only
 *   node scripts/migrate-supabase-to-firebase.mjs --write    # copy
 *
 * Reads from .env (or the shell):
 *   SUPABASE_URL, SUPABASE_KEY   (service-role or anon key of the old project)
 *   VITE_FIREBASE_*              (same web config the site uses)
 *
 * Each row becomes a document whose id is the row's `id`, in a collection with the table's name.
 * Existing documents are merged, never deleted, so the script is safe to re-run.
 */
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, writeBatch } from 'firebase/firestore';

const TABLES = ['users', 'inquiries', 'admins', 'services', 'addons'];
const write = process.argv.includes('--write');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_KEY.');
  process.exit(1);
}
if (!process.env.VITE_FIREBASE_PROJECT_ID || !process.env.VITE_FIREBASE_API_KEY) {
  console.error('Missing VITE_FIREBASE_* config.');
  process.exit(1);
}

const firestore = initializeFirestore(
  initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  }),
  { ignoreUndefinedProperties: true }
);

async function fetchTable(table) {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

// Postgres-only bookkeeping column; numeric columns can arrive as strings
function clean(table, row) {
  const { created_at, ...rest } = row;
  if (table === 'services') rest.basePrice = Number(rest.basePrice) || 0;
  if (table === 'addons') rest.price = Number(rest.price) || 0;
  return rest;
}

let failed = false;
for (const table of TABLES) {
  try {
    const rows = (await fetchTable(table)).filter((r) => r && r.id).map((r) => clean(table, r));
    if (write) {
      for (let i = 0; i < rows.length; i += 450) {
        const batch = writeBatch(firestore);
        rows.slice(i, i + 450).forEach((r) => batch.set(doc(firestore, table, String(r.id)), r, { merge: true }));
        await batch.commit();
      }
    }
    console.log(`${table.padEnd(10)} ${rows.length} rows ${write ? 'copied' : '(dry run)'}`);
  } catch (e) {
    failed = true;
    console.error(`${table.padEnd(10)} FAILED: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
