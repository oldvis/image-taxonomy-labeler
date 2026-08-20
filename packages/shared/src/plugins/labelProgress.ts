import { z } from 'zod'

const annotationSchema = z.object({
  type: z.string(),
  uuid: z.string(),
  subject: z.string(),
  user: z.string().nullable(),
  value: z.string(),
  time: z.string(),
})

const classificationTaskSchema = z.object({
  taskName: z.literal('Classification'),
  categories: z.array(z.string()),
  annotations: z.array(annotationSchema),
})

const taxonomizationTaskSchema = z.object({
  taskName: z.literal('Taxonomization'),
  categories: z.array(z.object({
    name: z.string(),
    children: z.array(z.string()),
  })),
  annotations: z.array(annotationSchema),
})

const taskProgressSchema = z.discriminatedUnion('taskName', [
  classificationTaskSchema,
  taxonomizationTaskSchema,
])

const labelProgressFileSchema = z.array(taskProgressSchema)

export type LabelProgressFile = z.infer<typeof labelProgressFileSchema>
export type ClassificationTaskProgress = z.infer<typeof classificationTaskSchema>
export type TaxonomizationTaskProgress = z.infer<typeof taxonomizationTaskSchema>

/** Parse a Label download / restore JSON blob. */
export const parseLabelProgressFile = (data: unknown): LabelProgressFile => (
  labelProgressFileSchema.parse(data)
)

/** Parse a Compare annotator-profile upload (both tasks required). */
export const parseAnnotatorProfileFile = (data: unknown): {
  classification: ClassificationTaskProgress
  taxonomization: TaxonomizationTaskProgress
} => {
  const tasks = parseLabelProgressFile(data)
  const classification = tasks.find((d) => d.taskName === 'Classification')
  const taxonomization = tasks.find((d) => d.taskName === 'Taxonomization')
  if (classification === undefined) {
    throw new Error('Annotation file is missing a Classification task')
  }
  if (taxonomization === undefined) {
    throw new Error('Annotation file is missing a Taxonomization task')
  }
  return { classification, taxonomization }
}

/** User-facing message for a failed progress-file parse. */
export const formatLabelProgressError = (err: unknown): string => {
  if (err instanceof z.ZodError) {
    const first = err.issues[0]
    if (first === undefined) return 'Invalid annotation file'
    const path = first.path.length > 0 ? `${first.path.join('.')}: ` : ''
    return `${path}${first.message}`
  }
  if (err instanceof Error) return err.message
  return 'Invalid JSON file'
}
