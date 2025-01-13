/**
 * Randomly shuffle array.
 * Time complexity: O(array.length)
 * Space complexity: O(array.length)
 */
export const randomShuffle = <T>(
  array: T[],
  random: () => number = Math.random,
): T[] => {
  // Durstenfeld shuffle
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Randomly choose size samples from array without replacement.
 * Time complexity: O(array.length)
 * Space complexity: O(array.length)
 */
export const randomChoice = <T>(
  array: T[],
  size: number,
  random: () => number = Math.random,
): T[] => {
  // random sample with replacement
  const selection = [...Array.from({ length: array.length }).keys()]
  const shuffled = randomShuffle(selection, random)
  const indices = shuffled.slice(0, size)
  const samples = indices.map((d) => array[d])
  return samples
}
