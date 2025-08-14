# Assets

This directory stores the dataset used in the interface.

The `visualizations.json` dataset is obtained from [oldvis_dataset](https://github.com/oldvis/oldvis_dataset).

The `visualizations.json` file stores a list of objects, with each object following the `Visualization` data structure ([reference](https://github.com/oldvis/libprocess/blob/main/libprocess/typing.py)) defined below.

```typescript
interface TimePoint {
  year: number
  month?: number
  day?: number
}

interface Source {
  /** The name of the data source where the metadata is collected. */
  name: string
  /** The URL where the metadata is collected. */
  url: string
  /** The time (UTC+0) the entry is saved (in ISO 8601 format). */
  accessDate: string
}

interface Visualization {
  /** The UUID of the metadata entry. */
  uuid: string
  /** The authors of the visualization. Store null if unknown. */
  authors: string[] | null
  /** A short title for display. */
  displayName: string
  /**
   * The time the visualization is published.
   * If the exact time is unknown, can store a time range.
   * Store the year, month, day if known. Store null if unknown.
   */
  publishDate: TimePoint | TimePoint[] | null
  /** The URL where the item can be viewed in a browser. */
  viewUrl: string
  /** The URL where the item can be downloaded with a GET request. */
  downloadUrl: string
  /** The MD5 hash of the image. */
  md5?: string
  /** The perceptual hash of the visualization image. */
  phash?: string
  /** The (width, height) of the image in pixels. */
  resolution?: [number, number]
  /** The storage size of the image in bytes. */
  fileSize?: number
  /** The languages used in the visualization (ISO 639-3 codes). Store null if unknown. */
  languages: string[] | null
  /** The tags of the item to be used for searching. Empty array if none. */
  tags: string[]
  /** A brief description of the visualization. Store null if unknown. */
  abstract: string | null
  /** The copyright status of the image. */
  rights: string
  /** The data source information. */
  source: Source
}
```

## Contents

```
📂assets
 ┣ 📜download.py                    - a script for obtaining `visualizations.json`
 ┣ 📜README.md
 ┗ 📜visualizations.json            - a list of "visualization" entities
```
