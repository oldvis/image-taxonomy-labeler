import { test } from '@playwright/test'
import {
  assertSamples,
  COMPARE_MAX_MS,
  injectCompareProfiles,
  logLatency,
  measureCompareHoverLatencyMs,
  openCompareApp,
  OVERLAP_TAXA,
  SAMPLES,
  SYNTHETIC_N,
} from './helpers/app'

test.describe('compare hover latency', () => {
  test('logs hover-highlight time on synthetic multi-annotator trees', async ({ page }) => {
    test.setTimeout(300_000)
    await openCompareApp(page)
    await injectCompareProfiles(page)

    await measureCompareHoverLatencyMs(page)

    const firstSamples: number[] = []
    const lastSamples: number[] = []
    const paintSamples: number[] = []
    let extra = ` synthetic_n=${SYNTHETIC_N} overlap_taxa=${OVERLAP_TAXA}`
    for (let i = 0; i < SAMPLES; i += 1) {
      const sample = await measureCompareHoverLatencyMs(page)
      firstSamples.push(sample.firstBarMs)
      lastSamples.push(sample.lastBarMs)
      paintSamples.push(sample.paintMs)
      extra = `${extra.split(' highlight_bars=')[0]} highlight_bars=${sample.highlightBarCount} nodes=${sample.nodeCount}`
    }
    // first-bar / last-bar = DOM width writes (screen still frozen).
    // paint = last write + one frame that draws all highlight bars together.
    logLatency('e2e-compare-hover-latency:first-bar', firstSamples, COMPARE_MAX_MS, extra)
    logLatency('e2e-compare-hover-latency:last-bar', lastSamples, COMPARE_MAX_MS, extra)
    logLatency('e2e-compare-hover-latency:paint', paintSamples, COMPARE_MAX_MS, extra)
    assertSamples(lastSamples, COMPARE_MAX_MS)
    assertSamples(paintSamples, COMPARE_MAX_MS)
  })
})
