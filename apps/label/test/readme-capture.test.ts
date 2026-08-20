import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  imageApiKind,
  loadUuidFileIndex,
  MAINTAINER_OVERVIEW,
  README_UNSURE_COUNT,
  resolveReadmePlate,
  rowMajorAssignGrid,
  SCREENSHOT_OUTPUTS,
  uniqueSubjects,
  uuidFromImageApiUrl,
  withUnsureClassification,
} from '../e2e/helpers/readmeCapture'

const tmpDirs: string[] = []

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

const tmpDir = (): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'readme-plates-'))
  tmpDirs.push(dir)
  return dir
}

describe('rowMajorAssignGrid', () => {
  it('returns [row, col] in uuid order for a 2x3 grid', () => {
    expect(rowMajorAssignGrid(['a', 'b', 'c', 'd', 'e', 'f'], 2, 3)).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ])
  })
})

describe('uuidFromImageApiUrl', () => {
  it('parses thumbnail and image routes', () => {
    const uuid = 'e9c8e12a-e098-5cec-9ce5-d2af73930426'
    expect(uuidFromImageApiUrl(`http://localhost:5001/uuids/${uuid}/thumbnail`)).toBe(uuid)
    expect(uuidFromImageApiUrl(`http://localhost:5001/uuids/${uuid}/image`)).toBe(uuid)
    expect(imageApiKind(`http://localhost:5001/uuids/${uuid}/thumbnail`)).toBe('thumbnail')
    expect(imageApiKind(`http://localhost:5001/uuids/${uuid}/image`)).toBe('image')
  })

  it('returns undefined for unrelated URLs', () => {
    expect(uuidFromImageApiUrl('https://media.davidrumsey.com/foo.jpg')).toBeUndefined()
  })
})

describe('screenshot output names', () => {
  it('writes raw, interaction clips, dense, tooltip and never the maintainer overview', () => {
    expect(Object.values(SCREENSHOT_OUTPUTS)).toEqual([
      'assets/screenshot-raw.png',
      'assets/screenshot-hover.png',
      'assets/screenshot-drag-image-single.png',
      'assets/screenshot-drag-image-multi.png',
      'assets/screenshot-drag-node-move.png',
      'assets/screenshot-drag-node-merge.png',
      'assets/screenshot-dense.png',
      'assets/screenshot-tooltip.png',
    ])
    expect(Object.values(SCREENSHOT_OUTPUTS)).not.toContain(MAINTAINER_OVERVIEW)
    expect(MAINTAINER_OVERVIEW).toBe('assets/screenshot.png')
  })
})

describe('loadUuidFileIndex', () => {
  it('maps filename stem to path, including jpeg', () => {
    const dir = tmpDir()
    fs.writeFileSync(path.join(dir, 'aaa.jpg'), 'a')
    fs.writeFileSync(path.join(dir, 'bbb.jpeg'), 'b')
    const index = loadUuidFileIndex(dir)
    expect(index.get('aaa')).toBe(path.join(dir, 'aaa.jpg'))
    expect(index.get('bbb')).toBe(path.join(dir, 'bbb.jpeg'))
  })

  it('throws when the directory is missing', () => {
    expect(() => loadUuidFileIndex(path.join(tmpDir(), 'nope'))).toThrow(/not found/)
  })
})

describe('resolveReadmePlate', () => {
  it('serves the full image for image routes even when a thumbnail exists', () => {
    const images = new Map([['u1', '/images/u1.jpg']])
    const thumbs = new Map([['u1', '/thumbs/u1.jpg']])
    expect(resolveReadmePlate('u1', images, thumbs, 'image')).toBe('/images/u1.jpg')
  })

  it('serves the thumbnail for thumbnail routes', () => {
    const images = new Map([['u1', '/images/u1.jpg']])
    const thumbs = new Map([['u1', '/thumbs/u1.jpg']])
    expect(resolveReadmePlate('u1', images, thumbs, 'thumbnail')).toBe('/thumbs/u1.jpg')
  })

  it('falls back to the full image when no thumbnail exists', () => {
    const images = new Map([['u1', '/images/u1.jpg']])
    expect(resolveReadmePlate('u1', images, new Map(), 'thumbnail')).toBe('/images/u1.jpg')
  })
})

describe('uniqueSubjects', () => {
  it('keeps first-seen order', () => {
    expect(uniqueSubjects([
      { subject: 'a' },
      { subject: 'b' },
      { subject: 'a' },
    ])).toEqual(['a', 'b'])
  })
})

describe('withUnsureClassification', () => {
  it('prepends Unsure marks for the first N unique subjects', () => {
    const progress = [
      {
        taskName: 'Taxonomization',
        categories: [{ name: 'root', children: [] }],
        annotations: [
          { type: 'Taxonomization', uuid: 't1', subject: 's1', value: 'root' },
          { type: 'Taxonomization', uuid: 't2', subject: 's2', value: 'root' },
          { type: 'Taxonomization', uuid: 't3', subject: 's1', value: 'map' },
        ],
      },
    ]
    const next = withUnsureClassification(progress, 1)
    expect(README_UNSURE_COUNT).toBe(18)
    expect(next[0]?.taskName).toBe('Classification')
    expect(next[0]?.annotations).toEqual([
      expect.objectContaining({ subject: 's1', value: 'Unsure', type: 'Classification' }),
    ])
    expect(next[1]?.taskName).toBe('Taxonomization')
  })
})
