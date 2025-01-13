import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { useStore as useProfileStore } from './profile'
import { useStore as useVisualizationStore } from './visualization'

export const useStore = defineStore('workspace', () => {
  const visStore = useVisualizationStore()
  const { visualizations } = storeToRefs(visStore)

  const profileStore = useProfileStore()
  const { subjectUuids } = storeToRefs(profileStore)

  /** The UUIDs of all the visualizations. */
  const uuidsAll = computed(() => visualizations.value.map((d) => d.uuid))

  /** The UUIDs of visualizations loaded to the workspace. */
  const uuidsLoaded = computed(() => subjectUuids.value)

  /** The visualizations loaded. */
  const visualizationsLoaded = computed(() => {
    const uuidsLoadedSet = new Set(uuidsLoaded.value)
    return visualizations.value.filter((d) => uuidsLoadedSet.has(d.uuid))
  })

  return {
    uuidsAll,
    uuidsLoaded,
    visualizationsLoaded,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
