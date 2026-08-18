import type { SubjectsByTaxon } from '~/utils/taxonSubjectIndex'
import { intersection } from 'lodash'
import { describe, expect, it } from 'vitest'
import {
  invertTaxaBySubject,
  overlapCounts,
  uniqueSubjectsForTaxon,
} from '~/utils/taxonSubjectIndex'

const oracleCounts = (
  subjects: string[],
  subjectsByTaxon: SubjectsByTaxon,
): Record<string, number> => {
  const unique = [...new Set(subjects)]
  const out: Record<string, number> = {}
  for (const [taxon, listed] of Object.entries(subjectsByTaxon)) {
    const n = intersection(listed, unique).length
    if (n > 0) out[taxon] = n
  }
  return out
}

describe('taxonSubjectIndex', () => {
  const byUser = {
    a: {
      Map: ['s1', 's2'],
      Viz: ['s1', 's2', 's3'],
      Chart: ['s9'],
    },
    b: {
      Map: ['s1', 's2'],
      Viz: ['s1', 's2', 's3'],
      Chart: ['s9'],
    },
  }

  it('counts unique overlap (duplicate subjects do not inflate the bar)', () => {
    const inverted = invertTaxaBySubject({ Map: ['s1', 's2'] })
    expect(overlapCounts(['s1', 's2', 's1'], inverted).Map).toBe(2)
  })

  it('subjects for Map increment Map and Viz, not Chart', () => {
    const union = {
      Map: ['s1', 's2'],
      Viz: ['s1', 's2', 's3'],
      Chart: ['s9'],
    }
    const subjects = uniqueSubjectsForTaxon(byUser, 'Map')
    expect(new Set(subjects)).toEqual(new Set(['s1', 's2']))
    const counts = overlapCounts(subjects, invertTaxaBySubject(union))
    expect(counts.Map).toBe(2)
    expect(counts.Viz).toBe(2)
    expect(counts.Chart).toBeUndefined()
  })

  it('matches lodash.intersection length for every taxon', () => {
    const subjectsByTaxon: SubjectsByTaxon = {
      Map: ['s1', 's2', 's2'],
      Viz: ['s1', 's2', 's3'],
      Chart: ['s9'],
      Empty: [],
    }
    const subjects = ['s2', 's9', 's2', 's1']
    expect(overlapCounts(subjects, invertTaxaBySubject(subjectsByTaxon)))
      .toEqual(oracleCounts(subjects, subjectsByTaxon))
  })

  it('unions subjects across annotators and keeps per-user counts separate', () => {
    const a: SubjectsByTaxon = { Map: ['s1'], Shared: ['s1'] }
    const b: SubjectsByTaxon = { Map: ['s2'], Shared: ['s2'] }
    const subjects = uniqueSubjectsForTaxon({ a, b }, 'Map')
    expect(new Set(subjects)).toEqual(new Set(['s1', 's2']))
    expect(overlapCounts(subjects, invertTaxaBySubject(a))).toEqual({ Map: 1, Shared: 1 })
    expect(overlapCounts(subjects, invertTaxaBySubject(b))).toEqual({ Map: 1, Shared: 1 })
    expect(overlapCounts(subjects, invertTaxaBySubject({
      Map: ['s1', 's2'],
      Shared: ['s1', 's2'],
    }))).toEqual({ Map: 2, Shared: 2 })
  })

  it('returns no counts for an empty subject list or unknown taxon', () => {
    const inverted = invertTaxaBySubject({ Map: ['s1'] })
    expect(overlapCounts([], inverted)).toEqual({})
    expect(uniqueSubjectsForTaxon(byUser, 'NoSuchTaxon')).toEqual([])
  })

  it('inverts duplicate subject listings to a unique taxon list', () => {
    expect(invertTaxaBySubject({
      Map: ['s1', 's1'],
      Viz: ['s1'],
    })).toEqual({ s1: ['Map', 'Viz'] })
  })

  it('ignores subjects that are on no taxon', () => {
    const inverted = invertTaxaBySubject({ Map: ['s1'] })
    expect(overlapCounts(['missing', 's1'], inverted)).toEqual({ Map: 1 })
  })
})
