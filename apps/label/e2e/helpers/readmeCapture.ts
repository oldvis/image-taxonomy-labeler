import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const helperDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(helperDir, '../../../..')

export const MAINTAINER_OVERVIEW = 'assets/screenshot.png'
export const README_UNSURE_COUNT = 18

export const SERVER_IMAGES_DIR = path.join(repoRoot, 'server/static/images')
export const SERVER_THUMBNAILS_DIR = path.join(repoRoot, 'server/static/thumbnails')

export const SCREENSHOT_OUTPUTS = {
  raw: 'assets/screenshot-raw.png',
  hover: 'assets/screenshot-hover.png',
  dragImageSingle: 'assets/screenshot-drag-image-single.png',
  dragImageMulti: 'assets/screenshot-drag-image-multi.png',
  dragNodeMove: 'assets/screenshot-drag-node-move.png',
  dragNodeMerge: 'assets/screenshot-drag-node-merge.png',
  dense: 'assets/screenshot-dense.png',
  tooltip: 'assets/screenshot-tooltip.png',
} as const

export function rowMajorAssignGrid(
  uuids: string[],
  _nRows: number,
  nCols: number,
): [number, number][] {
  return uuids.map((_, i) => [Math.floor(i / nCols), i % nCols] as [number, number])
}

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

export function withUnsureClassification(
  progress: TaskProgress[],
  n = README_UNSURE_COUNT,
): TaskProgress[] {
  const tax = progress.find((task) => task.taskName === 'Taxonomization')
  const subjects = uniqueSubjects(tax?.annotations ?? []).slice(0, n)
  const classification: TaskProgress = {
    taskName: 'Classification',
    categories: ['Unsure', 'Sure'],
    annotations: subjects.map((subject, i) => ({
      type: 'Classification',
      uuid: `cls-unsure-${i}`,
      subject,
      value: 'Unsure',
      user: 'Reviewer',
      time: '2024-01-01T00:00:00.000Z',
    })),
  }
  return [classification, ...progress.filter((task) => task.taskName !== 'Classification')]
}
