#!/usr/bin/env bash
# Run on your Contabo VPS as root (or with sudo).
# Usage: sudo bash deploy/deploy.sh
set -euo pipefail

APP_DIR="/opt/vitaway-api"
REPO_BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Installing system packages"
apt-get update
apt-get install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx rsync

echo "==> Creating app directory"
mkdir -p "$APP_DIR"
rsync -av --delete \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '.env' \
  "$REPO_BACKEND_DIR/" "$APP_DIR/"

echo "==> Python virtualenv + dependencies"
python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install --upgrade pip
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt"

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "==> Creating $APP_DIR/.env from .env.example — EDIT and add OPENROUTER_API_KEY"
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  sed -i 's|OPENROUTER_SITE_URL=.*|OPENROUTER_SITE_URL=https://vitaway.nsengi.space|' "$APP_DIR/.env"
fi

chown -R www-data:www-data "$APP_DIR"

echo "==> Installing systemd service"
cp "$APP_DIR/deploy/vitaway-api.service" /etc/systemd/system/vitaway-api.service
systemctl daemon-reload
systemctl enable vitaway-api
systemctl restart vitaway-api

echo "==> Installing nginx site"
cp "$APP_DIR/deploy/nginx-vitaway.nsengi.space.conf" /etc/nginx/sites-available/vitaway.nsengi.space
ln -sf /etc/nginx/sites-available/vitaway.nsengi.space /etc/nginx/sites-enabled/vitaway.nsengi.space
nginx -t
systemctl reload nginx

echo ""
echo "Done. Next steps:"
echo "  1. Edit $APP_DIR/.env and set OPENROUTER_API_KEY"
echo "  2. Point DNS A record: vitaway.nsengi.space -> this server's public IP"
echo "  3. sudo certbot --nginx -d vitaway.nsengi.space"
echo "  4. curl https://vitaway.nsengi.space/health"
echo "  5. Set EXPO_PUBLIC_PLATE_API_URL=https://vitaway.nsengi.space in the mobile app"
