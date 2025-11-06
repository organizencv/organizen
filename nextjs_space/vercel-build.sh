
#!/bin/bash
set -e

echo "=== VERCEL BUILD START ==="
echo "DATABASE_URL presente: $([ ! -z "$DATABASE_URL" ] && echo "YES" || echo "NO")"

echo "=== PRISMA DB PUSH ==="
yarn prisma db push --accept-data-loss --skip-generate || {
  echo "⚠️  DB Push failed, continuing anyway..."
}

echo "=== PRISMA GENERATE ==="
yarn prisma generate

echo "=== NEXT BUILD ==="
yarn next build

echo "=== BUILD COMPLETE ==="
