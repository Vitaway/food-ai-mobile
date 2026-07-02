#!/usr/bin/env bash
# Install or refresh nginx configs only (no Docker rebuild).
#
# Usage:
#   sudo bash deploy/install-nginx.sh              # HTTPS site (cert must exist)
#   sudo bash deploy/install-nginx.sh --http-only  # HTTP only (before certbot)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOMAIN="${DOMAIN:-vitaway.nsengi.space}"
API_PORT="${API_PORT:-3011}"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
SITE_FILE="/etc/nginx/sites-available/$DOMAIN"
SITE_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
SNIPPETS_DIR="/etc/nginx/snippets"
HTTP_ONLY=false

if [[ "${1:-}" == "--http-only" ]]; then
  HTTP_ONLY=true
fi

if [[ $EUID -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/install-nginx.sh"
  exit 1
fi

mkdir -p "$SNIPPETS_DIR"

install_snippets() {
  sed "s/@API_PORT@/$API_PORT/g" \
    "$SCRIPT_DIR/nginx/snippets/mirafood-api-proxy-headers.conf" \
    > "$SNIPPETS_DIR/mirafood-api-proxy-headers.conf"

  sed "s/@API_PORT@/$API_PORT/g" \
    "$SCRIPT_DIR/nginx/snippets/mirafood-api-locations.conf" \
    > "$SNIPPETS_DIR/mirafood-api-locations.conf"
}

remove_legacy_flask_site() {
  local files
  files="$(grep -rl '127.0.0.1:5050' /etc/nginx/sites-enabled/ /etc/nginx/sites-available/ 2>/dev/null || true)"
  if [[ -n "$files" ]]; then
    echo "Patching nginx configs still pointing at Flask :5050..."
    while IFS= read -r f; do
      [[ -n "$f" ]] || continue
      echo "  $f"
      sed -i "s|127.0.0.1:5050|127.0.0.1:${API_PORT}|g" "$f"
    done <<< "$files"
  fi
}

write_http_site() {
  cat > "$SITE_FILE" <<EOF
# MiraFood Node API — $DOMAIN (HTTP)
# Replaces legacy Flask mobile/backend on :5050

map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    include /etc/nginx/snippets/mirafood-api-locations.conf;
}
EOF
}

write_https_site() {
  local ssl_include="" ssl_dh=""
  [[ -f /etc/letsencrypt/options-ssl-nginx.conf ]] && ssl_include="    include /etc/letsencrypt/options-ssl-nginx.conf;"
  [[ -f /etc/letsencrypt/ssl-dhparams.pem ]] && ssl_dh="    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"

  cat > "$SITE_FILE" <<EOF
# MiraFood Node API — $DOMAIN (HTTPS)
# Replaces legacy Flask mobile/backend on :5050

map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
$ssl_include
$ssl_dh

    include /etc/nginx/snippets/mirafood-api-locations.conf;
}
EOF
}

install_snippets
remove_legacy_flask_site

if $HTTP_ONLY; then
  echo "Writing HTTP-only nginx site for $DOMAIN → 127.0.0.1:$API_PORT"
  write_http_site
else
  if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
    echo "ERROR: SSL cert not found at $CERT_DIR — run with --http-only first, then certbot"
    exit 1
  fi
  echo "Writing HTTPS nginx site for $DOMAIN → 127.0.0.1:$API_PORT"
  write_https_site
fi

ln -sf "$SITE_FILE" "$SITE_ENABLED"
nginx -t
systemctl reload nginx
echo "nginx updated: $SITE_FILE"
