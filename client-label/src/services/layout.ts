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

/**
 * Compute a grid layout for the data objects given their UUIDs.
 * Returns the assignment stored as a list of <row index, col index>.
 */
export const assignGrid = withProgressBar(async (
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
