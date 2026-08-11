const DEFAULT_REGION = (process.env.NEXT_PUBLIC_DEFAULT_REGION || "in").toLowerCase()

const HIDE_REGION_PREFIX =
  process.env.NEXT_PUBLIC_HIDE_REGION_PREFIX !== "false"

const ensureLeadingSlash = (path: string) => {
  if (!path) {
    return "/"
  }

  return path.startsWith("/") ? path : `/${path}`
}

export const getPublicStorefrontPath = (
  path: string,
  countryCode?: string
) => {
  const normalizedPath = ensureLeadingSlash(path)

  if (HIDE_REGION_PREFIX) {
    return normalizedPath
  }

  const regionCode = (countryCode || DEFAULT_REGION).toLowerCase()

  if (normalizedPath === "/") {
    return `/${regionCode}`
  }

  return `/${regionCode}${normalizedPath}`
}

export const stripRegionPrefix = (path: string, countryCode?: string) => {
  const normalizedPath = ensureLeadingSlash(path)
  const regionCode = (countryCode || DEFAULT_REGION).toLowerCase()
  const prefix = `/${regionCode}`

  if (normalizedPath === prefix) {
    return "/"
  }

  if (normalizedPath.startsWith(`${prefix}/`)) {
    return normalizedPath.slice(prefix.length)
  }

  return normalizedPath
}

export const isRegionPrefixHidden = () => HIDE_REGION_PREFIX
