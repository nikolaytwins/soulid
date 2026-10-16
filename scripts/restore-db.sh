#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/soulstar-YYYYMMDD-HHMMSS.sql.gz[.gpg]" >&2
  exit 1
fi

archive="$1"
if [[ -f /etc/soul-star.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/soul-star.env
  set +a
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
if [[ "$archive" == *.gpg ]]; then
  gpg --decrypt "$archive" | gunzip > "$tmp"
else
  gunzip -c "$archive" > "$tmp"
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();" || true
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$tmp"
echo "restore ok $archive"
