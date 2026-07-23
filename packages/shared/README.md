# `@image-taxonomy-labeler/shared`

Private workspace package for leaf code shared by `apps/label` and `apps/compare`.

## What belongs here

- API / URL helpers (`services/`)
- Visualization catalog + small plugins (`plugins/`, `assets/visualizations.json`)
- Catalog-backed Pinia store (`stores/visualization.ts`)

Import via subpaths, e.g. `@image-taxonomy-labeler/shared/services/params`.

## What does not

Vue UI, builtins, and app-specific stores stay in each app. The two apps may diverge; do not move SFCs here just because they are currently identical.
