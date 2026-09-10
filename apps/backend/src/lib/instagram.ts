import { MedusaError } from "@medusajs/framework/utils"
import { Client } from "pg"
import { getMasterSettings } from "./master-settings"

export type InstagramReel = {
  id: string
  caption: string
  mediaType: string
  mediaProductType: string
  mediaUrl: string
  thumbnailUrl: string
  permalink: string
  timestamp: string
}

type InstagramApiMedia = {
  id?: string
  caption?: string
  media_type?: string
  media_product_type?: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
}

type InstagramApiResponse = {
  data?: InstagramApiMedia[]
  error?: {
    message?: string
    type?: string
    code?: number
  }
}

export const normalizeInstagramLimit = (value: string | boolean) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 6
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 12)
}

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

export const fetchInstagramReels = async (client: Client) => {
  const settings = await getMasterSettings(client)

  if (!settings.instagram_enabled) {
    return {
      enabled: false,
      reels: [] as InstagramReel[],
    }
  }

  const accountId = String(settings.instagram_business_account_id || "").trim()
  const accessToken = String(settings.instagram_access_token || "").trim()
  const apiVersion = String(settings.instagram_graph_api_version || "v24.0")
    .trim()
    .replace(/^\/+|\/+$/g, "")
  const limit = normalizeInstagramLimit(settings.instagram_homepage_reels_limit)

  if (!accountId || !accessToken) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Configure the Instagram business account ID and access token in Social Media Settings."
    )
  }

  const url = new URL(
    `https://graph.facebook.com/${apiVersion}/${accountId}/media`
  )
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp"
  )
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("access_token", accessToken)

  const response = await fetch(url)
  const payload = (await response.json().catch(() => null)) as
    | InstagramApiResponse
    | null

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      payload?.error?.message ||
        `Instagram request failed with status ${response.status}.`
    )
  }

  const reels = (payload?.data ?? [])
    .filter((item) => {
      const mediaType = String(item.media_type || "").toUpperCase()
      const productType = String(item.media_product_type || "").toUpperCase()

      return mediaType === "VIDEO" || productType === "REELS"
    })
    .map((item) => ({
      id: String(item.id || ""),
      caption: String(item.caption || ""),
      mediaType: String(item.media_type || ""),
      mediaProductType: String(item.media_product_type || ""),
      mediaUrl: String(item.media_url || ""),
      thumbnailUrl: String(item.thumbnail_url || item.media_url || ""),
      permalink: String(item.permalink || ""),
      timestamp: String(item.timestamp || ""),
    }))
    .filter((item) => item.id && item.permalink)

  return {
    enabled: true,
    reels,
  }
}
