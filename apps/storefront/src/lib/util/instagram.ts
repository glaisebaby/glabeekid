export const getInstagramEmbedUrl = (url: string) => {
  const trimmed = url.trim()

  if (!trimmed) {
    return ""
  }

  try {
    const parsed = new URL(trimmed)
    const isInstagramHost =
      parsed.hostname === "instagram.com" ||
      parsed.hostname === "www.instagram.com"

    if (!isInstagramHost) {
      return ""
    }

    parsed.search = ""
    parsed.hash = ""

    const pathname = parsed.pathname.replace(/\/+$/, "")
    const canEmbed =
      pathname.startsWith("/p/") ||
      pathname.startsWith("/reel/") ||
      pathname.startsWith("/tv/")

    if (!canEmbed) {
      return ""
    }

    return `https://www.instagram.com${pathname}/embed`
  } catch {
    return ""
  }
}
