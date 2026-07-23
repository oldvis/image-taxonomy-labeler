import { resolveBaseUrl, resolveServiceFlags } from './resolveParams'

const DEFAULT_API_BASE = 'http://localhost:5001'

export const BASE_IMAGE_URL = resolveBaseUrl(
  import.meta.env.VITE_API_BASE as string | undefined,
  DEFAULT_API_BASE,
)
export const BASE_ALGORITHM_URL = resolveBaseUrl(
  import.meta.env.VITE_API_BASE as string | undefined,
  DEFAULT_API_BASE,
)

const flags = resolveServiceFlags(
  import.meta.env.VITE_USE_SERVICES as string | undefined,
  typeof document !== 'undefined' ? document.URL : 'http://localhost',
)

export const USE_IMAGE_SERVICE = flags.useImageService
export const USE_ALGORITHM_SERVICE = flags.useAlgorithmService
