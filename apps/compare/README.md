# Taxonomy Comparison Interface

![](./public/screenshot.png)

The `taxonomy comparison interface` of OldVis image taxonomy labeler.

The user can compare the taxonomy labels (exported from the `taxonomy labeling interface`) of multiple annotators.

The code in this subdirectory is initialized with the [Vitesse-lite template](https://github.com/antfu/vitesse-lite).

## How to Use

From the **repository root** (this app is part of the pnpm workspace):

```bash
pnpm install
pnpm --filter ./apps/compare dev
```

If you see your browser automatically opening the page `http://localhost:3333/`, the client is successfully launched 🚀.

### Environment

Copy `.env.example` to `.env` if you need non-default settings:

- `VITE_API_BASE` — backend origin (default `http://localhost:5001`)
- `VITE_USE_SERVICES` — `true` / `false` / unset (see `.env.example`)

Unset is fine locally (services on for localhost). GitHub Pages leaves services off.

The annotations to be compared can be exported from the [taxonomy labeling interface](../label/).

The annotations to be compared can be obtained from [2025.VisTaxa.coding](https://github.com/zhangyu94/2025.VisTaxa.coding).

## Features

- **Highlight** image overlap
    - semantics: highlight the proportion of overlapping images
    - interaction: hovering over the node or bar corresponding to a taxon
    - effect: creates an overlaying bar for all annotators' all taxa with overlapping images, with the bar's width proportional to the number of overlapping images
- **Filter** images by a taxon
    - semantics: show the images belonging to a taxon $c$ in the merged tree
    - interaction: click on the node or bar corresponding to a taxon
