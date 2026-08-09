import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { MessageType, useStore } from '~/stores/message'

describe('message store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds info messages', () => {
    const store = useStore()
    store.addInfoMessage('hello', Number.POSITIVE_INFINITY)
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0].type).toBe(MessageType.Info)
    expect(store.messages[0].content).toBe('hello')
  })

  it('removeByContent drops matching messages', () => {
    const store = useStore()
    store.addInfoMessage('keep', 1000)
    store.addInfoMessage('drop-me', Number.POSITIVE_INFINITY)
    store.removeByContent('drop-me')
    expect(store.messages.map((m) => m.content)).toEqual(['keep'])
  })
})
