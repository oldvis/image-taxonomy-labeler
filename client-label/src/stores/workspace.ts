import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { useStore as useVisualizationStore } from './visualization'

export const useStore = defineStore('workspace', () => {
  const { visualizations } = storeToRefs(useVisualizationStore())

  /** The UUIDs of all the visualizations. */
  const uuidsAll = computed(() => visualizations.value.map((d) => d.uuid))

  /** The UUIDs of visualizations loaded to the workspace. */
  const uuidsLoaded = ref([] as string[])

  /** The visualizations loaded. */
  const visualizationsLoaded = computed(() => {
    const uuidsLoadedSet = new Set(uuidsLoaded.value)
    return visualizations.value.filter((d) => uuidsLoadedSet.has(d.uuid))
  })

  /** Load n visualizations outside the workspace into the workspace. */
  const loadBatch = (n: number): void => {
    const uuidsLoadedSet = new Set(uuidsLoaded.value)
    const uuidsNotLoaded = uuidsAll.value.filter((d) => !uuidsLoadedSet.has(d))
    if (uuidsNotLoaded.length <= n) {
      uuidsLoaded.value = uuidsAll.value
    }
    else {
      uuidsLoaded.value = [...uuidsLoaded.value, ...uuidsNotLoaded.slice(0, n)]
    }
  }

  /** Load all the visualizations outside the workspace into the workspace. */
  const loadAll = (): void => {
    uuidsLoaded.value = uuidsAll.value
  }
  return {
    uuidsAll,
    uuidsLoaded,
    visualizationsLoaded,
    loadAll,
    loadBatch,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
