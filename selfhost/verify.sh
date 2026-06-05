#!/usr/bin/env bash
# =============================================================================
# verify.sh — smoke-test a running Qorstack Report stack
#
# Confirms the stack is actually serving: the API health endpoint responds and
# the web UI is reachable. Compose-agnostic — it only needs the exposed ports,
# so it works the same whether you started the stack with `docker compose up`
# or `make up`.
#
# Usage:
#   bash selfhost/verify.sh
#   API_URL=http://host:8080 WEB_URL=http://host:3000 bash selfhost/verify.sh
#
# Note: this checks that the services are up and serving. It does NOT generate a
# document — a full generation test additionally needs an API key (X-API-Key)
# and an uploaded template key.
# =============================================================================
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

fail=0

check() {
  local name="$1" url="$2" expect="$3" code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo 000)
  if echo " $expect " | grep -q " $code "; then
    echo "  OK   $name ($url) -> $code"
  else
    echo "  FAIL $name ($url) -> $code (expected: $expect)"
    fail=1
  fi
}

echo "Verifying Qorstack Report stack..."
check "API health" "$API_URL/health" "200"
check "Web UI"      "$WEB_URL"        "200 307 308"

if [ "$fail" -eq 0 ]; then
  echo "All checks passed — the stack is serving."
else
  echo "Some checks failed. Is the stack up? Try: docker compose up -d && docker compose ps"
  exit 1
fi
