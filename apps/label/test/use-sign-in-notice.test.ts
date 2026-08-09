import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { NAME_NOTICE, useSignInNotice } from '~/composables/useSignInNotice'
import { MessageType, useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

describe('useSignInNotice', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('enqueues a persistent info snackbar when unsigned', () => {
    const { notifyIfUnsigned } = useSignInNotice()
    notifyIfUnsigned()

    const messages = useMessageStore().messages
    expect(messages).toHaveLength(1)
    expect(messages[0]?.type).toBe(MessageType.Info)
    expect(messages[0]?.content).toBe(NAME_NOTICE)
    expect(messages[0]?.timeout).toBe(Number.POSITIVE_INFINITY)
  })

  it('does not enqueue when a name is already set', () => {
    useUserStore().signIn('alice')
    const { notifyIfUnsigned } = useSignInNotice()
    notifyIfUnsigned()

    expect(useMessageStore().messages).toHaveLength(0)
  })

  it('clears the notice when the user signs in', async () => {
    const { notifyIfUnsigned } = useSignInNotice()
    notifyIfUnsigned()
    expect(useMessageStore().messages).toHaveLength(1)

    useUserStore().signIn('alice')
    await nextTick()
    expect(useMessageStore().messages).toHaveLength(0)
  })
})
