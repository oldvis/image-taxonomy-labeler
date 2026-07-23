/**
 * Composable function for taxonomy labeling.
 *
 * @note The taxonomy labeling state is not stored with pinia.
 * The consideration is that using a plain composable function is easier
 * to reuse and compose with other labeling states.
 */

import type { Annotation } from '../types'
import type { Category } from './types'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { useCommon } from '../useCommon'

export type { Annotation } from '../types'
export type { Category } from './types'
export type { TreeNode } from './types'

/** The label task name. */
const taskName = 'Taxonomization'

/** The global storage of taxonomy categories and their children. */
const categories = ref<Category[]>([])

/** The global storage of taxonomy annotations. */
const annotationStore = useCommon()

/** Build a taxonomy annotation. */
const buildAnnotation = (
  subject: string,
  value: string,
  user: string | null = null,
): Annotation => ({
  type: taskName,
  uuid: uuidv4(),
  subject,
  user,
  value,
  time: new Date().toISOString(),
})

/**
 * Add a taxonomy annotation.
 * @param subject The UUID of the image annotated.
 * @param value The category name.
 * @param user The name of the user who made the annotation.
 */
const addAnnotation = (
  subject: string,
  value: string,
  user: string | null = null,
): void => {
  annotationStore.addOne(buildAnnotation(subject, value, user))

  // Recursively assign `subject` to the ancestors of `value`.
  let parent = categories.value.find((d) => d.children.includes(value))
  while (parent !== undefined) {
    const { name } = parent
    annotationStore.addOne(buildAnnotation(subject, name, user))
    parent = categories.value.find((d) => d.children.includes(name))
  }
}

/** Remove a taxonomy annotation. */
const removeAnnotation = (subject: string, value: string): void => {
  const index = annotationStore.annotations.value.findIndex((d) => (
    d.type === taskName
    && d.subject === subject
    && d.value === value
  ))
  if (index === -1) throw new Error(`Annotation ${value} not found at ${subject}.`)
  annotationStore.removeByIndex(index)
}

/** Add a taxonomy category. */
const addCategory = (
  addedName: string,
  parentName?: string,
): void => {
  const addedCategory: Category = { name: addedName, children: [] }
  if (parentName !== undefined) {
    const parent = categories.value.find((d) => d.name === parentName)
    if (!parent) throw new Error(`Parent ${parentName} not found.`)
    parent.children.push(addedName)
  }
  categories.value.push(addedCategory)
}

/** Find the children of a taxonomy category. */
const findChildren = (category: string): string[] => (
  categories.value.find((d) => d.name === category)?.children ?? []
)

/** Find the descendants of a taxonomy category. */
const findDescendants = (category: string): string[] => {
  const descendants: string[] = []
  // Create a shallow copy to avoid modifying children with shift().
  const queue: string[] = [...findChildren(category)]
  while (queue.length > 0) {
    const curCategory = queue.shift() as string
    descendants.push(curCategory)
    const children = findChildren(curCategory)
    queue.push(...children)
  }
  return descendants
}

const removeSubcategories = (
  categoryName: string,
): void => {
  const category = categories.value.find((d) => d.name === categoryName)
  if (!category) throw new Error(`Category ${categoryName} not found.`)
  category.children = []
}

/**
 * Flatten the subtree of a taxonomy category given its name.
 * Remove subtree and relabel the annotations with the category name.
 */
const flattenCategory = (
  categoryName: string,
): void => {
  const category = categories.value.find((d) => d.name === categoryName)
  if (!category) throw new Error(`Category ${categoryName} not found.`)

  const descendants = new Set(findDescendants(categoryName))

  // Unassign images to the descendant categories.
  annotationStore.removeByValues([...descendants])

  // Remove children
  removeSubcategories(categoryName)

  // Remove the descendant categories.
  categories.value = categories.value.filter((d) => !descendants.has(d.name))
}

/** Move a taxonomy category in the taxonomic hierarchy. */
const moveCategory = (
  movedName: string,
  anchorName: string,
  type: 'before' | 'inner' | 'after',
): void => {
  const category = categories.value.find((d) => d.name === movedName)
  if (!category) throw new Error(`Category ${movedName} not found.`)

  // Remove the category from its parent.
  const parent = categories.value.find((d) => d.children.includes(movedName))
  if (parent) {
    parent.children.splice(parent.children.indexOf(movedName), 1)
  }

  const anchor = categories.value.find((d) => d.name === anchorName)
  if (type === 'inner') {
    // If anchor not found, it means the category is moved to the root.
    if (!anchor) {
      // Move the category to the last.
      categories.value = [
        ...categories.value.filter((d) => d.name !== category.name),
        category,
      ]
    }
    else {
      anchor.children = [...anchor.children, movedName]
    }
    return
  }

  const anchorParent = categories.value.find((d) => d.children.includes(anchorName))

  // If the anchor is a root node.
  if (!anchorParent) {
    let newCategories = categories.value.filter((d) => d.name !== category.name)
    const anchorIndex = newCategories.findIndex((d) => d.name === anchorName)
    if (type === 'before') {
      newCategories = [
        ...newCategories.slice(0, anchorIndex),
        category,
        ...newCategories.slice(anchorIndex),
      ]
    }
    else if (type === 'after') {
      newCategories = [
        ...newCategories.slice(0, anchorIndex + 1),
        category,
        ...newCategories.slice(anchorIndex + 1),
      ]
    }
    categories.value = newCategories
  }
  else {
    const anchorIndex = anchorParent.children.findIndex((d) => d === anchorName)
    if (type === 'before') {
      anchorParent.children = [
        ...anchorParent.children.slice(0, anchorIndex),
        movedName,
        ...anchorParent.children.slice(anchorIndex),
      ]
    }
    else if (type === 'after') {
      anchorParent.children = [
        ...anchorParent.children.slice(0, anchorIndex + 1),
        movedName,
        ...anchorParent.children.slice(anchorIndex + 1),
      ]
    }
  }
}

/** Remove a taxonomy category given its name. */
const removeCategory = (categoryName: string): void => {
  const category = categories.value.find((d) => d.name === categoryName)
  if (!category) throw new Error(`Category ${categoryName} not found.`)

  const parent = categories.value.find((d) => d.children.includes(categoryName))

  // Remove the category from the category list.
  categories.value = categories.value.filter((d) => d.name !== categoryName)

  // Remove the category from its parent.
  if (parent) {
    const siblings = parent.children
    siblings.splice(siblings.indexOf(categoryName), 1)
  }
}

/** Rename a taxonomy category. */
const renameCategory = (oldName: string, newName: string): void => {
  const index = categories.value.findIndex((d) => d.name === oldName)
  if (index === -1) throw new Error(`Category ${oldName} not found.`)

  // Rename the category.
  categories.value[index].name = newName

  // Update the pointer in the category's parent.
  const parent = categories.value.find((d) => d.children.includes(oldName))
  if (parent) {
    parent.children[parent.children.indexOf(oldName)] = newName
  }

  // Update the annotations.
  annotationStore.renameValue(oldName, newName)
}

export const useLabelTask = () => {
  const {
    annotations,
    annotationsByUuid,
    annotationsByValue,
    annotatedUuids,
    isAnnotated,
    setAll,
    removeByValues,
  } = annotationStore
  return {
    taskName,
    categories,
    annotations,
    annotationsByUuid,
    annotationsByValue,
    annotatedUuids,
    addCategory,
    flattenCategory,
    moveCategory,
    removeCategory,
    renameCategory,
    addAnnotation,
    removeAnnotation,
    removeAnnotationsByValues: removeByValues,
    isAnnotated,
    setAll,
  }
}
