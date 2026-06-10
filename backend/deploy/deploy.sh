#!/usr/bin/env bash
# Run on your Contabo VPS from the backend folder (or set APP_DIR).
#
# In-place (recommended):
#   cd ~/food-ai-mobile/backend
#   sudo bash deploy/deploy.sh
#
# Custom target directory:
#   sudo APP_DIR=/opt/vitaway-api bash deploy/deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="${APP_DIR:-$SOURCE_DIR}"
DOMAIN="${DOMAIN:-vitaway.nsengi.space}"
SERVICE_NAME="${SERVICE_NAME:-vitaway-api}"
PORT="${PORT:-5050}"

if [[ "$APP_DIR" == /root/* ]]; then
  SERVICE_USER="root"
  SERVICE_GROUP="root"
else
  SERVICE_USER="www-data"
  SERVICE_GROUP="www-data"
fi

echo "==> Deploying Vitaway API"
echo "    Source:  $SOURCE_DIR"
echo "    App dir: $APP_DIR"
echo "    User:    $SERVICE_USER"
echo "    Domain:  $DOMAIN"

echo "==> Installing system packages"
apt-get update
apt-get install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx rsync

if [[ "$APP_DIR" != "$SOURCE_DIR" ]]; then
  echo "==> Syncing backend to $APP_DIR"
  mkdir -p "$APP_DIR"
  rsync -av --delete \
    --exclude '.venv' \
    --exclude '__pycache__' \
    --exclude '.env' \
    "$SOURCE_DIR/" "$APP_DIR/"
else
  echo "==> In-place deploy (using existing files in $APP_DIR)"
fi

echo "==> Python virtualenv + dependencies"
python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install --upgrade pip
"$APP_DIR/.venv/bin/pip" install -r "$APP_DIR/requirements.txt"

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "==> Creating $APP_DIR/.env from .env.example — add OPENROUTER_API_KEY"
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  sed -i "s|OPENROUTER_SITE_URL=.*|OPENROUTER_SITE_URL=https://$DOMAIN|" "$APP_DIR/.env"
else
  echo "==> Using existing $APP_DIR/.env"
fi

if [[ "$SERVICE_USER" != "root" ]]; then
  chown -R "$SERVICE_USER:$SERVICE_GROUP" "$APP_DIR"
fi

echo "==> Installing systemd service ($SERVICE_NAME)"
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Vitaway Food AI plate detection API
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/.venv/bin/gunicorn \\
  --bind 127.0.0.1:$PORT \\
  --workers 2 \\
  --threads 4 \\
  --timeout 180 \\
  --graceful-timeout 30 \\
  --access-logfile - \\
  --error-logfile - \\
  server:app
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo "==> Installing nginx site"
sed "s/vitaway.nsengi.space/$DOMAIN/g" \
  "$APP_DIR/deploy/nginx-vitaway.nsengi.space.conf" \
  > "/etc/nginx/sites-available/$DOMAIN"
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t
systemctl reload nginx

echo ""
echo "Done."
echo "  1. Ensure OPENROUTER_API_KEY is set in: $APP_DIR/.env"
echo "  2. DNS A record: $DOMAIN -> this server's public IP"
echo "  3. HTTPS: sudo certbot --nginx -d $DOMAIN"
echo "  4. Verify: curl http://127.0.0.1:$PORT/health"
echo "  5. Verify: curl https://$DOMAIN/health"
echo "  6. Mobile app: EXPO_PUBLIC_PLATE_API_URL=https://$DOMAIN"
