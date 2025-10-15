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

/** Clustering the data objects given their UUIDs. */
export const clustering = withProgressBar(async (
  uuids: string[],
  nClusters: number,
) => {
  const labels = (
    await axios.post(
      `${BASE_URL}/clustering`,
      JSON.stringify({ uuids, nClusters }),
      CONFIG,
    )
  ).data as number[]
  return labels
})

/** Find the center data object among the data objects given their UUIDs. */
export const findCenter = withProgressBar(async (
  uuids: string[],
): Promise<string | null> => {
  if (uuids.length === 0) return null
  const uuid = (
    await axios.post(
      `${BASE_URL}/findCenter`,
      JSON.stringify(uuids),
      CONFIG,
    )
  ).data as string
  return uuid
})

/** Find the center data objects in each group given their UUIDs. */
export const findCenters = withProgressBar(async (
  groups: string[][],
): Promise<(string | null)[]> => {
  const uuids = (
    await axios.post(
      `${BASE_URL}/findCenters`,
      JSON.stringify(groups),
      CONFIG,
    )
  ).data as (string | null)[]
  return uuids
})
