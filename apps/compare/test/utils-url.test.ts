import { describe, expect, it } from 'vitest'
import { isHttps, isLocalhost } from '../src/builtins/data-display/utils'

describe('isLocalhost', () => {
  it('accepts localhost and 127.0.0.1', () => {
    expect(isLocalhost('http://localhost:5001/uuids/x/image')).toBe(true)
    expect(isLocalhost('http://127.0.0.1:5001/uuids/x/image')).toBe(true)
  })

  it('rejects non-loopback hosts', () => {
    expect(isLocalhost('https://example.com/img')).toBe(false)
    expect(isLocalhost(null)).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isLocalhost('not a url')).toBe(false)
  })
})

describe('isHttps', () => {
  it('detects https', () => {
    expect(isHttps('https://cdn.example/a.jpg')).toBe(true)
    expect(isHttps('http://localhost:5001/a')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isHttps('://bad')).toBe(false)
  })
})
