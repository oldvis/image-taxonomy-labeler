import axios from 'axios'
import showProgressBar from '~/plugins/showProgressBar'
import { BASE_ALGORITHM_URL as BASE_URL } from './params'

const CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
}

/** Create a caption for a data object given its UUID. */
export const getCaption = showProgressBar(async (
  uuid: string,
) => {
  const caption = (
    await axios.get(
      `${BASE_URL}/uuids/${uuid}/caption`,
      CONFIG,
    )
  ).data as string
  return caption
})

/** Create captions for data objects given their UUIDs. */
export const getCaptions = showProgressBar(async (
  uuids: (string | null)[],
) => {
  const captions = (
    await axios.post(
      `${BASE_URL}/captioning`,
      JSON.stringify(uuids),
      CONFIG,
    )
  ).data as (string | null)[]
  return captions
})
