#!/usr/bin/env bash
# Full production deploy: Flask + gunicorn + nginx + HTTPS
#
#   cd ~/food-ai-mobile/backend
#   nano .env                          # set OPENROUTER_API_KEY first
#   sudo CERTBOT_EMAIL=you@email.com bash deploy/deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOMAIN="${DOMAIN:-vitaway.nsengi.space}"
SERVICE_NAME="${SERVICE_NAME:-vitaway-api}"
PORT="${PORT:-5050}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
SITE_FILE="/etc/nginx/sites-available/$DOMAIN"
SITE_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/deploy.sh"
  exit 1
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "ERROR: Create $APP_DIR/.env first (copy from .env.example, add OPENROUTER_API_KEY)"
  exit 1
fi

if grep -q 'your-key-here' "$APP_DIR/.env" 2>/dev/null; then
  echo "ERROR: Replace the placeholder OPENROUTER_API_KEY in $APP_DIR/.env"
  exit 1
fi

proxy_location() {
  cat <<EOF
    client_max_body_size 25M;
    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 180s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 180s;
    }
EOF
}

echo ""
echo "========================================"
echo " Vitaway API deploy"
echo " App:    $APP_DIR"
echo " Domain: $DOMAIN"
echo "========================================"
echo ""

# --- Step 1: system packages ---
echo "[1/7] Installing packages..."
apt-get update -qq
apt-get install -y python3 python3-venv python3-pip nginx certbot python3-certbot-nginx

# --- Step 2: Python app ---
echo "[2/7] Python venv + dependencies..."
python3 -m venv "$APP_DIR/.venv"
"$APP_DIR/.venv/bin/pip" install -q --upgrade pip
"$APP_DIR/.venv/bin/pip" install -q -r "$APP_DIR/requirements.txt"

# --- Step 3: systemd ---
echo "[3/7] systemd service ($SERVICE_NAME)..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=Vitaway plate detection API
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$APP_DIR/.venv/bin/gunicorn \\
  --bind 127.0.0.1:$PORT \\
  --workers 2 --threads 4 --timeout 180 \\
  --access-logfile - --error-logfile - \\
  server:app
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
sleep 1

if ! curl -sf "http://127.0.0.1:$PORT/health" | grep -q '"ok"'; then
  echo "ERROR: Flask not responding on 127.0.0.1:$PORT"
  journalctl -u "$SERVICE_NAME" -n 20 --no-pager
  exit 1
fi
echo "      Flask OK on 127.0.0.1:$PORT"

# --- Step 4: nginx HTTP (for certbot) ---
echo "[4/7] nginx HTTP site..."
cat > "$SITE_FILE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
$(proxy_location)
}
EOF
ln -sf "$SITE_FILE" "$SITE_ENABLED"
nginx -t
systemctl reload nginx

# --- Step 5: SSL certificate ---
echo "[5/7] Let's Encrypt certificate..."
if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
  CERTBOT_ARGS=(certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos)
  if [[ -n "${CERTBOT_EMAIL:-}" ]]; then
    CERTBOT_ARGS+=(--email "$CERTBOT_EMAIL")
  else
    CERTBOT_ARGS+=(--register-unsafely-without-email)
  fi
  certbot "${CERTBOT_ARGS[@]}"
else
  echo "      Cert already exists at $CERT_DIR"
fi

# --- Step 6: nginx HTTPS (explicit block → Flask) ---
echo "[6/7] nginx HTTPS site..."
SSL_INCLUDE=""
[[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] && SSL_INCLUDE="include /etc/letsencrypt/options-ssl-nginx.conf;"
SSL_DH=""
[[ -f /etc/letsencrypt/ssl-dhparams.pem ]] && SSL_DH="ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"

cat > "$SITE_FILE" <<EOF
# Vitaway API — HTTP redirects to HTTPS, both proxy to Flask :$PORT

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $DOMAIN;

    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    $SSL_INCLUDE
    $SSL_DH

$(proxy_location)
}
EOF

nginx -t
systemctl reload nginx

# --- Step 7: verify ---
echo "[7/7] Verifying..."
HTTP_CODE="$(curl -sk -o /tmp/vitaway-health.json -w '%{http_code}' "https://$DOMAIN/health")"
cat /tmp/vitaway-health.json
echo ""

if [[ "$HTTP_CODE" != "200" ]] || ! grep -q '"ok": true' /tmp/vitaway-health.json; then
  echo ""
  echo "FAILED: HTTPS health check did not return ok:true"
  echo "Debug: grep -rn 'listen.*443' /etc/nginx/sites-enabled/"
  exit 1
fi

echo ""
echo "========================================"
echo " DEPLOY SUCCESS"
echo "========================================"
echo " API:    https://$DOMAIN"
echo " Health: https://$DOMAIN/health"
echo " Detect: POST https://$DOMAIN/plates/detect"
echo ""
echo " Mobile app .env:"
echo "   EXPO_PUBLIC_PLATE_API_URL=https://$DOMAIN"
echo ""
echo " Useful commands:"
echo "   sudo systemctl status $SERVICE_NAME"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo "   sudo systemctl restart $SERVICE_NAME"
echo "========================================"
