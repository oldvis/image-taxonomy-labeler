/** Check whether the URL uses https protocol. */
export const isHttps = (url: string | null | undefined): boolean => {
  if (url === null || url === undefined) return false
  try {
    return new URL(url).protocol === 'https:'
  }
  catch {
    return false
  }
}

/** Check whether the URL's hostname is a loopback host. */
export const isLocalhost = (url: string | null | undefined): boolean => {
  if (url === null || url === undefined) return false
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1'
  }
  catch {
    return false
  }
}
