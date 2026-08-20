import { useCommon } from '@image-taxonomy-labeler/ui/label-tasks/useCommon'
import { describe, expect, it } from 'vitest'
import { isReactive } from 'vue'

const row = (uuid: string, subject: string, value: string) => ({
  type: 'Classification',
  uuid,
  subject,
  user: 'e2e',
  value,
  time: '2024-01-01T00:00:00.000Z',
})

describe('useCommon', () => {
  it('removeByIndex swap-pops the flat list (order is not significant)', () => {
    const { addOne, removeByIndex, annotations } = useCommon()
    addOne(row('a', 's1', 'Sure'))
    addOne(row('b', 's2', 'Sure'))
    addOne(row('c', 's3', 'Sure'))
    removeByIndex(0)
    expect(annotations.value.map((d) => d.uuid)).toEqual(['c', 'b'])
  })

  it('does not deep-proxy stored annotation rows', () => {
    const { addOne, annotations } = useCommon()
    addOne(row('a', 's1', 'Sure'))
    expect(isReactive(annotations.value[0])).toBe(false)
  })

  it('removeByIndex still drops the row from subject and value maps', () => {
    const { addOne, removeByIndex, annotationsByUuid, annotationsByValue, isAnnotated } = useCommon()
    addOne(row('a', 's1', 'Sure'))
    addOne(row('b', 's1', 'Unsure'))
    removeByIndex(0)
    expect(annotationsByUuid.value.s1?.map((d) => d.uuid)).toEqual(['b'])
    expect(annotationsByValue.value.Sure).toBeUndefined()
    expect(isAnnotated('s1')).toBe(true)
  })

  it('renameValue rebuilds value-index rows with the new value', () => {
    const { addOne, renameValue, annotations, annotationsByValue } = useCommon()
    addOne(row('a', 's1', 'leafA'))
    addOne(row('b', 's2', 'leafA'))
    addOne(row('c', 's3', 'leafB'))
    renameValue('leafA', 'renamed')
    expect(annotationsByValue.value.leafA).toBeUndefined()
    expect(annotationsByValue.value.renamed?.map((d) => d.value)).toEqual(['renamed', 'renamed'])
    expect(annotationsByValue.value.renamed?.map((d) => d.uuid)).toEqual(['a', 'b'])
    expect(annotations.value.filter((d) => d.uuid === 'a' || d.uuid === 'b').every((d) => d.value === 'renamed')).toBe(true)
    expect(annotationsByValue.value.leafB?.map((d) => d.uuid)).toEqual(['c'])
  })
})
