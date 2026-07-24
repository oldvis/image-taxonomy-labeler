import { describe, expect, it } from 'vitest'
import { generateUniqueName } from '../src/builtins/label-tasks/taxonomization/uniqueName'

describe('generateUniqueName', () => {
  it('returns base when free', () => {
    expect(generateUniqueName(['a'], 'b')).toBe('b')
  })
  it('suffixes (2) when base taken', () => {
    expect(generateUniqueName(['foo'], 'foo')).toBe('foo (2)')
  })
  it('fills gaps', () => {
    expect(generateUniqueName(['foo', 'foo (2)', 'foo (4)'], 'foo')).toBe('foo (3)')
  })
  it('escapes regex metacharacters in name', () => {
    expect(generateUniqueName(['a+b'], 'a+b')).toBe('a+b (2)')
  })
})
