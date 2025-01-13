export interface Annotation {
  /** The type of the annotation. */
  type: string
  /** The uuid of the annotation. */
  uuid: string
  /** The uuid of the subject the annotation is associated with. */
  subject: string
  /** The name of the annotator. */
  user: string | null
  /** The annotation content. */
  value: string
  /** The time the annotation is finished. */
  time: string
}
