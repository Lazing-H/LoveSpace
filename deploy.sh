#!/usr/bin/env sh
set -e
echo "=== Building Vue app in qd/ ==="
cd qd && npm install && npm run build && cd ..
echo "=== Deploying to Cloudflare ==="
npx wrangler deploy
