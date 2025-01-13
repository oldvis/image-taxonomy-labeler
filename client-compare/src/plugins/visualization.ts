import { iso6393 } from 'iso-639-3'
import { xor4096 } from 'seedrandom'
import rawVisualizations from '~/assets/visualizations.json'
import { getImageUrl } from '~/services/image'
import { USE_IMAGE_SERVICE } from '~/services/params'
import { randomShuffle } from './random'

interface TimePoint {
  year: number
  month?: number
  day?: number
}

interface RawVisualization {
  uuid: string
  authors: string[] | null
  displayName: string
  publishDate: TimePoint | [TimePoint, TimePoint] | null
  viewUrl: string
  downloadUrl: string
  md5?: string
  phash?: string
  resolution?: [number, number]
  fileSize?: number
  languages: string[]
  tags: string[]
  abstract: string | null
  rights: string
  source: {
    name: string
    url: string
    /** In ISO format */
    accessDate: string
  }
}

export interface Visualization extends Omit<RawVisualization, 'publishDate' | 'languages'> {
  /** Originally stored as { year: number }. Converted to integer. */
  publishDate: number | null
  /** Originally stored in ISO format. Converted to full name. */
  languages: string[]
}

const iso6393ToName: Record<string, string> = {
  ...Object.fromEntries(iso6393.map((d) => [d.iso6393, d.name])),
  sla: 'Slavic',
  pra: 'Prakrit',
  ota: 'Ottoman Turkish',
  ang: 'Old English',
  swa: 'Swahili',
  ell: 'Modern Greek',
}

const getPublishYear = (
  publishDate: TimePoint | [TimePoint, TimePoint] | null,
): number | null => {
  if (publishDate === null) return null
  if (Array.isArray(publishDate)) return publishDate[0].year
  return publishDate.year
}

const getLanguageFullNames = (languages: string[]): string[] => (
  languages?.map((lang: string) => {
    if (lang in iso6393ToName) {
      return iso6393ToName[lang]
    }
    return (new Intl.DisplayNames(['en'], { type: 'language' })).of(lang)
  }).filter((d) => d !== undefined) as string[] ?? []
)

const getDownloadUrl = (d: RawVisualization): string => (
  USE_IMAGE_SERVICE ? getImageUrl(d.uuid) : d.downloadUrl
)

const _visualizations: Visualization[] = (
  rawVisualizations as RawVisualization[]
).map((d) => ({
  ...d,
  publishDate: getPublishYear(d.publishDate),
  languages: getLanguageFullNames(d.languages),
  downloadUrl: getDownloadUrl(d),
}))

// Randomize visualization order with a fixed random seed.
// The randomization ensures the images with different visual designs
// are evenly distributed in different image batches when labeling the images.
const SEED = '0'
const random = xor4096(SEED)
export const visualizations = randomShuffle(_visualizations, random)

// Warm up the image cache by preloading image thumbnails sequentially.
// NOTE: Continuously loading images may cause lag in the interface.
// preloadSequential(visualizations.map((d) => getThumbnailUrl(d.uuid)))
