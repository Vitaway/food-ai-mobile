#!/usr/bin/env bash
# MiraFood Node API — Contabo VPS deploy (replaces legacy Flask mobile/backend)
#
# On the VPS (as root):
#   cd /opt/mirafood-api/server
#   cp .env.example .env && nano .env
#   sudo CERTBOT_EMAIL=you@email.com bash deploy/deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOMAIN="${DOMAIN:-vitaway.nsengi.space}"
LEGACY_SERVICE="${LEGACY_SERVICE:-vitaway-api}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
PORT="${PORT:-3011}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
SITE_FILE="/etc/nginx/sites-available/$DOMAIN"
SITE_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/deploy.sh"
  exit 1
fi

if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "ERROR: Create $APP_DIR/.env first (copy from .env.example)"
  exit 1
fi

echo "[0/9] Security preflight..."
bash "$SCRIPT_DIR/security-check.sh"

if ! command -v docker >/dev/null 2>&1; then
  echo "[1/9] Installing Docker..."
  apt-get update -qq
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin nginx certbot python3-certbot-nginx
else
  echo "[1/9] Docker already installed"
  apt-get update -qq
  apt-get install -y nginx certbot python3-certbot-nginx
fi

echo "[2/9] Stopping legacy Flask service (if present)..."
if systemctl is-active --quiet "$LEGACY_SERVICE" 2>/dev/null; then
  systemctl stop "$LEGACY_SERVICE"
  systemctl disable "$LEGACY_SERVICE" || true
  echo "      Stopped $LEGACY_SERVICE"
fi

echo "[3/9] Building and starting Docker stack..."
cd "$APP_DIR"
docker compose -f "$COMPOSE_FILE" up -d --build

echo "[4/9] Waiting for API health..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/api/v1/health/ready" | grep -q '"ok":true'; then
    echo "      API ready on 127.0.0.1:$PORT"
    break
  fi
  sleep 2
  if [[ "$i" -eq 30 ]]; then
    echo "ERROR: API did not become ready"
    docker compose -f "$COMPOSE_FILE" logs --tail=50 api
    exit 1
  fi
done

proxy_block() {
  cat <<EOF
    client_max_body_size 25M;

    location /ws/ {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 3600s;
    }

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

echo "[5/9] Verifying DB/Redis are not exposed..."
bash "$SCRIPT_DIR/security-check.sh"

echo "[6/9] nginx HTTP site (for certbot)..."
cat > "$SITE_FILE" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
$(proxy_block)
}
EOF
ln -sf "$SITE_FILE" "$SITE_ENABLED"
nginx -t
systemctl reload nginx

echo "[7/9] SSL certificate..."
if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
  CERTBOT_ARGS=(certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos)
  if [[ -n "${CERTBOT_EMAIL:-}" ]]; then
    CERTBOT_ARGS+=(--email "$CERTBOT_EMAIL")
  else
    CERTBOT_ARGS+=(--register-unsafely-without-email)
  fi
  certbot "${CERTBOT_ARGS[@]}"
else
  echo "      Cert already exists"
fi

echo "[8/9] nginx HTTPS site..."
SSL_INCLUDE=""
[[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] && SSL_INCLUDE="include /etc/letsencrypt/options-ssl-nginx.conf;"
SSL_DH=""
[[ -f /etc/letsencrypt/ssl-dhparams.pem ]] && SSL_DH="ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"

cat > "$SITE_FILE" <<EOF
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

$(proxy_block)
}
EOF

nginx -t
systemctl reload nginx

echo "[9/9] Verifying HTTPS..."
HTTP_CODE="$(curl -sk -o /tmp/mirafood-health.json -w '%{http_code}' "https://$DOMAIN/api/v1/health/ready")"
cat /tmp/mirafood-health.json
echo ""

if [[ "$HTTP_CODE" != "200" ]] || ! grep -q '"ok"' /tmp/mirafood-health.json; then
  echo "FAILED: health check"
  exit 1
fi

echo ""
echo "========================================"
echo " DEPLOY SUCCESS"
echo "========================================"
echo " API:    https://$DOMAIN/api/v1"
echo " Health: https://$DOMAIN/api/v1/health/ready"
echo ""
echo " Mobile .env:"
echo "   EXPO_PUBLIC_API_URL=https://$DOMAIN"
echo ""
echo " Redeploy after code changes:"
echo "   cd $APP_DIR && docker compose -f $COMPOSE_FILE up -d --build"
echo " Logs: docker compose -f $COMPOSE_FILE logs -f api"
echo "========================================"
