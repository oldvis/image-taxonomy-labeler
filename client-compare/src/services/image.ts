import { BASE_IMAGE_URL as BASE_URL } from './params'

/** Map UUID to full image URL. */
export const getImageUrl = (uuid: string) => (
  `${BASE_URL}/uuids/${uuid}/image`
)

/** Map UUID to thumbnail image URL. */
export const getThumbnailUrl = (uuid: string) => (
  `${BASE_URL}/uuids/${uuid}/thumbnail`
)
