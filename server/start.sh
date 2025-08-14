#!/usr/bin/env bash
# Start script for backend server with dependency checks

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

# Check poetry
if ! command -v poetry &> /dev/null; then
    echo "⚠️  Poetry is not installed. Installing poetry..."
    curl -sSL https://install.python-poetry.org | python3 -
fi

# Install backend dependencies
if [ ! -d ".venv" ]; then
    echo "Installing backend dependencies..."
    poetry install
fi

# Setup server resources (sample images, thumbnails, embeddings)
echo "Setting up server resources (sample images, thumbnails, embeddings)..."
poetry run python static/setup_samples.py

echo "Starting backend server on http://localhost:5001..."
poetry run python server.py
