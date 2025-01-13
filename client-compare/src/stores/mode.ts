import { acceptHMRUpdate, defineStore } from 'pinia'

export enum DisplayMode {
  Trees,
  Images,
}

export const useStore = defineStore('mode', {
  state: () => ({
    displayMode: DisplayMode.Trees as DisplayMode,
  }),
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
