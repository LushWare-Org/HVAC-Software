#!/usr/bin/env sh
set -eu

if [ -z "${SERVICE:-}" ]; then
  echo "SERVICE env var is required" >&2
  exit 1
fi

APP_DIR="/repo/apps/${SERVICE}"

if [ ! -d "$APP_DIR" ]; then
  echo "Service directory not found: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"
exec pnpm exec prisma migrate deploy