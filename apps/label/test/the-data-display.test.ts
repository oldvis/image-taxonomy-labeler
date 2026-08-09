import { useStore as useVisualizationStore } from '@image-taxonomy-labeler/shared/stores/visualization'
import { useLabelTask as useClassification } from '@image-taxonomy-labeler/ui/label-tasks/classification/useLabelTask'
import { useLabelTask as useTaxonomization } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@image-taxonomy-labeler/ui/components/VPagination.vue', () => ({
  default: {
    name: 'VPagination',
    props: ['modelValue', 'pageCount'],
    template: '<div class="v-pagination-stub" />',
  },
}))

vi.mock('~/builtins/data-display/columns/VBody.vue', () => ({
  default: { name: 'VColumnsBody', template: '<div />' },
}))
vi.mock('~/builtins/data-display/grid/VBody.vue', () => ({
  default: { name: 'VGridBody', template: '<div />' },
}))
vi.mock('~/builtins/data-display/single-object/VBody.vue', () => ({
  default: { name: 'VSingleObjectBody', template: '<div />' },
}))
vi.mock('~/components/TheDataDisplayHeader.vue', () => ({
  default: { name: 'TheDataDisplayHeader', template: '<div />' },
}))

const TheDataDisplay = (await import('~/components/TheDataDisplay.vue')).default
const { useStore: useWorkspaceStore } = await import('~/stores/workspace')

const makeViz = (uuid: string) => ({
  uuid,
  authors: null,
  displayName: uuid,
  publishDate: null,
  viewUrl: `https://example.com/${uuid}`,
  downloadUrl: `https://example.com/${uuid}.jpg`,
  languages: [],
  tags: [],
  abstract: null,
  rights: '',
  source: { name: '', url: '', accessDate: '' },
})

describe('theDataDisplay go to first unmarked', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useClassification().setAll([])
    useTaxonomization().setAll([])
    useTaxonomization().categories.value = []
  })

  const mountDisplay = (uuids: string[]) => {
    const visualizations = uuids.map(makeViz)
    useVisualizationStore().$patch({ visualizations })
    useWorkspaceStore().uuidsLoaded = uuids
    return shallowMount(TheDataDisplay)
  }

  it('stays enabled when images only have a batch taxon (no Sure/Unsure)', async () => {
    const tax = useTaxonomization()
    tax.addCategory('new batch')
    tax.addAnnotation('u1', 'new batch')
    tax.addAnnotation('u2', 'new batch')

    const wrapper = mountDisplay(['u1', 'u2'])
    const button = wrapper.get('button')

    expect(button.element.hasAttribute('disabled')).toBe(false)
    await button.trigger('click')
    expect(button.element.hasAttribute('disabled')).toBe(false)
  })

  it('is disabled when every matched image has Sure or Unsure', () => {
    const classification = useClassification()
    classification.addAnnotation('u1', 'Sure')
    classification.addAnnotation('u2', 'Unsure')

    const wrapper = mountDisplay(['u1', 'u2'])
    expect(wrapper.get('button').element.hasAttribute('disabled')).toBe(true)
  })

  it('jumps to the page that contains the first image without Sure/Unsure', async () => {
    const classification = useClassification()
    // columns layout pageSize = 25
    const uuids = Array.from({ length: 26 }, (_, i) => `u${i + 1}`)
    uuids.slice(0, 25).forEach((uuid) => classification.addAnnotation(uuid, 'Sure'))

    const wrapper = mountDisplay(uuids)
    const button = wrapper.get('button')
    expect(button.element.hasAttribute('disabled')).toBe(false)

    await button.trigger('click')

    expect((wrapper.vm as unknown as { currentPage: number }).currentPage).toBe(2)
  })
})
