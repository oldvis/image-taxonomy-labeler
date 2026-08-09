import { describe, expect, it } from 'vitest'
import {
  DENSE_FULL_IMAGE_MAX,
  denseImageUrl,
} from '~/builtins/data-display/denseImageUrl'

describe('denseImageUrl', () => {
  const uuid = 'abc'
  const downloadUrl = 'https://example.com/full.jpg'

  it('uses full downloadUrl when page count is at the breakpoint', () => {
    expect(denseImageUrl({
      uuid,
      downloadUrl,
      pageCount: DENSE_FULL_IMAGE_MAX,
    })).toBe(downloadUrl)
  })

  it('uses full downloadUrl when page count is below the breakpoint', () => {
    expect(denseImageUrl({
      uuid,
      downloadUrl,
      pageCount: 6,
    })).toBe(downloadUrl)
  })

  it('uses thumbnail when page count is above the breakpoint', () => {
    expect(denseImageUrl({
      uuid,
      downloadUrl,
      pageCount: DENSE_FULL_IMAGE_MAX + 1,
    })).toMatch(/\/uuids\/abc\/thumbnail$/)
  })

  it('returns empty string when uuid is missing', () => {
    expect(denseImageUrl({
      uuid: undefined,
      downloadUrl,
      pageCount: 1,
    })).toBe('')
  })

  it('returns empty string when full-image mode has no downloadUrl', () => {
    expect(denseImageUrl({
      uuid,
      downloadUrl: null,
      pageCount: 1,
    })).toBe('')
  })
})
