# Contributing

Thanks for being interested in contributing to this project!

## Development

### Setup

This repository is a multi-package project (no root `package.json`).

**Frontend (pick one client):**

```bash
cd client-label   # or client-compare
pnpm install
pnpm run dev
```

**Backend:**

```bash
cd server
uv sync
uv run python server.py
```

Or use the root helpers: `bash start-label.sh` / `bash start-compare.sh`.

## Code Style

**Frontend** (from the client directory):

```bash
pnpm run lint --fix
pnpm run typecheck
```

**Backend** (from `server/`):

```bash
uv run black .
uv run flake8 .
uv run pytest
```

## Thanks

Thank you again for being interested in this project! You are awesome!
