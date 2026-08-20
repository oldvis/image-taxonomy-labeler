import { useLabelTask } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useOperators } from '~/builtins/label-tasks/taxonomization/useOperators'

describe('useOperators unassignTaxon', () => {
  beforeEach(() => {
    const tax = useLabelTask()
    tax.setAll([])
    tax.categories.value = [
      { name: 'parent', children: ['leafA', 'leafB'] },
      { name: 'leafA', children: [] },
      { name: 'leafB', children: [] },
    ]
  })

  it('does not throw when unassigning a parent that is missing some descendant labels', () => {
    const tax = useLabelTask()
    tax.addAnnotation('img-1', 'leafA')
    const { unassignTaxon } = useOperators(ref(['img-1']), ref('ann'))

    expect(() => unassignTaxon('img-1', 'parent')).not.toThrow()
    const values = (tax.annotationsByUuid.value['img-1'] ?? []).map((d) => d.value)
    expect(values).not.toContain('parent')
    expect(values).not.toContain('leafA')
    expect(values).not.toContain('leafB')
  })
})
