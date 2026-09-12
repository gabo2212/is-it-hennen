#!/usr/bin/env bash
set -euo pipefail
DEST="${1:-/home/gablegoob/Desktop/Skool/is-it-hennen}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DEST"
tar -C "$ROOT" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude='*.webp' \
  -cf - . | tar -C "$DEST" -xf -
echo "Copied project → $DEST"
