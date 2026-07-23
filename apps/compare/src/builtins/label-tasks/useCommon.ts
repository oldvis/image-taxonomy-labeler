import type { Annotation } from './types'
import { groupBy, omit } from 'lodash'
import { readonly } from 'vue'

/** Common states and utility functions for various label tasks. */
export const useCommon = () => {
  /** The storage of annotations. */
  const annotations = ref<Annotation[]>([])

  /** The annotations grouped by subject uuid. */
  const annotationsByUuid = ref<Record<string, Annotation[]>>({})
  // Note: For speed consideration, do not use computed:
  // computed(() => groupBy(annotations.value, 'subject'))

  /** The annotations grouped by value. */
  const annotationsByValue = ref<Record<string, Annotation[]>>({})
  // Note: For speed consideration, do not use computed:
  // computed(() => groupBy(annotations.value, 'value'))

  /** The uuids of annotated data objects. */
  const annotatedUuids = ref<Set<string>>(new Set([]))
  // Note: For speed consideration, do not use computed:
  // computed(() => new Set(Object.keys(annotationsByUuid.value)))

  /**
   * Check if an annotation already exists.
   * Two annotations are regarded as the same
   * if they have the same `subject` and `value`.
   */
  const isExisting = (annotation: Annotation): boolean => {
    if (annotation.subject in annotationsByUuid.value) {
      return annotationsByUuid.value[annotation.subject].some(
        (d) => d.value === annotation.value,
      )
    }
    return false
  }

  /** Add an annotation. */
  const addOne = (annotation: Annotation): void => {
    // If the annotation already exists, skip.
    if (isExisting(annotation)) return

    annotations.value.push(annotation)

    if (annotation.subject in annotationsByUuid.value) {
      annotationsByUuid.value[annotation.subject].push(annotation)
    }
    else {
      annotationsByUuid.value[annotation.subject] = [annotation]
    }

    if (annotation.value in annotationsByValue.value) {
      annotationsByValue.value[annotation.value].push(annotation)
    }
    else {
      annotationsByValue.value[annotation.value] = [annotation]
    }

    annotatedUuids.value.add(annotation.subject)
  }

  /** Add annotations. */
  const addBulk = (bulk: Annotation[]): void => {
    // If the annotation already exists, skip.
    const bulkFiltered = bulk.filter((d) => !isExisting(d))

    annotations.value.push(...bulkFiltered)
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = groupBy(annotations.value, 'value')
    annotatedUuids.value = new Set(Object.keys(annotationsByUuid.value))
  }

  /** Replace an annotation. */
  const setOne = (index: number, newValue: Annotation): void => {
    const oldValue = annotations.value[index]
    annotations.value[index] = newValue

    const uuidGroup = annotationsByUuid.value[oldValue.subject]
    if (uuidGroup.length === 1) {
      delete annotationsByUuid.value[oldValue.subject]
    }
    else {
      uuidGroup.splice(
        uuidGroup.map((d) => d.uuid).indexOf(oldValue.uuid),
        1,
      )
    }
    if (newValue.subject in annotationsByUuid.value) {
      annotationsByUuid.value[newValue.subject].push(newValue)
    }
    else {
      annotationsByUuid.value[newValue.subject] = [newValue]
    }

    const valueGroup = annotationsByValue.value[oldValue.value]
    if (valueGroup.length === 1) {
      delete annotationsByValue.value[oldValue.value]
    }
    else {
      valueGroup.splice(
        valueGroup.map((d) => d.uuid).indexOf(oldValue.uuid),
        1,
      )
    }
    if (newValue.value in annotationsByValue.value) {
      annotationsByValue.value[newValue.value].push(newValue)
    }
    else {
      annotationsByValue.value[newValue.value] = [newValue]
    }

    if (!(oldValue.subject in annotationsByUuid.value)) {
      annotatedUuids.value.delete(oldValue.subject)
    }
    annotatedUuids.value.add(newValue.subject)
  }

  /** Set the annotations. */
  const setAll = (newValues: Annotation[]): void => {
    annotations.value = newValues
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = groupBy(annotations.value, 'value')
    annotatedUuids.value = new Set(Object.keys(annotationsByUuid.value))
  }

  /** Remove an annotation by index. */
  const removeByIndex = (index: number): void => {
    const annotation = annotations.value[index]

    annotations.value.splice(index, 1)

    const uuidGroup = annotationsByUuid.value[annotation.subject]
    if (uuidGroup.length === 1) {
      delete annotationsByUuid.value[annotation.subject]
    }
    else {
      uuidGroup.splice(
        uuidGroup.map((d) => d.uuid).indexOf(annotation.uuid),
        1,
      )
    }

    const valueGroup = annotationsByValue.value[annotation.value]
    if (valueGroup.length === 1) {
      delete annotationsByValue.value[annotation.value]
    }
    else {
      valueGroup.splice(
        valueGroup.map((d) => d.uuid).indexOf(annotation.uuid),
        1,
      )
    }

    if (!(annotation.subject in annotationsByUuid.value)) {
      annotatedUuids.value.delete(annotation.subject)
    }
  }

  /** Remove one or multiple annotations by values. */
  const removeByValues = (values: string[]): void => {
    const _values = new Set(values)
    annotations.value = annotations.value.filter((d) => !_values.has(d.value))
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = omit(annotationsByValue.value, values)
    annotatedUuids.value = new Set(Object.keys(annotationsByUuid.value))
  }

  /** Remove one or multiple annotations by values. */
  const renameValue = (oldValue: string, newValue: string): void => {
    annotations.value = annotations.value.map((d) => {
      if (d.value === oldValue) {
        return { ...d, value: newValue }
      }
      return d
    })
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    if (oldValue in annotationsByValue.value) {
      annotationsByValue.value[newValue] = annotationsByValue.value[oldValue]
      delete annotationsByValue.value[oldValue]
    }
  }

  /** Check if a data entry is annotated. */
  const isAnnotated = (uuid: string): boolean => (
    annotatedUuids.value.has(uuid)
  )

  return {
    annotations: readonly(annotations),
    annotationsByUuid: readonly(annotationsByUuid),
    annotationsByValue: readonly(annotationsByValue),
    annotatedUuids: readonly(annotatedUuids),
    isAnnotated,
    addOne,
    addBulk,
    removeByIndex,
    removeByValues,
    renameValue,
    setOne,
    setAll,
  }
}
