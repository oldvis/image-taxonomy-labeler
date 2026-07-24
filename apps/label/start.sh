#!/usr/bin/env bash
# Start script for apps/label with dependency checks
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.19+ or 22.12+ first."
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install workspace dependencies from repo root
if [ ! -d "${ROOT_DIR}/node_modules" ]; then
    echo "Installing workspace dependencies..."
    (cd "${ROOT_DIR}" && pnpm install)
fi

cd "${SCRIPT_DIR}"
echo "Starting apps/label on http://localhost:3333..."
pnpm run dev
