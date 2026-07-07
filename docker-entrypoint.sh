#!/bin/sh
# Apply pending migrations against the external MySQL, then hand off to the
# server (or whatever CMD is). Fails loudly if the DB is unreachable so the
# container restarts instead of serving against an un-migrated schema.
set -e

if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  echo "[entrypoint] prisma migrate deploy ..."
  node node_modules/prisma/build/index.js migrate deploy
else
  echo "[entrypoint] SKIP_MIGRATIONS=1 — skipping migrate deploy"
fi

echo "[entrypoint] starting: $*"
exec "$@"
