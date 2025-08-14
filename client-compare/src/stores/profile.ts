import type { Category, TreeNode, TreeNodeWithUsers } from '~/builtins/label-tasks/taxonomization/types'
import type { Annotation } from '~/builtins/label-tasks/types'
import { difference, isEqual } from 'lodash'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { buildForest } from '~/builtins/label-tasks/taxonomization/utils'

export type { TreeNodeWithUsers } from '~/builtins/label-tasks/taxonomization/types'

interface TaskProgress {
  taskName: string
  categories: unknown[]
  annotations: Annotation[]
}

interface ClassificationTaskProgress extends TaskProgress {
  taskName: 'Classification'
  categories: string[]
}

interface TaxonomizationTaskProgress extends TaskProgress {
  taskName: 'Taxonomization'
  categories: Category[]
}

/** Store users in tree nodes. */
const storeUsersInNodes = (
  forest: TreeNode[],
  usernames: string[],
): TreeNodeWithUsers[] => {
  forest.forEach((node) => {
    (node as TreeNodeWithUsers).usernames = usernames
    storeUsersInNodes(node.children, usernames)
  })
  return forest as TreeNodeWithUsers[]
}

export interface AnnotatorProfile {
  /** The annotator name. */
  username: string
  /** The annotations created by the annotator. */
  annotations: Annotation[]
  /** The taxonomy forest corresponding to the annotations. */
  forest: TreeNodeWithUsers[]
  /** The UUIDs of images whose annotations are unsure. */
  unsureUuids: string[]
}

/** Build an annotator profile given the annotation file. */
export const buildAnnotatorProfile = async (
  taskProgresses: TaskProgress[],
  username: string,
): Promise<AnnotatorProfile> => {
  const classificationProgress = taskProgresses
    .find((d) => d.taskName === 'Classification') as ClassificationTaskProgress
  const taxonomizationProgress = taskProgresses
    .find((d) => d.taskName === 'Taxonomization') as TaxonomizationTaskProgress
  return {
    username,
    annotations: taxonomizationProgress.annotations,
    forest: storeUsersInNodes(buildForest(taxonomizationProgress.categories), [username]),
    unsureUuids: classificationProgress.annotations
      .filter((d) => d.value === 'Unsure')
      .map((d) => d.subject),
  }
}

/**
 * Merge two taxonomy forest.
 * In the merged tree, the set of possible paths from root to each node
 * is a union of the set of possible paths from root to each node
 * in the two input trees.
 */
const mergeTwoForests = (
  forest1: TreeNodeWithUsers[],
  forest2: TreeNodeWithUsers[],
): TreeNodeWithUsers[] => {
  const merged: TreeNodeWithUsers[] = []
  forest1.forEach((node1) => {
    const node2 = forest2.find((d) => d.name === node1.name)
    if (node2) {
      merged.push({
        ...node1,
        usernames: [...node1.usernames, ...node2.usernames],
        children: mergeTwoForests(node1.children, node2.children),
      })
    }
    else {
      merged.push(node1)
    }
  })
  forest2.forEach((node2) => {
    if (!forest1.find((d) => d.name === node2.name)) {
      merged.push(node2)
    }
  })
  return merged
}

/** Merge multiple taxonomy forests. */
const mergeMultipleForests = (forests: TreeNodeWithUsers[][]): TreeNodeWithUsers[] => {
  if (forests.length === 0) return []
  let merged: TreeNodeWithUsers[] = forests[0]
  forests.slice(1).forEach((forest) => {
    merged = merged ? mergeTwoForests(merged, forest) : forest
  })
  return merged
}

const profiles: AnnotatorProfile[] = []

export const useStore = defineStore('profiles', {
  state: () => ({
    /** The annotator profiles. */
    profiles,
  }),
  getters: {
    /** The UUIDs of images labeled by at least one annotator. */
    subjectUuids: (state): string[] => {
      const result = state.profiles.flatMap((d) => d.annotations.map((d) => d.subject))
      return [...new Set(result)]
    },
    /** The UUIDs of images marked unsure by at least one annotator. */
    unsureUuids: (state): string[] => {
      const result = state.profiles.flatMap((d) => d.unsureUuids)
      return [...new Set(result)]
    },
    /** The UUIDs of images with the same taxa by all annotators. */
    consensusUuids: (state): string[] => {
      const taxaByUuidByUsername: Record<string, Record<string, string[]>> = {}
      state.profiles.forEach((profile) => {
        profile.annotations.forEach((annotation) => {
          if (!taxaByUuidByUsername[annotation.subject]) {
            taxaByUuidByUsername[annotation.subject] = {}
          }
          if (!taxaByUuidByUsername[annotation.subject][profile.username]) {
            taxaByUuidByUsername[annotation.subject][profile.username] = [annotation.value]
          }
          else {
            taxaByUuidByUsername[annotation.subject][profile.username].push(annotation.value)
          }
        })
      })

      const result = Object.entries(taxaByUuidByUsername)
        .filter(([_, taxaByUsername]) => {
          // Check all the annotators assign the same taxa.
          const firstTaxa = Object.values(taxaByUsername)[0]
          return Object.values(taxaByUsername)
            .every((taxa) => isEqual(new Set(taxa), new Set(firstTaxa)))
        })
        .map(([uuid, _]) => uuid)
      return [...new Set(result)]
    },
    /** The UUIDs of images with the different taxa by annotators. */
    dissensusUuids(): string[] {
      const { subjectUuids, consensusUuids } = this
      return difference(subjectUuids, consensusUuids)
    },
    /** The taxa in the merged taxonomy forest sorted by depth first traversal order. */
    taxaSorted(): string[] {
      const taxa: string[] = []
      const stack: TreeNodeWithUsers[] = this.mergedForest.slice().reverse()
      while (stack.length > 0) {
        const node = stack.pop()
        if (node === undefined) break
        taxa.push(node.name)
        stack.push(...node.children.slice().reverse())
      }
      return taxa
    },
    /** The merged taxonomy forest that combines the taxonomy forests of all annotators. */
    mergedForest: (state): TreeNodeWithUsers[] => {
      return mergeMultipleForests(state.profiles.map((d) => d.forest))
    },
  },
  actions: {
    setProfiles(profiles: AnnotatorProfile[]): void {
      this.profiles = profiles
    },
    addProfiles(profiles: AnnotatorProfile[]): void {
      this.profiles = [...this.profiles, ...profiles]
    },
    /** Remove a profile by its index */
    removeProfile(index: number): void {
      this.profiles = [
        ...this.profiles.slice(0, index),
        ...this.profiles.slice(index + 1),
      ]
    },
    updateUsername(index: number, username: string): void {
      this.profiles[index].username = username
      this.profiles[index].forest = storeUsersInNodes(this.profiles[index].forest, [username])
    },
  },
  // persist: true,
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}
