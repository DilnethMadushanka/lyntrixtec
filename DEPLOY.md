# Hosting on a DigitalOcean Droplet

The site runs as one Node process (`server.js`). It serves the built React app from `dist/`
and handles `/api/send-email` and `/api/send-otp` with the same files in `api/` that Vercel uses.
Nginx sits in front for HTTPS.

```
Browser ──HTTPS──> Nginx :443 ──> Node server.js :3000 ──> dist/ + api/*
```

## Quick start: one command

On a fresh Ubuntu 24.04 droplet, logged in as root:

```bash
curl -fsSL https://raw.githubusercontent.com/DilnethMadushanka/lyntrixtec/main/deploy/install.sh | bash
```

With a domain already pointing at the droplet:

```bash
curl -fsSL https://raw.githubusercontent.com/DilnethMadushanka/lyntrixtec/main/deploy/install.sh | DOMAIN=lyntrixtec.com bash
```

`deploy/install.sh` adds swap, installs Node 22 / Nginx / Git, opens the firewall, clones the repo
as the `lyntrix` user, writes `.env` (Gmail settings from the code's current fallback, Firebase web
config read from the live Vercel site), builds, and starts the systemd service behind Nginx.
It never overwrites an existing `.env`, and running it again updates the site.

The manual steps below do the same thing by hand.

## 1. Create the droplet

- **Image:** Ubuntu 24.04 LTS
- **Size:** Basic, 1 GB RAM / 1 vCPU is enough (the $6/month plan)
- **Region:** Singapore (SGP1) is the closest to Sri Lanka
- **Authentication:** SSH key (recommended)

Copy the droplet's IP address once it is created.

## 2. Point your domain at it

At your domain registrar (or DigitalOcean → Networking → Domains), add:

| Type | Name | Value |
| :--- | :--- | :--- |
| A | `@` | droplet IP |
| A | `www` | droplet IP |

DNS can take a few minutes to an hour.

## 3. First login and basic setup (as root)

```bash
ssh root@YOUR_DROPLET_IP

apt update && apt upgrade -y
adduser lyntrix                 # choose a password
usermod -aG sudo lyntrix
rsync --archive --chown=lyntrix:lyntrix ~/.ssh /home/lyntrix   # lets you ssh in as lyntrix

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 4. Install Node.js 22, Nginx, Git

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx git
node -v    # should print v22.x
```

## 5. Get the code and build it (as lyntrix)

```bash
su - lyntrix
git clone https://github.com/DilnethMadushanka/lyntrixtec.git
cd lyntrixtec
cp .env.example .env
nano .env          # fill in the real values (see below)
npm ci
npm run build
```

**Important about `.env`:** the `VITE_*` values are baked into the website when you run
`npm run build`. If you change any of them later, run `npm run build` again. The other values
(`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SITE_URL`) are read by the server at runtime, so a
restart is enough.

Set at least:

```
GMAIL_USER=lyntrixtec@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
SITE_URL=https://lyntrixtec.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_CLIENT_ID=...
```

Do **not** put the Gmail app password in `VITE_GMAIL_APP_PASSWORD`. Anything starting with
`VITE_` can end up in the public JavaScript.

Quick test (Ctrl+C to stop): `npm start`, then from a second terminal
`curl -I http://127.0.0.1:3000`.

## 6. Run it as a service (as root, or with sudo)

```bash
sudo cp /home/lyntrix/lyntrixtec/deploy/lyntrix.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lyntrix
sudo systemctl status lyntrix      # should say "active (running)"
```

Logs: `sudo journalctl -u lyntrix -f`

## 7. Nginx

Edit the domain in the file first if it is not `lyntrixtec.com`.

```bash
sudo cp /home/lyntrix/lyntrixtec/deploy/nginx-lyntrix.conf /etc/nginx/sites-available/lyntrix
sudo ln -s /etc/nginx/sites-available/lyntrix /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Now `http://lyntrixtec.com` should load the site.

## 8. Free HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lyntrixtec.com -d www.lyntrixtec.com
```

Choose the redirect option so HTTP goes to HTTPS. Renewal is automatic.

## 9. Google sign-in and Firebase

Add the domain in two places, or Google sign-in will fail on the new host:

- **Google Cloud Console → APIs & Services → Credentials → your OAuth client →
  Authorized JavaScript origins:** `https://lyntrixtec.com` and `https://www.lyntrixtec.com`
- **Firebase console → Authentication → Settings → Authorized domains:** add `lyntrixtec.com`

## Updating the site later

```bash
ssh root@YOUR_DROPLET_IP
bash /home/lyntrix/lyntrixtec/deploy/update.sh
```

This pulls `main`, installs packages, rebuilds and restarts the service.

## Troubleshooting

| Problem | Check |
| :--- | :--- |
| 502 Bad Gateway | `sudo systemctl status lyntrix` and `sudo journalctl -u lyntrix -n 50` |
| Emails not sending | `GMAIL_USER` / `GMAIL_APP_PASSWORD` in `.env`, then `sudo systemctl restart lyntrix` |
| Firebase/Google values missing | They are build-time: edit `.env`, then `npm run build` and restart |
| Site works on IP but not domain | DNS A records, then `sudo nginx -t` |
