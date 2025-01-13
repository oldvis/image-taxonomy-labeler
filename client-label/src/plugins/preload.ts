/** Preload images in parallel for maximal preload speed. */
export const preloadParallel = (urls: string[]) => {
  const cache: HTMLImageElement[] = []
  urls.forEach((d) => {
    const img = new Image()
    img.src = d
    cache.push(img)
  })
  return cache
}

/** Preload images sequentially to avoid blocking the network. */
export const preloadSequential = (urls: string[]) => {
  const cache: HTMLImageElement[] = []
  const preload = (i: number): void => {
    if (urls.length <= i) return
    const img = new Image()
    img.onload = () => {
      cache.push(img)
      preload(i + 1)
    }
    img.src = urls[i]
  }
  preload(0)
  return cache
}
