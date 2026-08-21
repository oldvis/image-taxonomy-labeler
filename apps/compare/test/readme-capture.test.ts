import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseAnnotatorProfileFile } from '@image-taxonomy-labeler/shared/plugins/labelProgress'
import { afterEach, describe, expect, it } from 'vitest'
import {
  dissensusSubjects,
  imageApiKind,
  IMAGES_CAPTURE_ZOOM,
  loadCompareProfiles,
  loadUuidFileIndex,
  MAINTAINER_OVERVIEW,
  PROFILE_USERNAMES,
  resolveReadmePlate,
  SCREENSHOT_OUTPUTS,
  uniqueSubjects,
  uuidFromImageApiUrl,
} from '../e2e/helpers/readmeCapture'

const tmpDirs: string[] = []

afterEach(() => {
  for (const dir of tmpDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

const tmpDir = (): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'compare-readme-plates-'))
  tmpDirs.push(dir)
  return dir
}

describe('screenshot output names', () => {
  it('writes trees and images under assets/ and never the maintainer overview', () => {
    expect(Object.values(SCREENSHOT_OUTPUTS)).toEqual([
      'assets/screenshot-trees.png',
      'assets/screenshot-images.png',
    ])
    expect(Object.values(SCREENSHOT_OUTPUTS)).not.toContain(MAINTAINER_OVERVIEW)
    expect(MAINTAINER_OVERVIEW).toBe('screenshot.png')
    expect(IMAGES_CAPTURE_ZOOM).toBe(1.4)
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

describe('dissensusSubjects', () => {
  it('keeps subjects whose taxon sets differ across profiles', () => {
    const files = [
      {
        username: 'C1',
        tasks: [{
          taskName: 'Taxonomization',
          categories: [],
          annotations: [
            { type: 'Taxonomization', uuid: 'a', subject: 'same', value: 'map' },
            { type: 'Taxonomization', uuid: 'b', subject: 'diff', value: 'map' },
          ],
        }],
      },
      {
        username: 'C2',
        tasks: [{
          taskName: 'Taxonomization',
          categories: [],
          annotations: [
            { type: 'Taxonomization', uuid: 'c', subject: 'same', value: 'map' },
            { type: 'Taxonomization', uuid: 'd', subject: 'diff', value: 'table' },
          ],
        }],
      },
    ]
    expect(dissensusSubjects(files)).toEqual(['diff'])
  })
})

describe('loadCompareProfiles', () => {
  it('loads C1/C2/C3 human fixtures that parse as Compare uploads', () => {
    const profiles = loadCompareProfiles()
    expect(profiles.map((d) => d.username)).toEqual([...PROFILE_USERNAMES])
    for (const profile of profiles) {
      const parsed = parseAnnotatorProfileFile(profile.tasks)
      expect(parsed.classification.taskName).toBe('Classification')
      expect(parsed.taxonomization.taskName).toBe('Taxonomization')
      const users = new Set(
        [...parsed.classification.annotations, ...parsed.taxonomization.annotations]
          .map((row) => row.user)
          .filter((user): user is string => user != null),
      )
      expect([...users]).toEqual([profile.username])
    }
    const subjects = uniqueSubjects(profiles.flatMap((profile) => (
      profile.tasks.find((task) => task.taskName === 'Taxonomization')?.annotations ?? []
    )))
    expect(subjects).toHaveLength(200)
    expect(dissensusSubjects(profiles).length).toBeGreaterThan(0)
  })
})
