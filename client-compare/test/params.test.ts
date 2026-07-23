import { describe, expect, it } from 'vitest'
import { resolveServiceFlags, resolveBaseUrl } from '../src/services/resolveParams'

describe('resolveBaseUrl', () => {
  it('uses env override when provided', () => {
    expect(resolveBaseUrl('http://127.0.0.1:5001', 'http://example.com')).toBe('http://127.0.0.1:5001')
  })

  it('falls back to default when env empty', () => {
    expect(resolveBaseUrl('', 'http://localhost:5001')).toBe('http://localhost:5001')
    expect(resolveBaseUrl(undefined, 'http://localhost:5001')).toBe('http://localhost:5001')
  })
})

describe('resolveServiceFlags', () => {
  it('forces services off when VITE_USE_SERVICES is false', () => {
    expect(resolveServiceFlags('false', 'http://localhost:3333')).toEqual({
      useImageService: false,
      useAlgorithmService: false,
    })
  })

  it('forces services on when VITE_USE_SERVICES is true', () => {
    expect(resolveServiceFlags('true', 'https://example.com/app/')).toEqual({
      useImageService: true,
      useAlgorithmService: true,
    })
  })

  it('defaults to on for localhost and 127.0.0.1 when unset', () => {
    expect(resolveServiceFlags(undefined, 'http://localhost:3333').useImageService).toBe(true)
    expect(resolveServiceFlags(undefined, 'http://127.0.0.1:3333').useImageService).toBe(true)
  })

  it('defaults to off for non-local pages when unset', () => {
    expect(resolveServiceFlags(undefined, 'https://oldvis.github.io/image-taxonomy-labeler/').useImageService).toBe(false)
  })
})
