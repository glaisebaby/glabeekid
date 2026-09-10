import { MedusaError } from "@medusajs/framework/utils"
import crypto from "crypto"
import { Client } from "pg"
import {
  MasterSettings,
  getMasterSettings,
  updateMasterSettings,
} from "./master-settings"

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

type FacebookTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: {
    message?: string
  }
}

type FacebookPageResponse = {
  data?: {
    id?: string
    name?: string
    access_token?: string
    instagram_business_account?: {
      id?: string
      username?: string
      name?: string
    }
  }[]
  error?: {
    message?: string
  }
}

type DebugTokenResponse = {
  data?: {
    expires_at?: number
    is_valid?: boolean
    scopes?: string[]
  }
  error?: {
    message?: string
  }
}

const requiredInstagramPermissions = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
]

const getConfiguredApiVersion = (settings: MasterSettings) =>
  String(settings.instagram_graph_api_version || "v24.0")
    .trim()
    .replace(/^\/+|\/+$/g, "")

const assertMetaAppConfigured = (settings: MasterSettings) => {
  const appId = String(settings.instagram_meta_app_id || "").trim()
  const appSecret = String(settings.instagram_meta_app_secret || "").trim()

  if (!appId || !appSecret) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Configure Meta App ID and App Secret in Social Media Settings first."
    )
  }

  return {
    appId,
    appSecret,
    apiVersion: getConfiguredApiVersion(settings),
  }
}

const createStateSignature = (payload: string, appSecret: string) =>
  crypto.createHmac("sha256", appSecret).update(payload).digest("hex")

export const createInstagramOAuthState = ({
  appSecret,
  actorId,
}: {
  appSecret: string
  actorId: string
}) => {
  const payload = Buffer.from(
    JSON.stringify({
      actorId,
      nonce: crypto.randomBytes(16).toString("hex"),
      issuedAt: Date.now(),
    })
  ).toString("base64url")
  const signature = createStateSignature(payload, appSecret)

  return `${payload}.${signature}`
}

export const verifyInstagramOAuthState = ({
  state,
  appSecret,
  actorId,
}: {
  state: string
  appSecret: string
  actorId: string
}) => {
  const [payload, signature] = state.split(".")

  if (!payload || !signature) {
    return false
  }

  const expectedSignature = createStateSignature(payload, appSecret)

  if (signature.length !== expectedSignature.length) {
    return false
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return false
  }

  const parsed = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8")
  ) as {
    actorId?: string
    issuedAt?: number
  }
  const ageMs = Date.now() - Number(parsed.issuedAt || 0)

  return parsed.actorId === actorId && ageMs >= 0 && ageMs < 10 * 60 * 1000
}

export const getInstagramOAuthUrl = async ({
  client,
  actorId,
  redirectUri,
}: {
  client: Client
  actorId: string
  redirectUri: string
}) => {
  const settings = await getMasterSettings(client)
  const { appId, appSecret, apiVersion } = assertMetaAppConfigured(settings)
  const state = createInstagramOAuthState({ appSecret, actorId })
  const url = new URL(`https://www.facebook.com/${apiVersion}/dialog/oauth`)

  url.searchParams.set("client_id", appId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("state", state)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", requiredInstagramPermissions.join(","))

  return url.toString()
}

const fetchGraphJson = async <T>(url: URL) => {
  const response = await fetch(url)
  const payload = (await response.json().catch(() => null)) as T & {
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      payload?.error?.message ||
        `Meta request failed with status ${response.status}.`
    )
  }

  return payload
}

const exchangeCodeForShortLivedToken = async ({
  apiVersion,
  appId,
  appSecret,
  code,
  redirectUri,
}: {
  apiVersion: string
  appId: string
  appSecret: string
  code: string
  redirectUri: string
}) => {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`)

  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("code", code)

  const payload = await fetchGraphJson<FacebookTokenResponse>(url)

  if (!payload.access_token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Meta did not return a short-lived access token."
    )
  }

  return payload.access_token
}

const exchangeForLongLivedToken = async ({
  apiVersion,
  appId,
  appSecret,
  shortLivedToken,
}: {
  apiVersion: string
  appId: string
  appSecret: string
  shortLivedToken: string
}) => {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/oauth/access_token`)

  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("fb_exchange_token", shortLivedToken)

  const payload = await fetchGraphJson<FacebookTokenResponse>(url)

  if (!payload.access_token) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Meta did not return a long-lived access token."
    )
  }

  return {
    token: payload.access_token,
    expiresIn: payload.expires_in,
  }
}

const getTokenExpiry = async ({
  apiVersion,
  appId,
  appSecret,
  token,
  fallbackExpiresIn,
}: {
  apiVersion: string
  appId: string
  appSecret: string
  token: string
  fallbackExpiresIn?: number
}) => {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/debug_token`)

  url.searchParams.set("input_token", token)
  url.searchParams.set("access_token", `${appId}|${appSecret}`)

  const payload = await fetchGraphJson<DebugTokenResponse>(url)

  if (payload.data?.expires_at) {
    return new Date(payload.data.expires_at * 1000).toISOString()
  }

  if (fallbackExpiresIn) {
    return new Date(Date.now() + fallbackExpiresIn * 1000).toISOString()
  }

  return ""
}

const findInstagramPage = async ({
  apiVersion,
  token,
}: {
  apiVersion: string
  token: string
}) => {
  const url = new URL(`https://graph.facebook.com/${apiVersion}/me/accounts`)

  url.searchParams.set(
    "fields",
    "id,name,access_token,instagram_business_account{id,username,name}"
  )
  url.searchParams.set("access_token", token)

  const payload = await fetchGraphJson<FacebookPageResponse>(url)
  const page = (payload.data ?? []).find(
    (item) => item.instagram_business_account?.id
  )

  if (!page?.id || !page.instagram_business_account?.id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No linked Instagram professional account was found on your Facebook Pages."
    )
  }

  return page
}

export const completeInstagramOAuth = async ({
  client,
  actorUserId,
  actorEmail,
  code,
  state,
  redirectUri,
}: {
  client: Client
  actorUserId: string
  actorEmail: string
  code: string
  state: string
  redirectUri: string
}) => {
  const settings = await getMasterSettings(client)
  const { appId, appSecret, apiVersion } = assertMetaAppConfigured(settings)

  if (
    !verifyInstagramOAuthState({
      state,
      appSecret,
      actorId: actorUserId,
    })
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Instagram connection state is invalid or expired. Please try again."
    )
  }

  const shortLivedToken = await exchangeCodeForShortLivedToken({
    apiVersion,
    appId,
    appSecret,
    code,
    redirectUri,
  })
  const longLivedToken = await exchangeForLongLivedToken({
    apiVersion,
    appId,
    appSecret,
    shortLivedToken,
  })
  const page = await findInstagramPage({
    apiVersion,
    token: longLivedToken.token,
  })
  const tokenExpiresAt = await getTokenExpiry({
    apiVersion,
    appId,
    appSecret,
    token: longLivedToken.token,
    fallbackExpiresIn: longLivedToken.expiresIn,
  })
  const instagramAccount = page.instagram_business_account!

  await updateMasterSettings({
    client,
    updates: {
      instagram_enabled: true,
      instagram_access_token: longLivedToken.token,
      instagram_access_token_expires_at: tokenExpiresAt,
      instagram_facebook_page_id: String(page.id || ""),
      instagram_facebook_page_name: String(page.name || ""),
      instagram_business_account_id: String(instagramAccount.id || ""),
      instagram_business_username: String(
        instagramAccount.username || instagramAccount.name || ""
      ),
    },
    actorUserId,
    actorEmail,
  })

  return {
    pageId: page.id,
    pageName: page.name,
    instagramBusinessAccountId: instagramAccount.id,
    instagramUsername: instagramAccount.username || instagramAccount.name || "",
    tokenExpiresAt,
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
