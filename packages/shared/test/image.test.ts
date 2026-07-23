import { describe, expect, it } from 'vitest'
import { getImageUrl, getThumbnailUrl } from '../src/services/image'

describe('getImageUrl / getThumbnailUrl', () => {
  it('appends the uuid image route', () => {
    expect(getImageUrl('abc')).toMatch(/\/uuids\/abc\/image$/)
  })

  it('appends the uuid thumbnail route', () => {
    expect(getThumbnailUrl('abc')).toMatch(/\/uuids\/abc\/thumbnail$/)
  })
})
