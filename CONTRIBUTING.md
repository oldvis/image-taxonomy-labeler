# Contributing

Thanks for being interested in contributing to this project!

## Development

### Setup

This repository is a pnpm workspace (`apps/*`, `packages/*`).

From the repo root (`pnpm start:*` starts the shared backend and one app):

```bash
pnpm install
pnpm start:label          # API http://localhost:5001 + label http://localhost:3333
# or: pnpm start:compare  # API http://localhost:5001 + compare http://localhost:3334
```

Requires Node.js 20.19+ or 22.12+ and pnpm 11 (see root `packageManager`).

`@image-taxonomy-labeler/shared` holds leaf API/catalog code only.
`@image-taxonomy-labeler/ui` holds shared label-task helpers and lean presentational widgets.
App chrome (toasts, search widget, screens) stays in each app.

**Client only** (API already running): `pnpm --filter ./apps/label dev` or `pnpm --filter ./apps/compare dev`.

**Backend only:**

```bash
cd server
uv sync
uv run python server.py
```

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

## Latency e2e (Playwright)

Not part of CI. From the repo root:

```bash
pnpm exec playwright install chromium   # once
pnpm test:e2e
```

See [e2e/README.md](./e2e/README.md) for what is measured (Label Sure / taxon assign and Compare hover last-bar / paint at 250ms). Do not fold Label README screenshot capture into this config: that is `pnpm --filter ./apps/label docs:screenshot` (`apps/label/playwright.config.ts`, services on). See [apps/label/README.md](./apps/label/README.md).

## Thanks

Thank you again for being interested in this project! You are awesome!
