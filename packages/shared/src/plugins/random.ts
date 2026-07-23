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
