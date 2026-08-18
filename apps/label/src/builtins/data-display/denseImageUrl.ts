import { getThumbnailUrl } from '@image-taxonomy-labeler/shared/services/image'

/**
 * Dense-grid cells grow to fill the page. With few images they are large, so
 * a thumbnail looks blurry — load the full file (`downloadUrl`) instead.
 * With more images than this, cells are small enough that `/thumbnail` is
 * sharp and cheaper. Uses the number of images on the page, not cell pixels.
 *
 * Label dense-grid only. Columns and single-object already load `downloadUrl`.
 */
export const DENSE_FULL_IMAGE_MAX = 25

/** Full image if `pageCount` is at most `DENSE_FULL_IMAGE_MAX`, else thumbnail. */
export const denseImageUrl = ({
  uuid,
  downloadUrl,
  pageCount,
}: {
  uuid: string | undefined
  downloadUrl: string | null | undefined
  pageCount: number
}): string => {
  if (uuid === undefined) return ''
  if (pageCount <= DENSE_FULL_IMAGE_MAX) return downloadUrl ?? ''
  return getThumbnailUrl(uuid)
}
