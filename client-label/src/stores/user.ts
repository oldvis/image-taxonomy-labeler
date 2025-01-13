import { acceptHMRUpdate, defineStore } from 'pinia'

export const useStore = defineStore('user', {
  state: () => ({
    name: null as string | null,
  }),
  getters: {
    isSignedIn(): boolean {
      return this.name !== null
    },
  },
  actions: {
    signIn(name: string): void {
      this.name = name
    },
    signOut(): void {
      this.name = null
    },
  },
  persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
