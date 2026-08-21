# Compare README screenshot fixtures

Three VisTaxa batch-2 create-taxonomy exports, uploaded as **C1 / C2 / C3**:

| Label | File |
| --- | --- |
| C1 | `c1.json` |
| C2 | `c2.json` |
| C3 | `c3.json` |

Image binaries are **not** stored here. `pnpm docs:screenshot` reads plates from `server/static/images/` (and thumbnails from `server/static/thumbnails/` when present). Set those up with `uv run python static/setup_samples.py` from `server/`.
