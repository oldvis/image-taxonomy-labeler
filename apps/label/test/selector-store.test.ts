import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { SelectorType, useStore } from '~/stores/selector'

describe('selector store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('removes category selectors whose query is in the given names', () => {
    const store = useStore()
    store.toggleCategorySelector('leafA')
    store.toggleUnlabeledSelector()
    store.removeCategorySelectors(['leafA', 'parent'])
    expect(store.isCategorySelected('leafA')).toBe(false)
    expect(store.selectors.some((d) => d.type === SelectorType.Unlabeled)).toBe(true)
  })
})
