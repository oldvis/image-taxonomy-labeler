# README screenshot fixtures

`readme-annotations.json` is the VisTaxa export from [oldvis/image-taxonomy](https://github.com/oldvis/image-taxonomy/blob/main/annotations.json) (400 labeled plates). The capture spec uploads it through the real Upload control.

Image binaries are **not** stored here. `pnpm docs:screenshot` reads plates from `server/static/images/` (and thumbnails from `server/static/thumbnails/` when present). Set those up with `uv run python static/setup_samples.py` from `server/`.
