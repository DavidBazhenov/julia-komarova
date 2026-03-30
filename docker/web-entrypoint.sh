#!/bin/sh
set -eu

mkdir -p /app/.next/cache /app/storage /app/storage/artworks
chown -R nextjs:nodejs /app/.next /app/storage 2>/dev/null || true

if [ "$#" -eq 0 ]; then
  set -- node server.js
fi

exec su nextjs -s /bin/sh -c 'exec "$0" "$@"' "$@"
