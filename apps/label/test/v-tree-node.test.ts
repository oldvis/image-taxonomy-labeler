import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/services/clustering', () => ({
  findCenter: vi.fn(async () => 'center-uuid'),
}))

vi.mock('@image-taxonomy-labeler/shared/services/params', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@image-taxonomy-labeler/shared/services/params')
  >()
  return {
    ...actual,
    USE_ALGORITHM_SERVICE: true,
  }
})

const { useLabelTask } = await import(
  '@image-taxonomy-labeler/ui/label-tasks/taxonomization/useLabelTask',
)
const VTreeNode = (await import('~/components/VTreeView/VTreeNode.vue')).default

const IMAGE_DRAG_MIME = 'application/x-oldvis-image'

const makeLeafNode = (name: string) => ({
  isLeaf: true,
  childNodes: [],
  data: { name, children: [] },
})

const makeDragEvent = (
  type: string,
  {
    types = [] as string[],
    data = {} as Record<string, string>,
    target = null as EventTarget | null,
  } = {},
): DragEvent => {
  const store = new Map(Object.entries(data))
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      types,
      getData: (mime: string) => store.get(mime) ?? '',
      setData: () => undefined,
    },
  })
  if (target !== null) {
    Object.defineProperty(event, 'target', { value: target })
  }
  return event
}

describe('vTreeNode image drop / thumbnail', () => {
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

  it('treats the group thumbnail as non-draggable node chrome', async () => {
    const tax = useLabelTask()
    tax.addAnnotation('img-1', 'leafA')

    const wrapper = mount(VTreeNode, {
      props: {
        node: makeLeafNode('leafA') as never,
      },
      global: {
        stubs: { VInput: true },
      },
    })

    await vi.waitFor(() => {
      expect(wrapper.find('img').exists()).toBe(true)
    })

    const img = wrapper.get('img')
    expect(img.attributes('draggable')).toBe('false')
    expect(img.classes()).toContain('pointer-events-none')
  })

  it('ignores non-image drags on drop', () => {
    const tax = useLabelTask()
    const before = tax.annotations.value.length

    const wrapper = mount(VTreeNode, {
      props: {
        node: makeLeafNode('leafB') as never,
      },
      global: {
        stubs: { VInput: true },
      },
    })

    wrapper.element.dispatchEvent(makeDragEvent('drop', {
      types: ['text/plain'],
      data: { 'text/plain': 'img-1' },
    }))

    expect(tax.annotations.value.length).toBe(before)
  })

  it('adds the target taxon on multi-label drop without clearing other leaf labels', async () => {
    const tax = useLabelTask()
    tax.addAnnotation('img-1', 'leafA')

    const wrapper = mount(VTreeNode, {
      props: {
        node: makeLeafNode('leafB') as never,
      },
      global: {
        stubs: { VInput: true },
      },
    })

    // Force hover so the multi chip is shown (v-show).
    await wrapper.trigger('mouseenter')
    const multi = wrapper.get('[data-multi-label-zone]').element

    wrapper.element.dispatchEvent(makeDragEvent('drop', {
      types: [IMAGE_DRAG_MIME, 'text/plain'],
      data: {
        [IMAGE_DRAG_MIME]: 'img-1',
        'text/plain': 'img-1',
      },
      target: multi,
    }))

    const values = (tax.annotationsByUuid.value['img-1'] ?? []).map((d) => d.value)
    expect(values).toContain('leafA')
    expect(values).toContain('leafB')
  })

  it('replaces other leaf taxa on a normal image drop', () => {
    const tax = useLabelTask()
    tax.addAnnotation('img-1', 'leafA')

    const wrapper = mount(VTreeNode, {
      props: {
        node: makeLeafNode('leafB') as never,
      },
      global: {
        stubs: { VInput: true },
      },
    })

    wrapper.element.dispatchEvent(makeDragEvent('drop', {
      types: [IMAGE_DRAG_MIME, 'text/plain'],
      data: {
        [IMAGE_DRAG_MIME]: 'img-1',
        'text/plain': 'img-1',
      },
      target: wrapper.element,
    }))

    const values = (tax.annotationsByUuid.value['img-1'] ?? []).map((d) => d.value)
    expect(values).toContain('leafB')
    expect(values).not.toContain('leafA')
  })
})
