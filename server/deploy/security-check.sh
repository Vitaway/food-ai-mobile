#!/usr/bin/env bash
# Validates secrets and confirms DB/Redis are not exposed on the host.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
MIN_SECRET_LEN=20
MIN_JWT_LEN=32

WEAK_PASSWORDS=(
  postgres
  password
  changeme
  change-me
  change-me-in-production
  dev-secret-change-me
  "Test@123"
)

fail() {
  echo "SECURITY CHECK FAILED: $1" >&2
  exit 1
}

read_env() {
  local key="$1"
  if [[ ! -f "$ENV_FILE" ]]; then
    fail "Missing $ENV_FILE"
  fi
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 || true)"
  [[ -n "$line" ]] || return 1
  printf '%s' "${line#*=}" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

is_weak_secret() {
  local value="$1"
  local weak
  for weak in "${WEAK_PASSWORDS[@]}"; do
    if [[ "$value" == "$weak" ]]; then
      return 0
    fi
  done
  return 1
}

check_secret_strength() {
  local name="$1"
  local value="$2"
  local min_len="${3:-$MIN_SECRET_LEN}"

  [[ -n "$value" ]] || fail "$name is not set in $ENV_FILE"
  [[ "${#value}" -ge "$min_len" ]] || fail "$name must be at least $min_len characters"
  is_weak_secret "$value" && fail "$name is too weak — use a random password"
}

echo "Checking production secrets..."
POSTGRES_PASSWORD="$(read_env POSTGRES_PASSWORD || true)"
REDIS_PASSWORD="$(read_env REDIS_PASSWORD || true)"
JWT_SECRET="$(read_env JWT_SECRET || true)"

check_secret_strength "POSTGRES_PASSWORD" "$POSTGRES_PASSWORD"
check_secret_strength "REDIS_PASSWORD" "$REDIS_PASSWORD"
check_secret_strength "JWT_SECRET" "$JWT_SECRET" "$MIN_JWT_LEN"

if [[ -z "$(read_env OPENROUTER_API_KEY || true)" ]]; then
  echo "WARNING: OPENROUTER_API_KEY is empty — plate detection will not work"
fi

chmod 600 "$ENV_FILE"
echo "Locked down $ENV_FILE (chmod 600)"

if command -v docker >/dev/null 2>&1; then
  for container in mirafood-postgres mirafood-redis; do
    if docker ps --format '{{.Names}}' | grep -qx "$container"; then
      if docker port "$container" 2>/dev/null | grep -q .; then
        fail "$container has host port bindings — must be internal only"
      fi
    fi
  done

  if docker ps --format '{{.Names}}' | grep -qx mirafood-api; then
  api_ports="$(docker port mirafood-api 3011/tcp 2>/dev/null || true)"
  if [[ -n "$api_ports" && "$api_ports" != *"127.0.0.1:3011"* ]]; then
    fail "mirafood-api must bind to 127.0.0.1:3011 only (got: $api_ports)"
  fi
  fi
fi

if command -v ss >/dev/null 2>&1; then
  if ss -tln | awk '{print $4}' | grep -qE ':(5432|5433|6379|6380|3011)$'; then
    public_db="$(ss -tln | grep -E ':(5432|5433|6379|6380|3011)' | grep -v '127.0.0.1' || true)"
    if [[ -n "$public_db" ]]; then
      echo "WARNING: Non-localhost listeners detected (other projects may use these ports):"
      echo "$public_db"
      echo "MiraFood Postgres/Redis must stay off this list."
    fi
  fi
fi

echo "Security checks passed."
