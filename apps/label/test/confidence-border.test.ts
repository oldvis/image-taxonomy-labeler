import { describe, expect, it } from 'vitest'
import {
  confidenceBorderStyle,
  getConfidenceBorderStatus,
} from '../src/builtins/data-display/confidenceBorder'

describe('getConfidenceBorderStatus', () => {
  it('returns unlabeled when values are missing or empty', () => {
    expect(getConfidenceBorderStatus(undefined)).toBe('unlabeled')
    expect(getConfidenceBorderStatus(null)).toBe('unlabeled')
    expect(getConfidenceBorderStatus([])).toBe('unlabeled')
  })

  it('returns sure when Sure is present', () => {
    expect(getConfidenceBorderStatus(['Sure'])).toBe('sure')
  })

  it('returns unsure when Unsure is present', () => {
    expect(getConfidenceBorderStatus(['Unsure'])).toBe('unsure')
  })

  it('prefers sure if both somehow appear', () => {
    expect(getConfidenceBorderStatus(['Unsure', 'Sure'])).toBe('sure')
  })

  it('ignores non-confidence values', () => {
    expect(getConfidenceBorderStatus(['SomeTaxon'])).toBe('unlabeled')
  })
})

describe('confidenceBorderStyle', () => {
  it('uses three distinct inset rings', () => {
    expect(confidenceBorderStyle('unlabeled')).toEqual({
      boxShadow: 'inset 0 0 0 1px #e5e7eb',
    })
    expect(confidenceBorderStyle('unlabeled', true)).toEqual({
      boxShadow: 'inset 0 0 0 1px #374151',
    })
    expect(confidenceBorderStyle('unsure')).toEqual({
      boxShadow: 'inset 0 0 0 3px #6b7280',
    })
    expect(confidenceBorderStyle('sure')).toEqual({
      boxShadow: 'inset 0 0 0 3px #0284c7',
    })
  })
})
