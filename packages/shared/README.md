# `@image-taxonomy-labeler/shared`

Private workspace package for leaf code shared by `apps/label` and `apps/compare`.

## What belongs here

- API / URL helpers (`services/`, including `services/url`)
- Visualization catalog + small plugins (`plugins/`, `assets/visualizations.json`)
- Catalog-backed Pinia store (`stores/visualization.ts`)

Import via subpaths, e.g. `@image-taxonomy-labeler/shared/services/params`.

## What does not

Vue UI and shared builtins belong in `@image-taxonomy-labeler/ui`.
App-specific screens and stores stay in each app.
