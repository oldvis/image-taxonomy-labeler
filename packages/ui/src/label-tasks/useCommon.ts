import type { Annotation } from './types'
import { groupBy, omit } from 'lodash'
import { markRaw, readonly, ref, shallowRef, triggerRef } from 'vue'

const freezeRow = (annotation: Annotation): Annotation => markRaw(annotation)

const freezeList = (rows: Annotation[]): Annotation[] => (
  markRaw(rows.map((row) => freezeRow(row)))
)

/**
 * Shared annotation list for classification and taxonomization.
 *
 * Hot-path design for large lists (~12k synthetic rows in Label e2e):
 * keep the flat `annotations` list shallow + markRaw (do not deep-proxy rows),
 * update `annotationsByUuid` / `annotationsByValue` incrementally on add/remove,
 * and remove flat-list rows with O(1) swap-pop. Do not re-`groupBy` / rescan
 * all annotations on each Sure click.
 *
 * Callers (classification / taxonomization `useLabelTask`) still `findIndex`
 * the flat list before `removeByIndex` / `setOne`. That O(n) scan is outside
 * this module.
 *
 * Typical Label e2e (`pnpm exec playwright test --project=label`, 12k rows):
 * Sure mean ~0.3ms (was ~7.5ms); taxon assign mean ~25ms (was ~35ms).
 */
export const useCommon = () => {
  const annotations = shallowRef<Annotation[]>(markRaw([]))

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

  /** Two annotations match if they share `subject` and `value`. */
  const isExisting = (annotation: Annotation): boolean => {
    if (annotation.subject in annotationsByUuid.value) {
      return annotationsByUuid.value[annotation.subject].some(
        (d) => d.value === annotation.value,
      )
    }
    return false
  }

  /** Hot path: push + map update; no full `groupBy`. */
  const addOne = (annotation: Annotation): void => {
    if (isExisting(annotation)) return

    const row = freezeRow(annotation)
    annotations.value.push(row)
    triggerRef(annotations)

    if (row.subject in annotationsByUuid.value) {
      annotationsByUuid.value[row.subject].push(row)
    }
    else {
      annotationsByUuid.value[row.subject] = [row]
    }

    if (row.value in annotationsByValue.value) {
      annotationsByValue.value[row.value].push(row)
    }
    else {
      annotationsByValue.value[row.value] = [row]
    }

    annotatedUuids.value.add(row.subject)
  }

  /** Cold path (load): O(n) filter + `groupBy` rebuild. */
  const addBulk = (bulk: Annotation[]): void => {
    const bulkFiltered = freezeList(bulk.filter((d) => !isExisting(d)))
    annotations.value.push(...bulkFiltered)
    triggerRef(annotations)
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = groupBy(annotations.value, 'value')
    annotatedUuids.value = new Set(Object.keys(annotationsByUuid.value))
  }

  /** Hot path: replace at index; O(group) map splice, no full `groupBy`. */
  const setOne = (index: number, newValue: Annotation): void => {
    const oldValue = annotations.value[index]
    const row = freezeRow(newValue)
    annotations.value[index] = row
    triggerRef(annotations)

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
    if (row.subject in annotationsByUuid.value) {
      annotationsByUuid.value[row.subject].push(row)
    }
    else {
      annotationsByUuid.value[row.subject] = [row]
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
    if (row.value in annotationsByValue.value) {
      annotationsByValue.value[row.value].push(row)
    }
    else {
      annotationsByValue.value[row.value] = [row]
    }

    if (!(oldValue.subject in annotationsByUuid.value)) {
      annotatedUuids.value.delete(oldValue.subject)
    }
    annotatedUuids.value.add(row.subject)
  }

  /** Cold path (load/upload): O(n) `groupBy` rebuild. */
  const setAll = (newValues: Annotation[]): void => {
    annotations.value = freezeList(newValues)
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = groupBy(annotations.value, 'value')
    annotatedUuids.value = new Set(Object.keys(annotationsByUuid.value))
  }

  /**
   * Hot path: O(1) swap-pop on the flat list (order is not significant);
   * O(group) splice on subject/value arrays.
   */
  const removeByIndex = (index: number): void => {
    const annotation = annotations.value[index]
    const last = annotations.value.length - 1
    if (index !== last) {
      annotations.value[index] = annotations.value[last]
    }
    annotations.value.pop()
    triggerRef(annotations)

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

  /** Cold path: O(n) filter + `groupBy` rebuild. */
  const removeByValues = (values: string[]): void => {
    const _values = new Set(values)
    annotations.value = freezeList(
      annotations.value.filter((d) => !_values.has(d.value)),
    )
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = omit(annotationsByValue.value, values)
    annotatedUuids.value = new Set(Object.keys(annotationsByUuid.value))
  }

  /** Cold path: O(n) map + `groupBy` rebuild. */
  const renameValue = (oldValue: string, newValue: string): void => {
    annotations.value = freezeList(annotations.value.map((d) => {
      if (d.value === oldValue) {
        return { ...d, value: newValue }
      }
      return d
    }))
    annotationsByUuid.value = groupBy(annotations.value, 'subject')
    annotationsByValue.value = groupBy(annotations.value, 'value')
  }

  /** Hot path: O(1) Set lookup. */
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
