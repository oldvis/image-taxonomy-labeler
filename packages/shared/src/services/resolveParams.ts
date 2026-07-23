export function resolveBaseUrl(
  envValue: string | undefined,
  fallback: string,
): string {
  const trimmed = envValue?.trim()
  return trimmed ? trimmed.replace(/\/$/, '') : fallback
}

export function resolveServiceFlags(
  useServicesEnv: string | undefined,
  pageUrl: string,
): { useImageService: boolean, useAlgorithmService: boolean } {
  const normalized = useServicesEnv?.trim().toLowerCase()
  if (normalized === 'false' || normalized === '0') {
    return { useImageService: false, useAlgorithmService: false }
  }
  if (normalized === 'true' || normalized === '1') {
    return { useImageService: true, useAlgorithmService: true }
  }
  const isLocal = pageUrl.startsWith('http://localhost')
    || pageUrl.startsWith('http://127.0.0.1')
  return { useImageService: isLocal, useAlgorithmService: isLocal }
}
