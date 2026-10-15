#!/usr/bin/env bash
set -euo pipefail
cd /root/soul-star
set -a
# shellcheck disable=SC1091
source /etc/soul-star.env
set +a
npm ci --include=dev
npx prisma generate
npx prisma db push
COUNT="$(npx tsx -e 'const { PrismaClient } = require("@prisma/client"); const p = new PrismaClient(); p.interpretation.count().then((n) => { console.log(n); return p.$disconnect(); })')"
if [ "${COUNT:-0}" = "0" ]; then
  npx tsx prisma/seed.ts
fi
npm run build
mkdir -p .next/standalone/.next .next/standalone/public
cp -R .next/static .next/standalone/.next/static
cp -R public/. .next/standalone/public/
cp -R messages .next/standalone/messages
cp -R prisma .next/standalone/prisma
systemctl restart soul-star
systemctl --no-pager --full status soul-star | head -20
