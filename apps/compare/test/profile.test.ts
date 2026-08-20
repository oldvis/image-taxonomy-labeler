import { describe, expect, it } from 'vitest'
import { parseAnnotatorProfileFile } from '@image-taxonomy-labeler/shared/plugins/labelProgress'
import { buildAnnotatorProfile } from '~/stores/profile'

const validFile = [
  {
    taskName: 'Classification',
    categories: [],
    annotations: [{
      type: 'Classification',
      uuid: 'a1',
      subject: 'img-1',
      user: 'ann',
      value: 'Unsure',
      time: '2024-01-01T00:00:00.000Z',
    }],
  },
  {
    taskName: 'Taxonomization',
    categories: [{ name: 'root', children: [] }],
    annotations: [{
      type: 'Taxonomization',
      uuid: 'a2',
      subject: 'img-1',
      user: 'ann',
      value: 'root',
      time: '2024-01-01T00:00:00.000Z',
    }],
  },
]

describe('buildAnnotatorProfile', () => {
  it('reads unsure subjects from classification and taxa from taxonomization', () => {
    const profile = buildAnnotatorProfile(
      parseAnnotatorProfileFile(validFile),
      'ann',
    )
    expect(profile.unsureUuids).toEqual(['img-1'])
    expect(profile.annotations.map((d) => d.value)).toEqual(['root'])
    expect(profile.forest.map((d) => d.name)).toEqual(['root'])
  })
})
