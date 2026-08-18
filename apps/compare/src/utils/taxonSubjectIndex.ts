/** taxon → deduped subject UUIDs */
export type SubjectsByTaxon = Record<string, string[]>
/** subject → taxon names that contain that image */
export type TaxaBySubject = Record<string, string[]>

/**
 * Cold path: O(sum of subject-list lengths).
 * Invert taxon → subjects into subject → taxa (taxa list unique per subject).
 */
export const invertTaxaBySubject = (subjectsByTaxon: SubjectsByTaxon): TaxaBySubject => {
  const out: TaxaBySubject = {}
  for (const [taxon, subjects] of Object.entries(subjectsByTaxon)) {
    for (const subject of subjects) {
      const taxa = out[subject]
      if (taxa === undefined) {
        out[subject] = [taxon]
      }
      else if (!taxa.includes(taxon)) {
        taxa.push(taxon)
      }
    }
  }
  return out
}

/**
 * Unique subjects assigned to `taxon` on any profile.
 * Same set as flattening all annotations with that value, without duplicates.
 */
export const uniqueSubjectsForTaxon = (
  subjectsByUsernameByTaxon: Record<string, SubjectsByTaxon>,
  taxon: string,
): string[] => {
  const seen = new Set<string>()
  for (const byTaxon of Object.values(subjectsByUsernameByTaxon)) {
    const subjects = byTaxon[taxon]
    if (subjects === undefined) continue
    for (const subject of subjects) seen.add(subject)
  }
  return [...seen]
}

/**
 * Hot path: O(|subjects| × taxa-per-subject).
 * `counts[taxon]` = unique images in `subjects` that appear on that taxon
 * (same number as lodash.intersection(taxonSubjects, subjects).length).
 */
export const overlapCounts = (
  subjects: Iterable<string>,
  taxaBySubject: TaxaBySubject,
): Record<string, number> => {
  const counts: Record<string, number> = {}
  const seenSubject = new Set<string>()
  for (const subject of subjects) {
    if (seenSubject.has(subject)) continue
    seenSubject.add(subject)
    const taxa = taxaBySubject[subject]
    if (taxa === undefined) continue
    for (const taxon of taxa) {
      counts[taxon] = (counts[taxon] ?? 0) + 1
    }
  }
  return counts
}
