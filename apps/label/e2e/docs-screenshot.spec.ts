import type { TaskProgress } from './helpers/readmeCapture'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import {
  imageApiKind,
  loadUuidFileIndex,
  MAINTAINER_OVERVIEW,
  README_UNSURE_COUNT,
  resolveReadmePlate,
  rowMajorAssignGrid,
  SCREENSHOT_OUTPUTS,
  SERVER_IMAGES_DIR,
  SERVER_THUMBNAILS_DIR,
  uniqueSubjects,
  uuidFromImageApiUrl,
  withUnsureClassification,
} from './helpers/readmeCapture'
import {
  captureImageDragClips,
  captureNodeDragClips,
  captureTaxonHoverClip,
} from './helpers/readmeInteractions'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')
fs.mkdirSync(path.join(publicDir, 'assets'), { recursive: true })
const annotationsPath = path.resolve(__dirname, 'fixtures/readme-annotations.json')
const overviewPath = path.join(publicDir, MAINTAINER_OVERVIEW)
const COLUMNS_PAGE_SIZE = 25
const DENSE_PAGE_SIZE = 300

const contentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

const waitDecodedImages = async (
  locator: import('@playwright/test').Locator,
  minCount: number,
) => {
  await expect(locator).toHaveCount(minCount, { timeout: 30_000 })
  const visible = Math.min(12, minCount)
  for (let i = 0; i < visible; i += 1) {
    const img = locator.nth(i)
    await expect.poll(async () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  }
}

test('capture Label README screenshots', async ({ page }) => {
  test.setTimeout(180_000)
  const images = loadUuidFileIndex(SERVER_IMAGES_DIR)
  const thumbnails = fs.existsSync(SERVER_THUMBNAILS_DIR)
    ? loadUuidFileIndex(SERVER_THUMBNAILS_DIR)
    : new Map<string, string>()
  const progress = JSON.parse(fs.readFileSync(annotationsPath, 'utf8')) as TaskProgress[]
  const subjects = uniqueSubjects(
    progress.find((task) => task.taskName === 'Taxonomization')?.annotations ?? [],
  )
  expect(subjects.length, 'VisTaxa sample is 400 labeled plates').toBe(400)
  const missing = subjects.filter((uuid) => resolveReadmePlate(uuid, images, thumbnails) === undefined)
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.length} plates under ${SERVER_IMAGES_DIR} (e.g. ${missing[0]}). `
      + 'Run `uv run python static/setup_samples.py` from server/.',
    )
  }
  const overviewBefore = fs.existsSync(overviewPath)
    ? fs.readFileSync(overviewPath)
    : null
  const payload = withUnsureClassification(progress, README_UNSURE_COUNT)

  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('vueuse-color-scheme', 'light')
    window.localStorage.setItem('user', JSON.stringify({ name: 'Reviewer' }))
  })

  await page.route('**/assignGrid', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204 })
      return
    }
    const posted = JSON.parse(route.request().postData() ?? '{}') as {
      uuids?: string[]
      nRows?: number
      nCols?: number
    }
    const uuids = posted.uuids ?? []
    const nRows = posted.nRows ?? 1
    const nCols = posted.nCols ?? uuids.length
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(rowMajorAssignGrid(uuids, nRows, nCols)),
    })
  })

  await page.route('**/findCenter', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204 })
      return
    }
    const uuids = JSON.parse(route.request().postData() ?? '[]') as string[]
    const uuid = uuids.find((id) => resolveReadmePlate(id, images, thumbnails) !== undefined)
      ?? uuids[0]
      ?? null
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(uuid),
    })
  })

  const fulfillPlate = async (route: import('@playwright/test').Route, uuid: string | undefined) => {
    const kind = imageApiKind(route.request().url()) ?? 'image'
    const filePath = uuid === undefined ? undefined : resolveReadmePlate(uuid, images, thumbnails, kind)
    if (filePath === undefined) {
      await route.fulfill({ status: 404, body: 'missing plate' })
      return
    }
    await route.fulfill({ path: filePath, contentType: contentType(filePath) })
  }

  await page.route('**/*.{jpg,jpeg,png,webp}', async (route) => {
    const url = route.request().url()
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      const uuid = uuidFromImageApiUrl(url)
      if (uuid !== undefined) {
        await fulfillPlate(route, uuid)
        return
      }
      await route.continue()
      return
    }
    await route.abort()
  })

  await page.route(/\/uuids\/[^/]+\/(?:thumbnail|image)(?:\?.*)?$/, async (route) => {
    await fulfillPlate(route, uuidFromImageApiUrl(route.request().url()))
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByText('Hi, Reviewer').waitFor({ state: 'visible', timeout: 30_000 })
  await expect(page.getByText('Set a name in the header')).toHaveCount(0)

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Upload' }).click(),
  ])
  await chooser.setFiles({
    name: 'annotations.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  })

  await page.getByText('Groups').waitFor({ state: 'visible' })
  await page.getByRole('tree').getByText('choropleth map').waitFor({ state: 'visible', timeout: 60_000 })
  await expect(page.getByText('400 in workspace')).toBeVisible({ timeout: 30_000 })
  await waitDecodedImages(page.locator('.grid-cols-3 img'), COLUMNS_PAGE_SIZE)
  const firstPlate = page.locator('.grid-cols-3 img').first()
  await expect.poll(async () => firstPlate.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(400)
  const firstSrc = await firstPlate.evaluate((el) => (el as HTMLImageElement).currentSrc)
  expect(firstSrc, firstSrc).toMatch(/\/image(?:\?.*)?$/)
  await expect(page.getByText('Image failed to load')).toHaveCount(0)
  await expect(page.getByText('served over HTTP')).toHaveCount(0)
  await expect(page.getByText('Dense layout is only available')).toHaveCount(0)
  await page.waitForTimeout(500)

  await page.screenshot({
    path: path.join(publicDir, SCREENSHOT_OUTPUTS.raw),
    type: 'png',
    animations: 'disabled',
  })

  await captureTaxonHoverClip(
    page,
    'map',
    path.join(publicDir, SCREENSHOT_OUTPUTS.hover),
  )
  await captureImageDragClips(
    page,
    'dasymetric map',
    path.join(publicDir, SCREENSHOT_OUTPUTS.dragImageSingle),
    path.join(publicDir, SCREENSHOT_OUTPUTS.dragImageMulti),
  )
  await captureNodeDragClips(
    page,
    'route map',
    'flow map',
    path.join(publicDir, SCREENSHOT_OUTPUTS.dragNodeMove),
    path.join(publicDir, SCREENSHOT_OUTPUTS.dragNodeMerge),
  )

  await page.getByTitle('Grid layout').click()
  await page.locator('[data-uuid]').first().waitFor({ state: 'visible', timeout: 60_000 })
  await expect(page.locator('[data-uuid]')).toHaveCount(DENSE_PAGE_SIZE, { timeout: 60_000 })
  await waitDecodedImages(page.locator('[data-uuid] img'), DENSE_PAGE_SIZE)
  await expect(page.getByText('Dense layout is only available')).toHaveCount(0)
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(publicDir, SCREENSHOT_OUTPUTS.dense),
    type: 'png',
    animations: 'disabled',
  })

  await page.locator('[data-uuid]').first().click()
  await page.getByText('copy metadata').waitFor({ state: 'visible', timeout: 10_000 })
  await page.getByTitle('Sure that the annotation is accurate').waitFor({ state: 'visible' })
  await page.screenshot({
    path: path.join(publicDir, SCREENSHOT_OUTPUTS.tooltip),
    type: 'png',
    animations: 'disabled',
  })

  for (const name of Object.values(SCREENSHOT_OUTPUTS)) {
    expect(fs.existsSync(path.join(publicDir, name)), name).toBe(true)
  }
  const overviewAfter = fs.existsSync(overviewPath)
    ? fs.readFileSync(overviewPath)
    : null
  expect(overviewAfter?.equals(overviewBefore ?? Buffer.alloc(0)) ?? overviewBefore === null).toBe(true)
})
