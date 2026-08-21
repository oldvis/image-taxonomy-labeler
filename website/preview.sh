#!/usr/bin/env bash
set -euo pipefail

WEBSITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${WEBSITE_DIR}/.." && pwd)"
PORT="${PAGES_PREVIEW_PORT:-4173}"
PREFIX="image-taxonomy-labeler"
PREVIEW_DIR="${ROOT_DIR}/dist"
export NODE_OPTIONS="${NODE_OPTIONS:---max_old_space_size=4096}"

cd "${ROOT_DIR}"

echo "Building apps/label with Pages VITE_BASE..."
VITE_BASE=/image-taxonomy-labeler/label/ pnpm --filter ./apps/label build

echo "Building apps/compare with Pages VITE_BASE..."
VITE_BASE=/image-taxonomy-labeler/compare/ pnpm --filter ./apps/compare build

bash "${WEBSITE_DIR}/assemble.sh"

rm -rf "${PREVIEW_DIR}"
mkdir -p "${PREVIEW_DIR}"
ln -s "${ROOT_DIR}/site" "${PREVIEW_DIR}/${PREFIX}"

echo "Serving assembled site (Ctrl+C to stop)..."
echo "Pages preview: http://127.0.0.1:${PORT}/${PREFIX}/"
python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory "${PREVIEW_DIR}"
