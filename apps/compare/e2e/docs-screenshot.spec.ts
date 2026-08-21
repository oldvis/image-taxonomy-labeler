import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import {
  dissensusSubjects,
  imageApiKind,
  IMAGES_CAPTURE_ZOOM,
  loadCompareProfiles,
  loadUuidFileIndex,
  MAINTAINER_OVERVIEW,
  resolveReadmePlate,
  SCREENSHOT_OUTPUTS,
  SERVER_IMAGES_DIR,
  SERVER_THUMBNAILS_DIR,
  uniqueSubjects,
  uuidFromImageApiUrl,
} from './helpers/readmeCapture'

// Opt-in README capture (`pnpm docs:screenshot`).
// Seed light theme, stub plates from server/static/images, upload C1/C2/C3
// (VisTaxa batch-2 human exports), then: Trees overview → Images + Dissensus.
// Viewport 1440×900. Never writes public/screenshot.png.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')
fs.mkdirSync(path.join(publicDir, 'assets'), { recursive: true })
const overviewPath = path.join(publicDir, MAINTAINER_OVERVIEW)

const contentType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

test('capture Compare README screenshots', async ({ page }) => {
  test.setTimeout(180_000)
  const images = loadUuidFileIndex(SERVER_IMAGES_DIR)
  const thumbnails = fs.existsSync(SERVER_THUMBNAILS_DIR)
    ? loadUuidFileIndex(SERVER_THUMBNAILS_DIR)
    : new Map<string, string>()
  const profiles = loadCompareProfiles()
  const subjects = uniqueSubjects(profiles.flatMap((profile) => (
    profile.tasks.find((task) => task.taskName === 'Taxonomization')?.annotations ?? []
  )))
  const dissensus = dissensusSubjects(profiles)
  expect(subjects.length, 'batch-2 create-taxonomy set is 200 plates').toBe(200)
  expect(dissensus.length).toBeGreaterThan(0)
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

  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('vueuse-color-scheme', 'light')
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
  await page.getByRole('button', { name: 'Trees' }).waitFor({ state: 'visible', timeout: 30_000 })
  await expect(page.getByText('Please upload annotations')).toBeVisible()

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Upload' }).click(),
  ])
  await chooser.setFiles(profiles.map((profile) => ({
    name: profile.username,
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(profile.tasks)),
  })))

  await expect(page.getByText('Please upload annotations')).toHaveCount(0, { timeout: 60_000 })
  await expect(page.getByText('3 profiles')).toBeVisible()
  await expect(page.getByText(`labeled ${subjects.length}`)).toBeVisible()
  await expect(page.getByText(`dissensus ${dissensus.length}`)).toBeVisible()
  await expect(page.getByText('C1', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('C2', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('C3', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trees' })).toHaveClass(/pill-on/)
  await expect(page.getByRole('button', { name: 'Images' })).not.toHaveClass(/pill-on/)
  await expect(page.getByRole('button', { name: 'Dissensus' })).not.toHaveClass(/pill-on/)
  await expect(page.getByRole('button', { name: 'Consensus' })).not.toHaveClass(/pill-on/)
  await expect(page.getByRole('button', { name: 'Unsure' })).not.toHaveClass(/pill-on/)
  await page.waitForTimeout(500)

  await page.screenshot({
    path: path.join(publicDir, SCREENSHOT_OUTPUTS.trees),
    type: 'png',
    animations: 'disabled',
  })

  await page.getByRole('button', { name: 'Images' }).click()
  await page.getByRole('button', { name: 'Dissensus' }).click()
  await expect(page.getByRole('button', { name: 'Images' })).toHaveClass(/pill-on/)
  await expect(page.getByRole('button', { name: 'Dissensus' })).toHaveClass(/pill-on/)
  await expect(page.getByText(`${dissensus.length} matched`)).toBeVisible()
  const plate = page.locator('img.object-contain').first()
  await expect.poll(async () => plate.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  const src = await plate.evaluate((el) => (el as HTMLImageElement).currentSrc)
  expect(src, src).toMatch(/\/image(?:\?.*)?$/)
  await expect(page.getByText('Image failed to load')).toHaveCount(0)
  await expect(page.locator('span.text-\\#c65319').first()).toBeVisible()
  await page.evaluate((zoom) => {
    document.documentElement.style.zoom = String(zoom)
  }, IMAGES_CAPTURE_ZOOM)
  await page.waitForTimeout(500)

  await page.screenshot({
    path: path.join(publicDir, SCREENSHOT_OUTPUTS.images),
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
