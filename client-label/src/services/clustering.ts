import axios from 'axios'
import showProgressBar from '~/plugins/showProgressBar'
import { BASE_ALGORITHM_URL as BASE_URL } from './params'

const CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
}

/** Clustering the data objects given their UUIDs. */
export const clustering = showProgressBar(async (
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
export const findCenter = showProgressBar(async (
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
export const findCenters = showProgressBar(async (
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
