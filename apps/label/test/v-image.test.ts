import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const useImageState = {
  isLoading: ref(false),
  error: ref<Event | null>(null),
}

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useImage: () => ({
      isLoading: useImageState.isLoading,
      error: useImageState.error,
    }),
  }
})

const VImage = (await import('@image-taxonomy-labeler/ui/data-display/VImage.vue')).default

const IMAGE_DRAG_MIME = 'application/x-oldvis-image'

const makeDataTransfer = () => {
  const store = new Map<string, string>()
  const types: string[] = []
  return {
    types,
    setData: (type: string, value: string) => {
      store.set(type, value)
      if (!types.includes(type)) types.push(type)
    },
    getData: (type: string) => store.get(type) ?? '',
    setDragImage: () => undefined,
  }
}

describe('vImage', () => {
  beforeEach(() => {
    useImageState.isLoading.value = false
    useImageState.error.value = null
  })

  it('sets the image-drag MIME and uuid on dragstart', async () => {
    const wrapper = mount(VImage, {
      props: {
        url: 'https://example.com/img.jpg',
        uuid: 'uuid-1',
      },
    })

    const img = wrapper.get('img')
    const dataTransfer = makeDataTransfer()
    await img.trigger('dragstart', { dataTransfer })

    expect(dataTransfer.types).toContain(IMAGE_DRAG_MIME)
    expect(dataTransfer.getData(IMAGE_DRAG_MIME)).toBe('uuid-1')
    expect(dataTransfer.getData('text/plain')).toBe('uuid-1')
    wrapper.unmount()
  })

  it('fades the image while it is being dragged', async () => {
    const wrapper = mount(VImage, {
      props: {
        url: 'https://example.com/img.jpg',
        uuid: 'uuid-1',
      },
    })

    const img = wrapper.get('img')
    const dataTransfer = {
      ...makeDataTransfer(),
      setDragImage: vi.fn(),
    }
    await img.trigger('dragstart', { dataTransfer })
    expect(img.classes()).toContain('opacity-50')
    expect(dataTransfer.setDragImage).toHaveBeenCalled()
    const ghost = dataTransfer.setDragImage.mock.calls[0]?.[0]
    expect(ghost).toBeInstanceOf(HTMLImageElement)
    expect((ghost as HTMLImageElement).style.objectFit).toBe('contain')
    expect(document.body.contains(ghost as Node)).toBe(true)
    await img.trigger('dragend')
    expect(img.classes()).not.toContain('opacity-50')
    expect(document.body.contains(ghost as Node)).toBe(false)
    wrapper.unmount()
  })

  it('shows a failure message instead of a bare broken image', () => {
    useImageState.error.value = new Event('error')
    const wrapper = mount(VImage, {
      props: {
        url: 'http://localhost:5001/uuids/abc/image',
        uuid: 'abc',
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Image failed to load')
  })
})
