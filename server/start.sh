#!/usr/bin/env bash
# Start script for backend server with dependency checks
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

# Check Python 3.10+
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+ first."
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
REQUIRED_PYTHON="3.10"
if [[ $(echo -e "$PYTHON_VERSION\n$REQUIRED_PYTHON" | sort -V | head -n1) != "$REQUIRED_PYTHON" ]]; then
    echo "❌ Python $REQUIRED_PYTHON+ is required. Found Python $PYTHON_VERSION."
    exit 1
fi

# Ensure uv is available
if ! command -v uv &> /dev/null; then
    echo "⚠️  uv is not installed. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="${HOME}/.local/bin:${PATH}"
fi
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not on PATH after install. Add ~/.local/bin to PATH and retry."
    exit 1
fi

echo "Syncing backend dependencies with uv..."
uv sync

echo "Setting up server resources (sample images, thumbnails, embeddings)..."
uv run python static/setup_samples.py
echo "✅ Server resources setup completed successfully."

echo "Starting backend server on http://localhost:5001..."
uv run python server.py
