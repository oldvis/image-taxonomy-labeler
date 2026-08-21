# Website

The GitHub Pages site for OldVis image taxonomy labeler ([live demo](https://oldvis.github.io/image-taxonomy-labeler/)).

`index.html` is a static landing page.

The landing has no Vite/Vue build. On push to `main`, `.github/workflows/gh-pages.yml` builds the two apps, then `assemble.sh` copies this page plus `apps/label/dist` and `apps/compare/dist` into a `site/` tree. That tree is uploaded with `upload-pages-artifact` and published by `deploy-pages`. `site/` is gitignored.

Server features are disabled in the live demos. For the full-fledged apps, see the [repository README](../README.md#how-to-use-the-taxonomy-labeling-interface).

## How to Use

From the **repository root** (this package is part of the pnpm workspace):

```bash
pnpm install
pnpm --filter ./website preview
```

That builds both apps with the Pages `VITE_BASE` values, assembles `site/`, and serves it at `http://127.0.0.1:4173/image-taxonomy-labeler/`.

`PAGES_PREVIEW_PORT` overrides the port (default `4173`, so it does not collide with label `3333`, compare `3334`, or the API `5001`).

## For Developers

From the repository root:

| Command | Description |
| --- | --- |
| `pnpm --filter ./website preview` | Build apps, assemble `site/`, serve a Pages-faithful preview |
| `pnpm --filter ./website assemble` | Copy landing + app `dist` folders into `site/` (apps must already be built) |
| `pnpm --filter ./website test` | Run landing and workflow contract tests |

GitHub Pages CI sets:

- label `VITE_BASE=/image-taxonomy-labeler/label/`
- compare `VITE_BASE=/image-taxonomy-labeler/compare/`

Local `pnpm dev` for those apps still uses `VITE_BASE=/`.

`assemble.sh` copies each app `index.html` to `404.html` so GitHub Pages can recover client-side routes. The local `python3 -m http.server` preview serves app roots and assets; it does not apply that 404 fallback.

### Pages source

One-time, after the Actions workflow is on `main`: **Settings → Pages → Build and deployment → Source = GitHub Actions**. Until that is set, the workflow can build while Pages still serves the old `gh-pages` branch.

After Actions deploys successfully, the unused remote `gh-pages` branch can be deleted.
