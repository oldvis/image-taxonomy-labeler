export type ConfidenceBorderStatus = 'unlabeled' | 'unsure' | 'sure'

/** Map classification annotation values for one subject to border status. */
export const getConfidenceBorderStatus = (
  values: string[] | null | undefined,
): ConfidenceBorderStatus => {
  if (values == null || values.length === 0) return 'unlabeled'
  if (values.includes('Sure')) return 'sure'
  if (values.includes('Unsure')) return 'unsure'
  return 'unlabeled'
}

/**
 * Inset ring so status stays visible over full-bleed thumbnails.
 * Three setups (DESIGN.md): unlabeled 1px gray · Unsure 3px #6b7280 · Sure 3px #0284c7
 */
export const confidenceBorderStyle = (
  status: ConfidenceBorderStatus,
  dark = false,
): { boxShadow: string } => {
  if (status === 'sure') return { boxShadow: 'inset 0 0 0 3px #0284c7' }
  if (status === 'unsure') return { boxShadow: 'inset 0 0 0 3px #6b7280' }
  return {
    boxShadow: dark
      ? 'inset 0 0 0 1px #374151'
      : 'inset 0 0 0 1px #e5e7eb',
  }
}
