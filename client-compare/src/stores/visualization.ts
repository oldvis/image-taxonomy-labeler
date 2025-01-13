import { acceptHMRUpdate, defineStore } from 'pinia'
import { visualizations } from '~/plugins/visualization'

export const useStore = defineStore('visualizations', {
  state: () => ({ visualizations }),
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
