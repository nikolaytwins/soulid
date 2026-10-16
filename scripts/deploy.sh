#!/usr/bin/env bash
# Push main to GitHub and rebuild test.twinlabs.ru.
# Usually not needed: a push to origin/main already deploys via GitHub Actions.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${SOUL_VPS_HOST:-root@178.72.168.156}"
KEY="${SOUL_VPS_KEY:-$HOME/.ssh/id_ed25519}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash first." >&2
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$branch" != "main" ]]; then
  echo "Deploy from main (now on $branch)." >&2
  exit 1
fi

git push origin main
ssh -i "$KEY" -o IdentitiesOnly=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /root/soul-star
git fetch origin
git reset --hard origin/main
bash scripts/vps-build.sh
REMOTE
echo "deployed https://test.twinlabs.ru"
