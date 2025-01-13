/** Check whether the URL uses https protocol. */
export const isHttps = (url: string | null | undefined): boolean => {
  if (url === null || url === undefined) {
    return false
  }
  return new URL(url).protocol === 'https:'
}

/** Check whether the URL's hostname is localhost. */
export const isLocalhost = (url: string | null | undefined): boolean => {
  if (url === null || url === undefined) {
    return false
  }
  return new URL(url).hostname === 'localhost'
}
