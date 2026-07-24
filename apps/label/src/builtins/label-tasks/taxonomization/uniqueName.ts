/** Generate a name that differs from existing names, based on a tentative name. */
export function generateUniqueName(
  existingNames: string[],
  name: string = 'new category',
): string {
  if (!existingNames.includes(name)) return name
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^${escaped} \\((?<index>\\d+)\\)$`)
  const indices = new Set(
    existingNames
      .map((d) => {
        if (d === name) return 1
        const index = d.match(re)?.groups?.index
        return index === undefined ? Number.NaN : Number(index)
      })
      .filter((d) => !Number.isNaN(d)),
  )
  for (let i = 2; i <= indices.size + 1; i += 1) {
    if (!indices.has(i)) return `${name} (${i})`
  }
  return `${name} (${Math.max(...indices) + 1})`
}
