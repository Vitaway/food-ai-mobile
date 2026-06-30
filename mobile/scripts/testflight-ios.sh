#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ MiraFood iOS TestFlight build"
echo "  API: https://vitaway.nsengi.space"
echo ""
echo "First run: EAS will ask you to sign in with your Apple Developer account"
echo "and create Distribution Certificate + Provisioning Profile."
echo ""

npx eas-cli build --platform ios --profile production "$@"

echo ""
echo "When the build finishes, submit to App Store Connect:"
echo "  npm run submit:ios:testflight"
echo ""
echo "Then open App Store Connect → MiraFood → TestFlight to add testers."
