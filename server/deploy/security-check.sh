#!/usr/bin/env bash
# Validates secrets and confirms DB/Redis are not exposed on the public internet.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
MIN_SECRET_LEN=20
MIN_JWT_LEN=32

WEAK_PASSWORDS=(
  postgres password changeme change-me change-me-in-production dev-secret-change-me "Test@123"
)

fail() { echo "SECURITY CHECK FAILED: $1" >&2; exit 1; }

read_env() {
  local key="$1"
  [[ -f "$ENV_FILE" ]] || fail "Missing $ENV_FILE"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 || true)"
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#*=}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

check_secret() {
  local name="$1" value="$2" min="${3:-$MIN_SECRET_LEN}"
  [[ -n "$value" ]] || fail "$name is not set in $ENV_FILE"
  [[ "${#value}" -ge "$min" ]] || fail "$name must be at least $min characters"
  for weak in "${WEAK_PASSWORDS[@]}"; do
    [[ "$value" == "$weak" ]] && fail "$name is too weak"
  done
  if [[ "$value" == *"/"* || "$value" == *"="* || "$value" == *"+"* ]]; then
    fail "$name contains URL-unsafe characters — use: openssl rand -hex 24"
  fi
}

echo "Checking $ENV_FILE ..."
check_secret POSTGRES_PASSWORD "$(read_env POSTGRES_PASSWORD || true)"
check_secret REDIS_PASSWORD "$(read_env REDIS_PASSWORD || true)"
check_secret JWT_SECRET "$(read_env JWT_SECRET || true)" "$MIN_JWT_LEN"

if grep -qE '^DATABASE_URL=.*@localhost' "$ENV_FILE" 2>/dev/null; then
  fail "Remove DATABASE_URL from .env — app builds it from POSTGRES_PASSWORD"
fi

chmod 600 "$ENV_FILE"

if command -v docker >/dev/null 2>&1; then
  for c in mirafood-postgres mirafood-redis; do
    if docker ps --format '{{.Names}}' | grep -qx "$c"; then
      ports="$(docker port "$c" 2>/dev/null || true)"
      if echo "$ports" | grep -qv '127.0.0.1' && [[ -n "$ports" ]]; then
        fail "$c is bound to a non-loopback address: $ports"
      fi
    fi
  done
fi

echo "Security checks passed."
