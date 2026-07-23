# Contributing

Thanks for being interested in contributing to this project!

## Development

### Setup

This repository is a pnpm workspace (`apps/*`, `packages/*`).

**Frontend** (install once from the repo root):

```bash
pnpm install
pnpm --filter ./apps/label dev
# or: pnpm --filter ./apps/compare dev
```

`@image-taxonomy-labeler/shared` holds leaf API/catalog code only. Vue UI stays in each app because the apps may diverge.

**Backend:**

```bash
cd server
uv sync
uv run python server.py
```

Or use the root helpers: `bash start-label.sh` / `bash start-compare.sh`.

## Code Style

**Frontend** (from the repo root):

```bash
pnpm -r run lint --fix
pnpm -r run typecheck
```

Or target one package: `pnpm --filter ./apps/label run lint --fix`.

**Backend** (from `server/`):

```bash
uv run black .
uv run flake8 .
uv run pytest
```

## Continuous Integration

Pull requests run `.github/workflows/ci.yml`:

- ESLint, `vue-tsc`, and Vitest across the pnpm workspace (both clients + `@image-taxonomy-labeler/shared`)
- `black --check`, `flake8`, and `pytest` for `server/`

Please run the same checks locally before opening a PR.

## Thanks

Thank you again for being interested in this project! You are awesome!
