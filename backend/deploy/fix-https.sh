#!/usr/bin/env bash
# Deprecated — use deploy.sh instead (it configures HTTPS end-to-end).
echo "This script is deprecated."
echo "Run: sudo CERTBOT_EMAIL=you@email.com bash deploy/deploy.sh"
exec bash "$(cd "$(dirname "$0")" && pwd)/deploy.sh"
