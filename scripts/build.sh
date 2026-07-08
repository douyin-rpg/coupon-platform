#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Building the Next.js project..."
pnpm next build

# Only run tsup if not on Vercel (Vercel uses its own serverless functions)
if [ -z "${VERCEL:-}" ]; then
    echo "Bundling server with tsup..."
    pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
fi

echo "Build completed successfully!"
