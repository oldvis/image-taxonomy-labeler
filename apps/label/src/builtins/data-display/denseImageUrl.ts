import { getThumbnailUrl } from '@image-taxonomy-labeler/shared/services/image'

/** Max images on the dense page before falling back to thumbnails. */
export const DENSE_FULL_IMAGE_MAX = 25

/** Pick dense-grid image URL: full when the page is small, thumbnail when crowded. */
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
