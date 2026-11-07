// Production server for self-hosting (e.g. a DigitalOcean droplet).
// Serves the Vite build in dist/ and runs the same api/ handlers that Vercel uses.
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sendEmail from './api/send-email.js';
import sendOtp from './api/send-otp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(express.json({ limit: '1mb' }));

app.all('/api/send-email', sendEmail);
app.all('/api/send-otp', sendOtp);
app.all('/api/*splat', (req, res) => res.status(404).json({ error: 'Not Found' }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

// Hashed build assets can be cached for a long time; index.html must not be.
app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }));
app.use(express.static(distDir, { index: false }));

// SPA fallback: every other GET returns index.html (same as the Vercel rewrite).
app.get('/{*splat}', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`LYNTRIX server listening on http://${HOST}:${PORT}`);
});
