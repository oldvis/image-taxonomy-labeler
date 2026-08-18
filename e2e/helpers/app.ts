import type { Page } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tinyPng = path.resolve(__dirname, '../fixtures/tiny.png')

export const SYNTHETIC_N = 12_000
export const OVERLAP_TAXA = 24
export const LABEL_MAX_MS = 250
export const COMPARE_MAX_MS = 1000
export const SAMPLES = 3
export const CATALOG_SIZE = 13511

export async function stubRemoteImages(page: Page): Promise<void> {
  await page.route('**/*.{jpg,jpeg,png,webp}', async (route) => {
    const url = route.request().url()
    if (url.includes('127.0.0.1') || url.includes('localhost')) {
      await route.continue()
      return
    }
    await route.fulfill({ path: tinyPng, contentType: 'image/png' })
  })
}

export async function clearLabelStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('user', JSON.stringify({ name: 'e2e' }))
  })
}

export async function openLabelApp(page: Page): Promise<void> {
  await clearLabelStorage(page)
  await stubRemoteImages(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('button', { name: /Load remaining/ }).waitFor({
    state: 'visible',
    timeout: 180_000,
  })
  await expect(page.getByRole('button', { name: /Load remaining/ })).toContainText(
    String(CATALOG_SIZE),
    { timeout: 180_000 },
  )
  await page.getByRole('button', { name: 'Load 100' }).click()
  await page.getByTitle('Single object layout').click()
  await page.getByTitle('Sure that the annotation is accurate').first().waitFor({
    state: 'visible',
    timeout: 60_000,
  })
}

export async function injectLabelSyntheticAnnotations(page: Page): Promise<void> {
  await page.evaluate(async (n) => {
    const root = document.querySelector('#app') as HTMLElement & {
      __vue_app__?: {
        config: {
          globalProperties: {
            $pinia: { _s: Map<string, { uuidsLoaded: string[] }> }
          }
        }
      }
    }
    const workspace = root.__vue_app__?.config.globalProperties.$pinia._s.get('workspace')
    const loaded = workspace?.uuidsLoaded?.slice() ?? []
    if (loaded.length < 2) throw new Error('need at least two loaded uuids')

    const resourceUrl = (needle: string): string | undefined => (
      performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .find((name) => name.includes(needle))
    )

    const resolvedFrom = async (
      importer: string,
      needle: string,
    ): Promise<string | undefined> => {
      const text = await (await fetch(importer)).text()
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const match = text.match(new RegExp(`from\\s*['"]([^'"]*${escaped}[^'"]*)['"]`))
      const spec = match?.[1]
      if (spec === undefined || spec.includes('@image-taxonomy-labeler')) return undefined
      return new URL(spec, new URL(importer, location.origin)).href
    }

    const classificationUrl = resourceUrl('classification/useLabelTask')
      ?? await resolvedFrom(
        '/src/components/TheWidgetClassification.vue',
        'classification/useLabelTask',
      )
    const taxonomizationUrl = resourceUrl('useLabelTaskWithForest')
      ?? new URL(
        '/src/builtins/label-tasks/taxonomization/useLabelTaskWithForest.ts',
        location.origin,
      ).href
    if (classificationUrl === undefined) {
      throw new Error('classification useLabelTask module URL not found')
    }

    const { useLabelTask: useClassification } = await import(classificationUrl)
    const { useLabelTask: useTaxonomization } = await import(taxonomizationUrl)
    const current = loaded[0]
    const others = loaded.filter((uuid) => uuid !== current)
    const now = '2024-01-01T00:00:00.000Z'
    const classification = []
    const taxonomization = []
    for (let i = 0; i < n; i += 1) {
      const subject = others[i % others.length]
      classification.push({
        type: 'Classification',
        uuid: `synth-cls-${i}`,
        subject,
        user: 'e2e',
        value: 'Unsure',
        time: now,
      })
      taxonomization.push({
        type: 'Taxonomization',
        uuid: `synth-tax-${i}`,
        subject,
        user: 'e2e',
        value: 'new batch',
        time: now,
      })
    }
    useClassification().setAll(classification)
    useTaxonomization().setAll(taxonomization)
    if (useClassification().annotations.value.length < n) {
      throw new Error('classification inject did not stick (wrong module instance?)')
    }
    if (useTaxonomization().annotations.value.length < n) {
      throw new Error('taxonomization inject did not stick (wrong module instance?)')
    }
  }, SYNTHETIC_N)
}

export async function measureSureLatencyMs(page: Page): Promise<number> {
  const button = page.getByTitle('Sure that the annotation is accurate').first()
  await button.waitFor({ state: 'visible' })
  return button.evaluate(async (el) => {
    const start = performance.now()
    const before = el.className
    await new Promise<void>((resolve, reject) => {
      let settled = false
      let timer = 0
      let obs: MutationObserver
      const finish = (error?: Error): void => {
        if (settled) return
        settled = true
        window.clearTimeout(timer)
        obs.disconnect()
        if (error !== undefined) reject(error)
        else resolve()
      }
      obs = new MutationObserver(() => {
        if (el.className !== before) finish()
      })
      timer = window.setTimeout(() => {
        finish(new Error('Timed out waiting for Sure class change'))
      }, 30_000)
      obs.observe(el, { attributes: true, attributeFilter: ['class'] })
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    })
    return performance.now() - start
  })
}

export async function measureTaxonAssignLatencyMs(page: Page): Promise<number> {
  const select = page.locator('.el-select[data-testid="taxon-select"]').first()
  await select.scrollIntoViewIfNeeded()
  await select.waitFor({ state: 'visible' })
  const dropdown = page.locator('.el-select-dropdown:visible, .el-tree-select__popper:visible').last()
  if (!(await dropdown.isVisible().catch(() => false))) {
    await select.click()
  }
  await page.locator('.el-select-dropdown, .el-tree-select__popper').last().waitFor({
    state: 'visible',
    timeout: 10_000,
  })
  const tree = page.locator('.el-tree[data-testid="taxon-select"], .el-select-dropdown .el-tree').last()
  const leaf = tree.locator('.el-tree-node').filter({ hasText: /new batch/ }).first()
  await leaf.waitFor({ state: 'visible', timeout: 10_000 })
  const checkbox = leaf.locator('.el-checkbox').first()
  const before = await checkbox.getAttribute('class') ?? ''
  const t0 = await page.evaluate(() => performance.now())
  await leaf.locator('.el-tree-node__content').click()
  await page.waitForFunction((prev) => {
    const dropdowns = [...document.querySelectorAll('.el-tree-select__popper, .el-select-dropdown')]
    const root = dropdowns.at(-1)
    const nodes = [...(root?.querySelectorAll('.el-tree-node') ?? [])]
    const batch = nodes.find((node) => (node.textContent ?? '').trim().includes('new batch'))
    const box = batch?.querySelector('.el-checkbox')
    return (box?.className ?? '') !== prev
  }, before, { timeout: 30_000 })
  return page.evaluate((start) => performance.now() - start, t0)
}

interface TreeNodeWithUsers {
  name: string
  children: TreeNodeWithUsers[]
  usernames: string[]
}

const treeForUser = (username: string): TreeNodeWithUsers => ({
  name: 'root',
  usernames: [username],
  children: [
    {
      name: 'Viz',
      usernames: [username],
      children: [
        { name: 'Map', usernames: [username], children: [] },
        { name: 'Chart', usernames: [username], children: [] },
        ...Array.from({ length: OVERLAP_TAXA }, (_, i) => ({
          name: `T${i}`,
          usernames: [username],
          children: [] as TreeNodeWithUsers[],
        })),
      ],
    },
  ],
})

export function syntheticCompareProfiles(): unknown[] {
  const n = SYNTHETIC_N
  const half = Math.floor(n / 2)
  const now = '2024-01-01T00:00:00.000Z'
  const mkAnns = (user: string, start: number, count: number, value: string) => {
    const rows = []
    for (let i = 0; i < count; i += 1) {
      rows.push({
        type: 'Taxonomization',
        uuid: `${user}-ann-${start + i}`,
        subject: `subj-${(start + i) % 4000}`,
        user,
        value,
        time: now,
      })
    }
    return rows
  }
  const uniqueSubjects = 4000
  const mkRoot = (user: string) => {
    const rows = []
    for (let i = 0; i < uniqueSubjects; i += 1) {
      rows.push({
        type: 'Taxonomization',
        uuid: `${user}-root-${i}`,
        subject: `subj-${i}`,
        user,
        value: 'root',
        time: now,
      })
    }
    return rows
  }
  const mkOverlap = (user: string) => {
    const rows = []
    for (let t = 0; t < OVERLAP_TAXA; t += 1) {
      for (let i = 0; i < 400; i += 1) {
        rows.push({
          type: 'Taxonomization',
          uuid: `${user}-overlap-${t}-${i}`,
          subject: `subj-${i}`,
          user,
          value: `T${t}`,
          time: now,
        })
      }
    }
    return rows
  }
  return [
    {
      username: 'annotator-a',
      annotations: [
        ...mkAnns('annotator-a', 0, half, 'Map'),
        ...mkAnns('annotator-a', half, half, 'Viz'),
        ...mkRoot('annotator-a'),
        ...mkOverlap('annotator-a'),
      ],
      forest: [treeForUser('annotator-a')],
      unsureUuids: [],
    },
    {
      username: 'annotator-b',
      annotations: [
        ...mkAnns('annotator-b', 0, half, 'Map'),
        ...mkAnns('annotator-b', half, half, 'Viz'),
        ...mkRoot('annotator-b'),
        ...mkOverlap('annotator-b'),
      ],
      forest: [treeForUser('annotator-b')],
      unsureUuids: [],
    },
  ]
}

export async function openCompareApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })
  await stubRemoteImages(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByText('Taxonomies', { exact: true }).waitFor({
    state: 'visible',
    timeout: 60_000,
  })
}

export async function injectCompareProfiles(page: Page): Promise<void> {
  const profiles = syntheticCompareProfiles()
  await page.evaluate((next) => {
    const root = document.querySelector('#app')
    const pinia = root?.__vue_app__?.config?.globalProperties?.$pinia
    const store = pinia?._s?.get('profiles')
    if (store === undefined) throw new Error('profiles store not found')
    store.addProfiles(next)
  }, profiles)
  await page.getByText('annotator-a', { exact: true }).waitFor({ state: 'visible' })
  await page.getByText('annotator-b', { exact: true }).waitFor({ state: 'visible' })
}

const HIGHLIGHT = '4682B4'

/**
 * Hover → highlight timings. These are *not* three sequential paint passes.
 *
 * Vue writes every highlight `<rect width>` on the main thread. The screen
 * stays frozen until that JS yields, then the browser paints **all** bars
 * in one frame. You never see `firstBarMs` on screen.
 *
 * - `firstBarMs`: hover → first highlight rect gets width > 0 (DOM write).
 * - `lastBarMs`: hover → last highlight rect gets width > 0 (DOM write).
 *   This is the stall you notice: overlap work + patching every node.
 * - `paintMs`: hover → that last write, layout of every positive highlight
 *   rect, then one frame. This is “all bars visible”. The gap after
 *   `lastBarMs` is compositor work, not a second walk of the bars.
 */
export interface CompareHoverLatencyMs {
  firstBarMs: number
  lastBarMs: number
  paintMs: number
  highlightBarCount: number
  nodeCount: number
}

export async function measureCompareHoverLatencyMs(page: Page): Promise<CompareHoverLatencyMs> {
  const trees = page.locator('svg')
  await expect(trees).toHaveCount(3, { timeout: 30_000 })
  const source = trees.nth(1).locator('text').filter({ hasText: /^Map$/ }).first()
  await source.waitFor({ state: 'visible' })

  await source.evaluate((el) => {
    el.parentElement?.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
  })
  await page.waitForFunction((token) => {
    const bars = [...document.querySelectorAll('svg rect')].filter((rect) => (
      (rect.getAttribute('class') ?? '').includes(token)
      && Number(rect.getAttribute('width') ?? 0) > 0
    ))
    return bars.length === 0
  }, HIGHLIGHT, { timeout: 10_000 })

  return source.evaluate(async (el, token) => {
    const proto = Element.prototype
    const originalSetAttribute = proto.setAttribute
    let firstBarAt = -1
    let lastBarAt = -1
    // Timestamp every highlight-bar width write. First vs last is DOM patch
    // order, not first-vs-last pixels (the frame has not been painted yet).
    proto.setAttribute = function setAttribute(name: string, value: string): void {
      originalSetAttribute.call(this, name, value)
      if (name !== 'width' || this.tagName !== 'rect') return
      const cls = this.getAttribute('class') ?? ''
      if (!cls.includes(token) || !(Number(value) > 0)) return
      const now = performance.now()
      if (firstBarAt < 0) firstBarAt = now
      lastBarAt = now
    }
    const start = performance.now()
    try {
      el.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window,
      }))
      await Promise.resolve()
      await Promise.resolve()
      const deadline = start + 30_000
      let prevLast = lastBarAt
      while (performance.now() < deadline) {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve())
        })
        if (firstBarAt >= 0 && lastBarAt === prevLast) break
        prevLast = lastBarAt
      }
      if (firstBarAt < 0 || lastBarAt < 0) {
        throw new Error('Timed out waiting for highlight bar width writes')
      }
      const bars = [...document.querySelectorAll('svg rect')].filter((rect) => (
        (rect.getAttribute('class') ?? '').includes(token)
        && Number(rect.getAttribute('width') ?? 0) > 0
      ))
      if (bars.length === 0) throw new Error('no highlight bars with width > 0')
      // Flush layout for every bar that will show, then wait until after
      // this frame paints. One paint covers all bars, not bar-at-a-time.
      for (const rect of bars) {
        rect.getBoundingClientRect()
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          window.setTimeout(resolve, 0)
        })
      })
      const nodeCount = document.querySelectorAll('svg g > text').length
      return {
        firstBarMs: firstBarAt - start,
        lastBarMs: lastBarAt - start,
        paintMs: performance.now() - start,
        highlightBarCount: bars.length,
        nodeCount,
      }
    }
    finally {
      proto.setAttribute = originalSetAttribute
    }
  }, HIGHLIGHT)
}

export function assertSamples(samples: number[], maxMs: number): void {
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  expect(mean).toBeLessThan(maxMs)
  for (const ms of samples) {
    expect(ms).toBeLessThan(maxMs)
  }
}

export function logLatency(tag: string, samples: number[], maxMs: number, extra = ''): void {
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  // eslint-disable-next-line no-console
  console.log(
    `[${tag}] samples_ms=${samples.map((ms) => ms.toFixed(1)).join(',')} `
    + `mean_ms=${mean.toFixed(1)} max_ms=${maxMs}${extra}`,
  )
}
