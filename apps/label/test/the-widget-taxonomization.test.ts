import { useLabelTask } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('element-plus/es/components/tree-select/style/css', () => ({}))
vi.mock('element-plus/es/components/checkbox/style/css', () => ({}))
vi.mock('element-plus', () => ({
  ElTreeSelect: {
    name: 'ElTreeSelect',
    props: ['modelValue'],
    template: '<div class="tree-select-stub" />',
  },
  ElCheckbox: { name: 'ElCheckbox', template: '<div />' },
}))

const TheWidgetTaxonomization = (
  await import('~/components/TheWidgetTaxonomization.vue')
).default

describe('theWidgetTaxonomization selected tags', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const tax = useLabelTask()
    tax.setAll([])
    tax.categories.value = [
      { name: 'parent', children: ['leafA', 'leafB'] },
      { name: 'leafA', children: [] },
      { name: 'leafB', children: [] },
    ]
  })

  it('passes the leaf and its ancestors as selected tags', () => {
    const tax = useLabelTask()
    tax.addAnnotation('img-1', 'leafA')

    const wrapper = mount(TheWidgetTaxonomization, {
      props: { uuid: 'img-1' },
    })

    const select = wrapper.getComponent({ name: 'ElTreeSelect' })
    expect(select.props('modelValue')).toEqual(['leafA', 'parent'])
  })
})
