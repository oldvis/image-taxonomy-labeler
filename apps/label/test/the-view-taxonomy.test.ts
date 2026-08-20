import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/services/clustering', () => ({
  clustering: vi.fn(async () => {
    throw new Error('clustering unavailable')
  }),
  findCenters: vi.fn(),
  findCenter: vi.fn(),
}))

vi.mock('~/services/captioning', () => ({
  getCaptions: vi.fn(async () => []),
}))

vi.mock('~/components/VTreeView/VTreeView.vue', () => ({
  default: { name: 'VTreeView', props: ['forest'], template: '<div />' },
}))
vi.mock('~/components/VTreeView/VTreeNode.vue', () => ({
  default: { name: 'VTreeNode', template: '<div />' },
}))

const TheViewTaxonomy = (await import('~/components/TheViewTaxonomy.vue')).default
const { useStore: useWorkspaceStore } = await import('~/stores/workspace')
const { useLabelTask: useLabelTaskWithForest } = await import(
  '~/builtins/label-tasks/taxonomization/useLabelTaskWithForest',
)
const { useLabelTask } = await import(
  '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask',
)

describe('theViewTaxonomy', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const tax = useLabelTask()
    tax.setAll([])
    tax.categories.value = []
    useLabelTaskWithForest().forest.value = []
  })

  it('unlocks Groups after a failed divide', async () => {
    const workspace = useWorkspaceStore()
    workspace.uuidsLoaded = ['u1', 'u2']

    const wrapper = mount(TheViewTaxonomy)

    const divideAll = wrapper.get('button.i-fa6-solid\\:code-fork')
    expect(divideAll.attributes('disabled')).toBeUndefined()
    await divideAll.trigger('click')
    await flushPromises()
    expect(divideAll.attributes('disabled')).toBeUndefined()
  })
})
