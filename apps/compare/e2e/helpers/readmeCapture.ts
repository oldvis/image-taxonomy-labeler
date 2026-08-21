import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const helperDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(helperDir, '../../../..')

/** Annotated README hero (`public/screenshot.png`). Capture must never write this path. */
export const MAINTAINER_OVERVIEW = 'screenshot.png'

export const PROFILE_USERNAMES = ['C1', 'C2', 'C3'] as const

export const SERVER_IMAGES_DIR = path.join(repoRoot, 'server/static/images')
export const SERVER_THUMBNAILS_DIR = path.join(repoRoot, 'server/static/thumbnails')
export const PROFILE_FIXTURES_DIR = path.resolve(helperDir, '../fixtures')

/** VisTaxa batch-2 create-taxonomy exports, shown as C1/C2/C3. */
export const PROFILE_FIXTURES = [
  { username: 'C1', file: 'c1.json' },
  { username: 'C2', file: 'c2.json' },
  { username: 'C3', file: 'c3.json' },
] as const

export const SCREENSHOT_OUTPUTS = {
  trees: 'assets/screenshot-trees.png',
  images: 'assets/screenshot-images.png',
} as const

/** Chrome-equivalent page zoom for the Images shot only (Trees stays at 100%). */
export const IMAGES_CAPTURE_ZOOM = 1.4

export function uuidFromImageApiUrl(url: string): string | undefined {
  const match = url.match(/\/uuids\/([0-9a-f-]+)\/(?:thumbnail|image)(?:\?.*)?$/i)
  return match?.[1]
}

export function loadUuidFileIndex(dir: string): Map<string, string> {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`images directory not found: ${dir}`)
  }
  const index = new Map<string, string>()
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name)
    if (!fs.statSync(filePath).isFile()) continue
    index.set(name.split('.')[0], filePath)
  }
  return index
}

export function resolveReadmePlate(
  uuid: string,
  images: Map<string, string>,
  thumbnails: Map<string, string> = new Map(),
  kind: 'image' | 'thumbnail' = 'image',
): string | undefined {
  if (kind === 'thumbnail') return thumbnails.get(uuid) ?? images.get(uuid)
  return images.get(uuid)
}

export function imageApiKind(url: string): 'image' | 'thumbnail' | undefined {
  const match = url.match(/\/uuids\/[0-9a-f-]+\/(thumbnail|image)(?:\?.*)?$/i)
  if (match?.[1] === undefined) return undefined
  return match[1].toLowerCase() as 'image' | 'thumbnail'
}

export function uniqueSubjects(rows: Array<{ subject: string }>): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const row of rows) {
    if (seen.has(row.subject)) continue
    seen.add(row.subject)
    ordered.push(row.subject)
  }
  return ordered
}

export interface TaskProgress {
  taskName: string
  categories: unknown[]
  annotations: Array<{
    type: string
    uuid: string
    subject: string
    value: string
    user?: string | null
    time?: string
  }>
}

export interface CaptureProfileFile {
  username: string
  tasks: TaskProgress[]
}

const sameTaxa = (a: string[], b: string[]): boolean => {
  const left = new Set(a)
  const right = new Set(b)
  if (left.size !== right.size) return false
  for (const value of left) {
    if (!right.has(value)) return false
  }
  return true
}

/** Subjects whose taxon sets are not identical across the annotators who labeled them. */
export function dissensusSubjects(files: CaptureProfileFile[]): string[] {
  const taxaByUuidByUsername: Record<string, Record<string, string[]>> = {}
  for (const file of files) {
    const tax = file.tasks.find((task) => task.taskName === 'Taxonomization')
    for (const annotation of tax?.annotations ?? []) {
      if (!taxaByUuidByUsername[annotation.subject]) {
        taxaByUuidByUsername[annotation.subject] = {}
      }
      const byUser = taxaByUuidByUsername[annotation.subject]
      if (!byUser[file.username]) byUser[file.username] = [annotation.value]
      else byUser[file.username].push(annotation.value)
    }
  }
  return Object.entries(taxaByUuidByUsername)
    .filter(([, byUser]) => {
      const first = Object.values(byUser)[0]
      return !Object.values(byUser).every((taxa) => sameTaxa(taxa, first))
    })
    .map(([uuid]) => uuid)
}

export function loadCompareProfiles(): CaptureProfileFile[] {
  return PROFILE_FIXTURES.map(({ username, file }) => {
    const filePath = path.join(PROFILE_FIXTURES_DIR, file)
    const tasks = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TaskProgress[]
    return { username, tasks }
  })
}
