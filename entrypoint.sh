#!/bin/sh
set -e
PUID=$(stat -c '%u' /workspace)
PGID=$(stat -c '%g' /workspace)
exec su-exec ${PUID}:${PGID} bun run /app/src/index.ts "$@"
