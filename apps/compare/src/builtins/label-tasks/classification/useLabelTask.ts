/**
 * Composable function for classification labeling.
 *
 * @note The classification labeling state is not stored with pinia.
 * The consideration is that using a plain composable function is easier
 * to reuse and compose with other labeling states.
 */

import type { Annotation } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { useCommon } from '../useCommon'

export type { Annotation } from '../types'

/** The label task name. */
const taskName = 'Classification'

/** The global storage of classification categories. */
const categories = ref<string[]>([])

/** The global storage of classification annotations. */
const {
  annotations,
  annotationsByUuid,
  annotationsByValue,
  annotatedUuids,
  isAnnotated,
  addOne,
  removeByIndex,
  setOne,
  setAll,
} = useCommon()

/** Build a classification annotation. */
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

/** Add a classification annotation. */
const addAnnotation = (
  subject: string,
  value: string,
  user: string | null = null,
): void => {
  const annotation = buildAnnotation(subject, value, user)
  const index = annotations.value.findIndex((d) => (
    d.type === taskName
    && d.subject === subject
    && (
      ((value === 'Sure') || (value === 'Unsure'))
      && ((d.value === 'Sure') || (d.value === 'Unsure'))
    )
  ))

  // Whether to replace an old annotation.
  const replace = index !== -1
  if (!replace) addOne(annotation)
  else setOne(index, annotation)
}

/** Remove a classification annotation. */
const removeAnnotation = (subject: string, value: string): void => {
  const index = annotations.value.findIndex((d) => (
    d.type === taskName
    && d.subject === subject
    && d.value === value
  ))
  if (index === -1) throw new Error(`Annotation ${value} not found at ${subject}.`)
  removeByIndex(index)
}

export const useLabelTask = () => {
  return {
    taskName,
    categories,
    annotations,
    annotationsByUuid,
    annotationsByValue,
    annotatedUuids,
    addAnnotation,
    removeAnnotation,
    isAnnotated,
    setAll,
  }
}
