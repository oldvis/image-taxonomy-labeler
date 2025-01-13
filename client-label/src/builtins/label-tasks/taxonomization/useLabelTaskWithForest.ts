import { useForest } from './useForest'
import { useLabelTask as _useLabelTask } from './useLabelTask'

/**
 * Adapt `useLabelTask` in `./useLabelTask`.
 * Evoke `useForest` in `./useForest` so that the tree editing
 * can take effect on `forest` returned by `useForest`.
 */
export const useLabelTask = () => {
  const {
    taskName,
    annotations,
    annotationsByUuid,
    annotationsByValue,
    categories,
    isAnnotated,
    addAnnotation,
    setAll,

    removeAnnotation,
    removeAnnotationsByValues,
    addCategory: _addCategory,
    flattenCategory: _flattenCategory,

    // Note that ElTree edits forest for node drop interaction.
    // Thus, it is unnecessary to edit forest with useForest().moveNode.
    moveCategory,

    removeCategory: _removeCategory,
    renameCategory: _renameCategory,
  } = _useLabelTask()

  const {
    forest,
    addNode,
    removeChildren,
    removeNode,
    renameNode,
  } = useForest()

  const addCategory = (addedName: string, parentName?: string): void => {
    _addCategory(addedName, parentName)
    addNode(addedName, parentName)
  }

  const flattenCategory = (categoryName: string): void => {
    removeChildren(categoryName)
    _flattenCategory(categoryName)
  }

  const removeCategory = (categoryName: string): void => {
    removeNode(categoryName)
    _removeCategory(categoryName)
  }

  const renameCategory = (oldName: string, newName: string): void => {
    renameNode(oldName, newName)
    _renameCategory(oldName, newName)
  }

  return {
    taskName,
    annotations,
    annotationsByUuid,
    annotationsByValue,
    categories,
    forest,
    isAnnotated,
    addAnnotation,
    setAll,
    removeAnnotation,
    removeAnnotationsByValues,
    addCategory,
    flattenCategory,
    moveCategory,
    removeCategory,
    renameCategory,
  }
}
