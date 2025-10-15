import axios from 'axios'
import withProgressBar from 'with-progress-bar'
import { BASE_ALGORITHM_URL as BASE_URL } from './params'
import 'with-progress-bar/style.css'

const CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
}

/** Create a caption for a data object given its UUID. */
export const getCaption = withProgressBar(async (
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
export const getCaptions = withProgressBar(async (
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
