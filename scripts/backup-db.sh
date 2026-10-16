#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f /etc/soul-star.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/soul-star.env
  set +a
elif [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/soul-star}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp="$(date -u +%Y%m%d-%H%M%S)"
file="$BACKUP_DIR/soulstar-$stamp.sql.gz"
umask 077
pg_dump "$DATABASE_URL" --no-owner --no-acl | gzip -9 > "$file"
chmod 600 "$file"

if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  gpg --yes --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "$file.gpg" "$file"
  rm -f "$file"
  file="$file.gpg"
fi

find "$BACKUP_DIR" -type f \( -name 'soulstar-*.sql.gz' -o -name 'soulstar-*.sql.gz.gpg' \) -mtime +"$KEEP_DAYS" -delete
echo "backup ok $file"
