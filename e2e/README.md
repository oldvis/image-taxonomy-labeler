# Latency e2e

Playwright gesture-to-DOM timings for Taxonomy Label and Taxonomy Compare. Regression gates after the `useCommon` markRaw/swap-pop port and Compare hover-index rewrite — not a full product suite. **Not** in GitHub Actions; run locally. Label README screenshots are a different Playwright project (`pnpm --filter ./apps/label docs:screenshot`).

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

Hot path is `packages/ui` `useCommon`: `shallowRef` + `markRaw` rows, incremental maps, O(1) swap-pop remove (`triggerRef` so Label selectors still update). Callers still `findIndex` the flat list before `removeByIndex` — that scan is outside `useCommon`. Flat-list **order is not significant**. Typical means on this fixture: Sure ~0.3ms, taxon assign ~25ms (see comment on `useCommon`).

## Compare (`compare-hover-latency.spec.ts`)

Injects two synthetic profiles (~12k taxonomization rows, overlapping taxa) into the Pinia `profiles` store. Hover **Map** on one tree; highlight bars grow on the others.

Hover does **not** use `useCommon`. Cold: invert taxon → subjects into subject → taxa (`taxonSubjectIndex.ts`). Hot: unique subjects for the taxon, then fill overlap-count maps once; per-node class/bar is O(1). Do not `lodash.intersection` UUID arrays per node on hover (dissensus bars still intersect per-user lists). Typical last-bar ~3ms, paint ~14ms (see `onNodeHover`).

| Log tag | Meaning | Scored |
| --- | --- | --- |
| `first-bar` | Hover → first highlight `<rect>` `width > 0` **written**. DOM only; the screen has not updated. | No (log only) |
| `last-bar` | Hover → **last** highlight width written. Main-thread stall until Vue finishes patching. | 250ms |
| `paint` | Last write + layout of all positive highlight rects + **one** frame. All bars become visible together. | 250ms |

Do not treat `first-bar` as “time until highlight is visible.” That is `paint` (≈ `last-bar` + one frame). Details live on `CompareHoverLatencyMs` in `helpers/app.ts`.
