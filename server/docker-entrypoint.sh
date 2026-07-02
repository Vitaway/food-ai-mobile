#!/bin/sh
set -e

# URL-encode passwords so openssl base64 values (/, =, +) do not break connection strings.
if [ -n "${POSTGRES_PASSWORD:-}" ]; then
  PG_ENC="$(node -e "console.log(encodeURIComponent(process.env.POSTGRES_PASSWORD))")"
  export DATABASE_URL="postgresql://postgres:${PG_ENC}@postgres:5432/mirafood"
fi

if [ -n "${REDIS_PASSWORD:-}" ]; then
  RD_ENC="$(node -e "console.log(encodeURIComponent(process.env.REDIS_PASSWORD))")"
  export REDIS_URL="redis://:${RD_ENC}@redis:6379"
fi

exec "$@"
