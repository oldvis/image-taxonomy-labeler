import axios from 'axios'
import withProgressBar from 'with-progress-bar'
import { BASE_ALGORITHM_URL as BASE_URL } from './params'
import 'with-progress-bar/style.css'

const CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
}

/** Smallest row/col counts that fit n cells at the given aspect ratio (cols / rows). */
export const computeDenseGridShape = (
  n: number,
  aspectRatio: number = 2,
): { nRows: number, nCols: number } => {
  let nRows = Math.ceil(Math.sqrt(n / aspectRatio))
  let nCols = Math.ceil(Math.sqrt(n * aspectRatio))
  while (nRows * nCols > n) {
    if (nRows >= 2 && (nRows - 1) * nCols >= n) {
      nRows -= 1
    }
    else if (nCols >= 2 && nRows * (nCols - 1) >= n) {
      nCols -= 1
    }
    else {
      break
    }
  }
  return { nRows, nCols }
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
