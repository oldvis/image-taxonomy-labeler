import { test } from '@playwright/test'
import {
  assertSamples,
  injectLabelSyntheticAnnotations,
  LABEL_MAX_MS,
  logLatency,
  measureSureLatencyMs,
  measureTaxonAssignLatencyMs,
  openLabelApp,
  SAMPLES,
  SYNTHETIC_N,
} from './helpers/app'

test.describe('label click latency', () => {
  test('keeps Sure toggle and taxon assign fast on a large annotation list', async ({ page }) => {
    test.setTimeout(300_000)
    await openLabelApp(page)
    await injectLabelSyntheticAnnotations(page)

    await measureSureLatencyMs(page)

    const sureSamples: number[] = []
    for (let i = 0; i < SAMPLES; i += 1) {
      sureSamples.push(await measureSureLatencyMs(page))
    }
    logLatency('e2e-label-latency:sure', sureSamples, LABEL_MAX_MS, ` synthetic_n=${SYNTHETIC_N}`)
    assertSamples(sureSamples, LABEL_MAX_MS)

    await measureTaxonAssignLatencyMs(page)
    const taxonSamples: number[] = []
    for (let i = 0; i < SAMPLES; i += 1) {
      taxonSamples.push(await measureTaxonAssignLatencyMs(page))
    }
    logLatency('e2e-label-latency:taxon', taxonSamples, LABEL_MAX_MS, ` synthetic_n=${SYNTHETIC_N}`)
    assertSamples(taxonSamples, LABEL_MAX_MS)
  })
})
