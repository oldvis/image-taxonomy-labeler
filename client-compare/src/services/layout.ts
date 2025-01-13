import axios from 'axios'
import showProgressBar from '~/plugins/showProgressBar'
import { BASE_ALGORITHM_URL as BASE_URL } from './params'

const CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
}

/**
 * Compute a grid layout for the data objects given their UUIDs.
 * Returns the assignment stored as a list of <row index, col index>.
 */
export const assignGrid = showProgressBar(async (
  uuids: string[],
  nRows: number,
  nCols: number,
) => {
  const assignment = (
    await axios.post(
      `${BASE_URL}/assignGrid`,
      JSON.stringify({ uuids, nRows, nCols }),
      CONFIG,
    )
  ).data as [number, number][]
  return assignment
})
