# Contributing

Thanks for being interested in contributing to this project!

## Development

### Setup

This repository is a pnpm workspace (`apps/*`, `packages/*`).

**Frontend** (install once from the repo root):

```bash
pnpm install
pnpm --filter ./apps/label dev          # http://localhost:3333
# or: pnpm --filter ./apps/compare dev  # http://localhost:3334
```

Requires Node.js 20.19+ or 22.12+ and pnpm 11 (see root `packageManager`).

`@image-taxonomy-labeler/shared` holds leaf API/catalog code only.
`@image-taxonomy-labeler/ui` holds shared label-task helpers and lean presentational widgets.
App chrome (toasts, search widget, screens) stays in each app.

**Backend:**

```bash
cd server
uv sync
uv run python server.py
```

Or from the repo root: `pnpm run start:label` / `pnpm run start:compare`.

## Code Style

**Frontend** (from the repo root):

```bash
pnpm run lint --fix
pnpm run typecheck
```

Lint uses the root `eslint.config.js`. To scope a path: `pnpm exec eslint apps/label --fix`.

**Backend** (from `server/`):

```bash
uv run black .
uv run flake8 .
uv run pytest
```

## Continuous Integration

Pull requests run `.github/workflows/ci.yml`:

- ESLint (root config), `vue-tsc` / `tsc`, and Vitest across the pnpm workspace (`apps/*` + `packages/shared` + `packages/ui`)
- `black --check`, `flake8`, and `pytest` for `server/`

Please run the same checks locally before opening a PR.

## Thanks

Thank you again for being interested in this project! You are awesome!
