import { storeToRefs } from 'pinia'
import { useStore as useMessageStore } from '~/stores/message'
import { useStore as useUserStore } from '~/stores/user'

export const NAME_NOTICE = 'Set a name in the header so new annotations include your user id.'

/**
 * Soft identity nudge via snackbar (not a permanent layout bar).
 * Call once when the annotate surface is ready. Stays until dismissed or signed in.
 */
export const useSignInNotice = () => {
  const messageStore = useMessageStore()
  const { isSignedIn } = storeToRefs(useUserStore())

  const notifyIfUnsigned = (): void => {
    messageStore.removeByContent(NAME_NOTICE)
    if (!isSignedIn.value) {
      messageStore.addInfoMessage(NAME_NOTICE, Number.POSITIVE_INFINITY)
    }
  }

  watch(isSignedIn, (signedIn) => {
    if (signedIn) messageStore.removeByContent(NAME_NOTICE)
  })

  return { notifyIfUnsigned }
}
