#!/usr/bin/env bash
# One-command setup for a fresh Ubuntu droplet. Run as root:
#   curl -fsSL https://raw.githubusercontent.com/DilnethMadushanka/lyntrixtec/main/deploy/install.sh | bash
# Optional: DOMAIN=lyntrixtec.com BRANCH=main ... | bash
# Safe to run again: it pulls, rebuilds and restarts, and never overwrites an existing .env.
set -euo pipefail

REPO="https://github.com/DilnethMadushanka/lyntrixtec.git"
BRANCH="${BRANCH:-main}"
DOMAIN="${DOMAIN:-}"
APP_USER="lyntrix"
APP_DIR="/home/$APP_USER/lyntrixtec"
LIVE_URLS="${LIVE_URLS:-https://lyntrixtec.com https://www.lyntrixtec.com https://lyntrixtec-zp4s.vercel.app https://lyntrixtec.vercel.app}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "Run this as root."; exit 1; }
export DEBIAN_FRONTEND=noninteractive

say "Swap (2 GB) so the build fits in 1 GB RAM"
if ! swapon --show | grep -q '/swapfile'; then
  [ -f /swapfile ] || fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
fi
grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab

say "Packages: Node.js 22, Nginx, Git"
if ! node -v 2>/dev/null | grep -qE '^v(2[2-9]|[3-9][0-9])\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y nginx git curl

say "Firewall"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null

say "App user and code ($BRANCH)"
id "$APP_USER" >/dev/null 2>&1 || adduser --disabled-password --gecos "" "$APP_USER"
as_app() { sudo -u "$APP_USER" -H bash -c "$1"; }
if [ -d "$APP_DIR/.git" ]; then
  as_app "cd '$APP_DIR' && git fetch origin '$BRANCH' && git checkout '$BRANCH' && git pull --ff-only origin '$BRANCH'"
else
  as_app "git clone -b '$BRANCH' '$REPO' '$APP_DIR'"
fi

if [ -f "$APP_DIR/.env" ]; then
  say ".env already exists, keeping it"
else
  say "Creating .env from the existing settings"
  # Gmail account and app password the code already uses as its fallback
  GMAIL_USER_VAL=$({ grep -oE "VITE_GMAIL_USER \|\| '[^']+'" "$APP_DIR/api/send-otp.js" || true; } | head -1 | sed -E "s/.*'([^']+)'/\1/")
  GMAIL_PASS_VAL=$({ grep -oE "VITE_GMAIL_APP_PASSWORD \|\| '[^']+'" "$APP_DIR/api/send-otp.js" || true; } | head -1 | sed -E "s/.*'([^']+)'/\1/")
  GOOGLE_ID_VAL=$({ grep -oE "[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com" "$APP_DIR/src/components/AuthModal.jsx" || true; } | head -1)

  # Firebase web config is public: read it from the live site's JS bundle
  FB_API_KEY=""; FB_AUTH=""; FB_PROJECT=""; FB_BUCKET=""; FB_SENDER=""; FB_APP=""
  pick() { { grep -oE "$1:[\"\`][^\"\`]+[\"\`]" || true; } | head -1 | sed -E 's/^[^:]+:.(.*).$/\1/'; }
  for url in $LIVE_URLS; do
    html=$(curl -fsSL --max-time 15 "$url" 2>/dev/null) || continue
    for js in $(printf '%s' "$html" | grep -oE '/assets/[^"]+\.js' | sort -u); do
      bundle=$(curl -fsSL --max-time 30 "$url$js" 2>/dev/null) || continue
      v=$(printf '%s' "$bundle" | pick apiKey);            [ -n "$v" ] && [ -z "$FB_API_KEY" ] && FB_API_KEY=$v
      v=$(printf '%s' "$bundle" | pick authDomain);        [ -n "$v" ] && [ -z "$FB_AUTH" ] && FB_AUTH=$v
      v=$(printf '%s' "$bundle" | pick projectId);         [ -n "$v" ] && [ -z "$FB_PROJECT" ] && FB_PROJECT=$v
      v=$(printf '%s' "$bundle" | pick storageBucket);     [ -n "$v" ] && [ -z "$FB_BUCKET" ] && FB_BUCKET=$v
      v=$(printf '%s' "$bundle" | pick messagingSenderId); [ -n "$v" ] && [ -z "$FB_SENDER" ] && FB_SENDER=$v
      v=$(printf '%s' "$bundle" | pick appId);             [ -n "$v" ] && [ -z "$FB_APP" ] && FB_APP=$v
      v=$(printf '%s' "$bundle" | { grep -oE '[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com' || true; } | head -1)
      [ -n "$v" ] && GOOGLE_ID_VAL=$v
    done
    if [ -n "$FB_PROJECT" ]; then echo "Firebase config read from $url"; break; fi
  done

  if [ -n "$DOMAIN" ]; then SITE_URL_VAL="https://$DOMAIN"
  else SITE_URL_VAL="http://$(curl -fsS --max-time 5 http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null || hostname -I | awk '{print $1}')"; fi

  umask 077
  cat > "$APP_DIR/.env" <<EOF
# Written by deploy/install.sh. VITE_* values are baked in at build time: rebuild after changing them.
SITE_URL=$SITE_URL_VAL

# Gmail SMTP (server side only)
GMAIL_USER=$GMAIL_USER_VAL
GMAIL_APP_PASSWORD=$GMAIL_PASS_VAL
VITE_GMAIL_USER=$GMAIL_USER_VAL

# Google OAuth
VITE_GOOGLE_CLIENT_ID=$GOOGLE_ID_VAL

# Firebase (Cloud Firestore)
VITE_FIREBASE_API_KEY=$FB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=$FB_AUTH
VITE_FIREBASE_PROJECT_ID=$FB_PROJECT
VITE_FIREBASE_STORAGE_BUCKET=$FB_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID=$FB_SENDER
VITE_FIREBASE_APP_ID=$FB_APP
EOF
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  if [ -z "$FB_PROJECT" ]; then
    echo "WARNING: could not read the Firebase config from the live site."
    echo "         Fill the VITE_FIREBASE_* lines with: nano $APP_DIR/.env   then run this script again."
  fi
fi

say "Install and build (a few minutes)"
as_app "cd '$APP_DIR' && npm ci --no-audit --no-fund && npm run build"

say "Service"
cp "$APP_DIR/deploy/lyntrix.service" /etc/systemd/system/lyntrix.service
systemctl daemon-reload
systemctl enable lyntrix >/dev/null 2>&1
systemctl restart lyntrix

say "Nginx"
if [ -n "$DOMAIN" ]; then
  sed "s/server_name .*;/server_name $DOMAIN www.$DOMAIN;/" "$APP_DIR/deploy/nginx-lyntrix.conf" > /etc/nginx/sites-available/lyntrix
else
  sed -e "s/server_name .*;/server_name _;/" -e "s/listen 80;/listen 80 default_server;/" -e "s/listen \[::\]:80;/listen [::]:80 default_server;/" \
    "$APP_DIR/deploy/nginx-lyntrix.conf" > /etc/nginx/sites-available/lyntrix
fi
ln -sf /etc/nginx/sites-available/lyntrix /etc/nginx/sites-enabled/lyntrix
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

say "Check"
sleep 2
if curl -fsS http://127.0.0.1:3000/healthz >/dev/null; then
  echo "App is running."
else
  echo "App did not answer. Logs: journalctl -u lyntrix -n 50"; exit 1
fi
IP=$(hostname -I | awk '{print $1}')
echo
echo "Done. Open: http://${DOMAIN:-$IP}"
if [ -n "$DOMAIN" ]; then echo "For HTTPS: apt install -y certbot python3-certbot-nginx && certbot --nginx -d $DOMAIN -d www.$DOMAIN"; fi
echo "Update later: run this same command again."
