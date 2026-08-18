import { expect, test } from '@playwright/test'
import {
  highlightBarWidth,
  hoverCompareTaxon,
  injectCompareProfiles,
  leaveCompareTaxon,
  openCompareApp,
} from './helpers/app'

const TREES = [0, 1, 2] as const

test.describe('compare hover highlight', () => {
  test('Map hover highlights overlapping taxa, not Chart, and leave clears bars', async ({ page }) => {
    test.setTimeout(120_000)
    await openCompareApp(page)
    await injectCompareProfiles(page)

    await hoverCompareTaxon(page, 1, 'Map')
    await expect.poll(() => highlightBarWidth(page, 1, 'Map')).toBeGreaterThan(0)

    for (const svg of TREES) {
      expect(await highlightBarWidth(page, svg, 'Map')).toBeGreaterThan(0)
      expect(await highlightBarWidth(page, svg, 'T0')).toBeGreaterThan(0)
      expect(await highlightBarWidth(page, svg, 'Chart')).toBe(0)
    }

    await leaveCompareTaxon(page, 1, 'Map')
    await expect.poll(() => highlightBarWidth(page, 1, 'Map')).toBe(0)
    for (const svg of TREES) {
      expect(await highlightBarWidth(page, svg, 'Map')).toBe(0)
      expect(await highlightBarWidth(page, svg, 'T0')).toBe(0)
      expect(await highlightBarWidth(page, svg, 'Chart')).toBe(0)
    }
  })

  test('hovering Chart (no annotations) does not highlight any bar', async ({ page }) => {
    test.setTimeout(120_000)
    await openCompareApp(page)
    await injectCompareProfiles(page)

    await hoverCompareTaxon(page, 1, 'Chart')
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
      })
    }))
    for (const svg of TREES) {
      expect(await highlightBarWidth(page, svg, 'Map')).toBe(0)
      expect(await highlightBarWidth(page, svg, 'Chart')).toBe(0)
      expect(await highlightBarWidth(page, svg, 'T0')).toBe(0)
    }
  })
})
