#!/usr/bin/env bash
# Fix HTTPS routing when vitaway.nsengi.space:443 hits Node/Express instead of Flask.
# Run on VPS: sudo bash deploy/fix-https.sh
set -euo pipefail

DOMAIN="${DOMAIN:-vitaway.nsengi.space}"
APP_PORT="${PORT:-5050}"
SITE_FILE="/etc/nginx/sites-available/$DOMAIN"
ENABLED_LINK="/etc/nginx/sites-enabled/$DOMAIN"

echo "==> Checking what serves HTTPS for $DOMAIN"
curl -sk -D - "https://$DOMAIN/health" -o /tmp/vitaway-health.txt | head -5 || true
if grep -q "Cannot GET /health" /tmp/vitaway-health.txt 2>/dev/null; then
  echo "    HTTPS is NOT reaching Flask (likely proxied to Node/Express)."
else
  echo "    HTTPS health looks OK."
  cat /tmp/vitaway-health.txt
  exit 0
fi

echo "==> Listing nginx sites that mention $DOMAIN"
grep -rl "$DOMAIN" /etc/nginx/sites-enabled/ /etc/nginx/sites-available/ 2>/dev/null || true

echo "==> Installing Flask proxy site for HTTP"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/nginx-vitaway.nsengi.space.conf" "$SITE_FILE"
ln -sf "$SITE_FILE" "$ENABLED_LINK"

echo "==> Disabling duplicate HTTPS configs for $DOMAIN (except our site)"
for f in /etc/nginx/sites-enabled/*; do
  [[ "$f" == "$ENABLED_LINK" ]] && continue
  if grep -q "server_name.*$DOMAIN" "$f" 2>/dev/null && grep -q "listen.*443" "$f" 2>/dev/null; then
    echo "    Disabling $f"
    rm -f "$f"
  fi
done

echo "==> Ensuring SSL via certbot"
if ! grep -q "listen.*443" "$SITE_FILE" 2>/dev/null; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect || \
    certbot --nginx -d "$DOMAIN"
fi

echo "==> Verifying nginx config"
nginx -t
systemctl reload nginx

echo "==> Re-testing HTTPS"
curl -sk "https://$DOMAIN/health"
echo ""
