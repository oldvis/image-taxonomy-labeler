import { describe, expect, it } from 'vitest'
import { useForest } from '~/builtins/label-tasks/taxonomization/useForest'

describe('useForest', () => {
  it('moves a non-root node to the root without deleting another root', () => {
    const { forest, addNode, moveNode } = useForest()
    forest.value = []
    addNode('A')
    addNode('B')
    addNode('C', 'A')

    moveNode('C', 'missing-anchor', 'inner')

    expect(forest.value.map((d) => d.name).sort()).toEqual(['A', 'B', 'C'])
    expect(forest.value.find((d) => d.name === 'A')?.children).toEqual([])
  })
})
