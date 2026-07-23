import type { Category, TreeNode } from './useLabelTask'
import { getCaptions } from '~/services/captioning'
import { clustering, findCenters } from '~/services/clustering'
import { useLabelTask } from './useLabelTaskWithForest'

/**
 * Convert cluster labels to a list of clusters.
 * Each cluster is stored as the indices of items in the cluster.
 */
const clusterLabelsToGroups = (clusterLabels: number[]) => {
  const clusters: Record<number, number[]> = {}
  clusterLabels.forEach((label, i) => {
    clusters[label] = label in clusters
      ? clusters[label].concat(i)
      : [i]
  })

  // Sort by cluster index in ascending order
  // to eliminate randomness in the created taxonomy.
  const groups = Object.entries(clusters)
    .sort((a, b) => (Number(a[0]) - Number(b[0])))
    .map((d) => d[1])
  return groups
}

/** Find the parent of a category given its name. */
const findParent = (categories: Category[], name: string): Category | undefined => {
  return categories.find((d) => d.children.includes(name))
}

/** Find the children of a category given its name. */
const findChildren = (categories: Category[], name: string): string[] => (
  categories.find((d) => d.name === name)?.children ?? []
)

/**
 * Find the siblings of a category given its name.
 * The category itself is not included in the siblings.
 * A root node in the forest is considered to have no siblings.
 */
const findSiblings = (categories: Category[], name: string): string[] => {
  const parent = categories.find((d) => d.children.includes(name))
  return parent?.children.filter((d) => d !== name) ?? []
}

/**
 * Find the ancestors of a category given its name.
 * The ancestors are sorted from parent to root.
 * The category itself is not included in the ancestors.
 */
const findAncestors = (categories: Category[], name: string): string[] => {
  // NOTE: The search of ancestor can be faster
  // if the path from the root is readily stored in each node.

  const ancestors: string[] = []
  let parent = findParent(categories, name)
  while (parent !== undefined) {
    ancestors.push(parent.name)
    parent = findParent(categories, parent.name)
  }
  return ancestors
}

/**
 * Find the descendants of a category given its name.
 * The category itself is not included in the descendants.
 */
const findDescendants = (categories: Category[], name: string): string[] => {
  const descendants: string[] = []
  // Create a shallow copy to avoid modifying children with shift().
  const queue: string[] = [...findChildren(categories, name)]
  while (queue.length > 0) {
    const curCategory = queue.shift() as string
    descendants.push(curCategory)
    const children = findChildren(categories, curCategory)
    queue.push(...children)
  }
  return descendants
}

/**
 * Get the operators for manipulating the taxonomy.
 * @param uuids The UUIDs of all the images in the workspace.
 * @param userName The name of the current annotator.
 * @returns The operators for manipulating the taxonomy.
 */
export const useOperators = (uuids: Ref<string[]>, userName: Ref<string | null>) => {
  const {
    annotations,
    annotationsByUuid,
    categories,
    addAnnotation,
    removeAnnotation,
    removeAnnotationsByValues,
    addCategory,
    flattenCategory,
    moveCategory,
    removeCategory,
    renameCategory,
  } = useLabelTask()

  /** Generate a new node name that differs from existing node names, based on a tentative name. */
  const generateUniqueName = (name: string = 'new category'): string => {
    const existingNames = categories.value.map((d) => d.name)
    if (!existingNames.includes(name)) return name
    const indices = new Set(existingNames
      .map((d) => {
        if (d === name) return 1
        const re = new RegExp(`${name} \\((?<index>[\\d+]*)\\)`)
        const index = d.match(re)?.groups?.index
        return Number(index)
      })
      .filter((d) => !Number.isNaN(d)))
    // Find the smallest index that is not in indices.
    for (let i = 2; i <= indices.size; i += 1) {
      if (!indices.has(i)) return `${name} (${i})`
    }
    return `${name} (${Math.max(...indices) + 1})`
  }

  /**
   * Create a child taxon and append to the parent node.
   * If the parent is undefined, append a root node.
   * The uuids of the images belonging to the taxon is given.
   */
  const createTaxon = (name: string, imageUuids: string[], parent?: TreeNode): void => {
    const parentName = parent?.name
    const nodeName = generateUniqueName(name)
    addCategory(nodeName, parentName)
    imageUuids.forEach((uuid) => addAnnotation(uuid, nodeName, userName.value))
  }

  /**
   * Get the uuid of data objects given the category.
   * If the category is undefined, return all uuids.
   */
  const getImageUuidsInTaxon = (taxon?: string): string[] => {
    if (taxon === undefined) return uuids.value
    return annotations.value
      .filter((d) => d.value === taxon)
      .map((d) => d.subject)
  }

  /**
   * Create an empty child and append to the parent node.
   * If the parent is undefined, append a root node.
   */
  const createTaxonEmpty = (parent?: TreeNode): void => {
    const parentName = parent?.name
    const parentHasImages = getImageUuidsInTaxon(parentName).length >= 1
    const nodeName = generateUniqueName()
    addCategory(nodeName, parentName)

    // If the node:
    // 1. is not a root node and
    // 2. is the only child of the parent and
    // 3. parent has images,
    // append an additional 'ungrouped' node to the parent,
    // and assign all images in the parent to 'ungrouped'.
    // In this way, we ensure all the images in the parent belong to at least one child.
    const isRoot = parent === undefined
    const siblings = findSiblings(categories.value, nodeName)
    if (!isRoot && siblings.length === 0 && parentHasImages) {
      const ungroupedName = generateUniqueName('ungrouped')
      addCategory(ungroupedName, parentName)
      const parentUuids = getImageUuidsInTaxon(parentName)
      parentUuids.forEach((uuid) => addAnnotation(uuid, ungroupedName, userName.value))
    }
  }

  /**
   * Divide images belonging to the taxon into multiple clusters.
   * If the node is null, divide all images.
   */
  const divideTaxon = async (taxon?: string): Promise<void> => {
    // The UUIDs of images in the node.
    const imageUuidsInTaxon = getImageUuidsInTaxon(taxon)
    if (imageUuidsInTaxon.length === 0) return

    const nClusters = Math.floor(Math.sqrt(imageUuidsInTaxon.length))
    const clusterLabels = await clustering(imageUuidsInTaxon, nClusters)
    const groups = clusterLabelsToGroups(clusterLabels)
    const uuidClusters = groups.map((group) => (
      group.map((index) => imageUuidsInTaxon[index])
    ))

    const centerUuids = await findCenters(uuidClusters)
    const captions = await getCaptions(centerUuids)
    uuidClusters.forEach((cluster: string[], i: number) => {
      const childName = generateUniqueName(captions[i] ?? undefined)

      // Create subtaxon.
      addCategory(childName, taxon)

      // Assign images to the subtaxon.
      cluster.forEach((uuid) => addAnnotation(uuid, childName, userName.value))
    })
  }

  /** Flatten the subtree at the node. */
  const flattenTaxon = ({ name }: TreeNode): void => {
    flattenCategory(name)
  }

  /** Check if an annotation exists. */
  const checkAnnotationExists = (imageUuid: string, taxon: string): boolean => {
    if (imageUuid in annotationsByUuid.value === false) return false
    return annotationsByUuid.value[imageUuid].some((d) => d.value === taxon)
  }

  /** Merge the subtree of source node `c1` to target node `c2`. */
  const mergeTaxa = ({ name: sourceName }: TreeNode, { name: targetName }: TreeNode): void => {
    const sourceUuids = getImageUuidsInTaxon(sourceName)
    sourceUuids.forEach((uuid) => addAnnotation(uuid, targetName, userName.value))

    // Move the children of the source node `c1` to the target node.
    const children = categories.value.find((d) => d.name === sourceName)?.children ?? []
    children.forEach((child) => moveCategory(child, targetName, 'inner'))

    // For each image `d` belonging to `c1`,
    // for each ancestor `c'` of `c1` from parent to root,
    // remove image `d` from `c'`, if `d` is not assigned to at least one child of `c'`.
    const ancestors = findAncestors(categories.value, sourceName)
    sourceUuids.forEach((uuid) => {
      let currentName = sourceName
      for (const ancestor of ancestors) {
        const children = findChildren(categories.value, ancestor)
        const childrenAssigned = children.filter((d) => checkAnnotationExists(uuid, d))
        const siblingsAssigned = childrenAssigned.filter((d) => d !== currentName)
        if (siblingsAssigned.length >= 1) break
        removeAnnotation(uuid, ancestor)
        currentName = ancestor
      }
    })

    // Remove the source node `c1`.
    removeCategory(sourceName)
    removeAnnotationsByValues([sourceName])
  }

  /** Move source node to be a child or sibling of target node. */
  const moveTaxon = (source: TreeNode, target: TreeNode, type: 'before' | 'inner' | 'after'): void => {
    const sourceUuids = getImageUuidsInTaxon(source.name)

    // For each image in source,
    // if the image is labeled with no (old) siblings of source,
    // unassign the image from the ancestor of source.
    const oldAncestors = findAncestors(categories.value, source.name)
    sourceUuids.forEach((uuid) => {
      let currentName = source.name
      for (const ancestor of oldAncestors) {
        const children = findChildren(categories.value, ancestor)
        const childrenAssigned = children.filter((d) => checkAnnotationExists(uuid, d))
        const siblingsAssigned = childrenAssigned.filter((d) => d !== currentName)
        if (siblingsAssigned.length >= 1) break
        removeAnnotation(uuid, ancestor)
        currentName = ancestor
      }
    })

    moveCategory(source.name, target.name, type)

    // For each image in source,
    // if the image is labeled with no (new) siblings of source,
    // assign the image from the ancestor of source.
    const newSiblings = findSiblings(categories.value, source.name)
    const newAncestors = findAncestors(categories.value, source.name)
    sourceUuids.forEach((uuid) => {
      if (newSiblings.some((sibling) => checkAnnotationExists(uuid, sibling))) return
      newAncestors.forEach((ancestor) => addAnnotation(uuid, ancestor, userName.value))
    })
  }

  /** Change the name of a node. */
  const renameTaxon = ({ name: oldName }: TreeNode, newName: string): void => {
    renameCategory(oldName, generateUniqueName(newName))
  }

  /** Remove a taxon `c` given its name. */
  const removeTaxon = ({ name }: TreeNode): void => {
    // For each image `d` belonging to `c`,
    // for each ancestor `c'` of `c` from parent to root,
    // remove image `d` from `c'`, if `d` is not assigned to at least one child of `c'`.
    const sourceUuids = getImageUuidsInTaxon(name)
    const ancestors = findAncestors(categories.value, name)
    sourceUuids.forEach((uuid) => {
      let currentName = name
      for (const ancestor of ancestors) {
        const children = findChildren(categories.value, ancestor)
        const childrenAssigned = children.filter((d) => checkAnnotationExists(uuid, d))
        const siblingsAssigned = childrenAssigned.filter((d) => d !== currentName)
        if (siblingsAssigned.length >= 1) break
        removeAnnotation(uuid, ancestor)
        currentName = ancestor
      }
    })

    // Remove the descendants of node `c`.
    const descendants = findDescendants(categories.value, name)
    descendants.forEach((descendant) => removeCategory(descendant))
    removeAnnotationsByValues(descendants)

    // Remove the node `c`.
    removeCategory(name)
    removeAnnotationsByValues([name])
  }

  /** Assign a taxon to an image. */
  const assignTaxon = (imageUuid: string, taxon: string): void => {
    addAnnotation(imageUuid, taxon, userName.value)
  }

  /** Unassign a taxon `c` to an image `d`. */
  const unassignTaxon = (imageUuid: string, taxon: string): void => {
    removeAnnotation(imageUuid, taxon)

    // Remove `d` from the descendants of `c`.
    const descendants = findDescendants(categories.value, taxon)
    descendants.forEach((descendant) => removeAnnotation(imageUuid, descendant))

    // For each ancestor `c'` of `c` from parent to root,
    // remove `d` from `c'`, if `d` is not assigned to at least one child of `c'`.
    const ancestors = findAncestors(categories.value, taxon)
    let currentName = taxon
    for (const ancestor of ancestors) {
      const children = findChildren(categories.value, ancestor)
      const childrenAssigned = children.filter((d) => checkAnnotationExists(imageUuid, d))
      const siblingsAssigned = childrenAssigned.filter((d) => d !== currentName)
      if (siblingsAssigned.length >= 1) break
      removeAnnotation(imageUuid, ancestor)
      currentName = ancestor
    }
  }

  return {
    createTaxonEmpty,
    createTaxon,
    divideTaxon,
    flattenTaxon,
    mergeTaxa,
    moveTaxon,
    renameTaxon,
    removeTaxon,
    assignTaxon,
    unassignTaxon,
  }
}
