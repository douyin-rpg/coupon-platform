#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# On Vercel, use next start; otherwise use custom server
if [ -n "${VERCEL:-}" ]; then
    echo "Starting Next.js on Vercel..."
    exec pnpm next start -p ${PORT:-3000}
else
    PORT=5000
    DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    PORT=${DEPLOY_RUN_PORT} node dist/server.js
fi
