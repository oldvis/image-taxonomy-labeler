import { describe, expect, it } from 'vitest'
import { computeDenseGridShape } from '../src/services/layout'

describe('computeDenseGridShape', () => {
  it('keeps shrinking rows and cols until the grid just fits n', () => {
    expect(computeDenseGridShape(1)).toEqual({ nRows: 1, nCols: 1 })
    expect(computeDenseGridShape(0)).toEqual({ nRows: 0, nCols: 0 })
    const { nRows, nCols } = computeDenseGridShape(10)
    expect(nRows * nCols).toBeGreaterThanOrEqual(10)
    expect(
      (nRows < 2 || (nRows - 1) * nCols < 10)
      && (nCols < 2 || nRows * (nCols - 1) < 10),
    ).toBe(true)
  })
})
