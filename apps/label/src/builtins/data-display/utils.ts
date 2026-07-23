/** Check whether the URL uses https protocol. */
export const isHttps = (url: string | null | undefined): boolean => {
  if (url === null || url === undefined) {
    return false
  }
  return new URL(url).protocol === 'https:'
}

/** Check whether the URL's hostname is a loopback host. */
export const isLocalhost = (url: string | null | undefined): boolean => {
  if (url === null || url === undefined) {
    return false
  }
  const host = new URL(url).hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}
