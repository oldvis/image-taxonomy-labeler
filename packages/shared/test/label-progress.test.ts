import { describe, expect, it } from 'vitest'
import {
  formatLabelProgressError,
  parseAnnotatorProfileFile,
  parseLabelProgressFile,
} from '../src/plugins/labelProgress.ts'

const classificationAnnotation = {
  type: 'Classification',
  uuid: 'a1',
  subject: 'img-1',
  user: 'ann',
  value: 'Unsure',
  time: '2024-01-01T00:00:00.000Z',
}

const taxonomizationAnnotation = {
  type: 'Taxonomization',
  uuid: 'a2',
  subject: 'img-1',
  user: 'ann',
  value: 'root',
  time: '2024-01-01T00:00:00.000Z',
}

const validFile = [
  {
    taskName: 'Classification',
    categories: ['Sure', 'Unsure'],
    annotations: [classificationAnnotation],
  },
  {
    taskName: 'Taxonomization',
    categories: [{ name: 'root', children: [] }],
    annotations: [taxonomizationAnnotation],
  },
]

describe('parseLabelProgressFile', () => {
  it('accepts a valid label progress export', () => {
    expect(parseLabelProgressFile(validFile)).toEqual(validFile)
  })

  it('accepts a file that contains only one known task', () => {
    expect(parseLabelProgressFile([validFile[0]])).toEqual([validFile[0]])
  })

  it('rejects a non-array root', () => {
    expect(() => parseLabelProgressFile({})).toThrow()
  })

  it('rejects an unknown task name', () => {
    expect(() => parseLabelProgressFile([
      { taskName: 'Other', categories: [], annotations: [] },
    ])).toThrow()
  })

  it('rejects a taxonomization category that is not { name, children }', () => {
    expect(() => parseLabelProgressFile([
      {
        taskName: 'Taxonomization',
        categories: ['root'],
        annotations: [],
      },
    ])).toThrow()
  })

  it('rejects an annotation missing subject', () => {
    const { subject: _, ...rest } = classificationAnnotation
    expect(() => parseLabelProgressFile([
      { taskName: 'Classification', categories: [], annotations: [rest] },
    ])).toThrow()
  })
})

describe('parseAnnotatorProfileFile', () => {
  it('returns both tasks from a valid compare upload', () => {
    const parsed = parseAnnotatorProfileFile(validFile)
    expect(parsed.classification.taskName).toBe('Classification')
    expect(parsed.taxonomization.taskName).toBe('Taxonomization')
    expect(parsed.classification.annotations[0].value).toBe('Unsure')
  })

  it('rejects a file missing Classification', () => {
    expect(() => parseAnnotatorProfileFile([validFile[1]])).toThrow(/Classification/)
  })

  it('rejects a file missing Taxonomization', () => {
    expect(() => parseAnnotatorProfileFile([validFile[0]])).toThrow(/Taxonomization/)
  })
})

describe('formatLabelProgressError', () => {
  it('summarizes the first Zod issue', () => {
    let thrown: unknown
    try {
      parseLabelProgressFile({})
    }
    catch (err) {
      thrown = err
    }
    expect(thrown).toBeDefined()
    expect(formatLabelProgressError(thrown)).toMatch(/array/i)
  })
})
