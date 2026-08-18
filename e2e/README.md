# Latency e2e

Playwright gesture-to-DOM timings for Taxonomy Label and Taxonomy Compare. This is a **baseline** before rewriting `useCommon` or Compare hover-highlight — not a full product e2e suite. It is **not** in GitHub Actions yet; run it locally.

```bash
pnpm exec playwright install chromium   # once
pnpm test:e2e                           # both projects
pnpm test:e2e -- --project=label
pnpm test:e2e -- --project=compare
```

Vite starts Label on `127.0.0.1:3333` and Compare on `127.0.0.1:3334` with `VITE_USE_SERVICES=false` (no Python server). Remote images are stubbed. Config: `playwright.config.ts`. Helpers: `helpers/app.ts`.

## Label (`label-latency.spec.ts`)

Uses the **bundled** catalog (`packages/shared/assets/visualizations.json`, 13511 entries). After Load 100 + Single layout, injects ~12k synthetic annotations into the classification and taxonomization `useCommon` stores (dynamic import of the same modules the app uses — not Pinia).

| Gesture | Cap |
| --- | --- |
| Sure toggle | 250ms (mean and each of 3 samples) |
| Leaf taxon assign (`new batch`) | 250ms |

Logs: `[e2e-label-latency:sure]` / `[e2e-label-latency:taxon]`.

These paths go through `packages/ui` `useCommon` (`ref` + `splice` / `findIndex`).

## Compare (`compare-hover-latency.spec.ts`)

Injects two synthetic profiles (~12k taxonomization rows, overlapping taxa) into the Pinia `profiles` store. Hover **Map** on one tree; highlight bars grow on the others.

Hover does **not** use `useCommon`. `onNodeHover` scans annotations, then each node runs `lodash.intersection` during render.

| Log tag | Meaning | Scored |
| --- | --- | --- |
| `first-bar` | Hover → first highlight `<rect>` `width > 0` **written**. DOM only; the screen has not updated. | No (log only) |
| `last-bar` | Hover → **last** highlight width written. Main-thread stall (overlap + patching every node). | 1000ms |
| `paint` | Last write + layout of all positive highlight rects + **one** frame. All bars become visible together. | 1000ms |

Do not treat `first-bar` as “time until highlight is visible.” That is `paint` (≈ `last-bar` + one frame). Details live on `CompareHoverLatencyMs` in `helpers/app.ts`.
