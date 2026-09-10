import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  createAuditLog,
  getDatabaseClient,
} from "../../../../../lib/access-control"
import { completeInstagramOAuth } from "../../../../../lib/instagram"

const getBaseUrl = (req: AuthenticatedMedusaRequest) => {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "https")
  const forwardedHost = String(req.headers["x-forwarded-host"] || "")
  const host = forwardedHost || String(req.headers.host || "")

  return `${forwardedProto}://${host}`
}

const redirectToSettings = (res: MedusaResponse, params: URLSearchParams) =>
  res.redirect(`/app/social-media-settings?${params.toString()}`)

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const client = await getDatabaseClient()

  try {
    const permission = await assertMasterAccount(req, client)

    if (!permission.ok) {
      return redirectToSettings(
        res,
        new URLSearchParams({
          instagram_status: "error",
          instagram_message: permission.message,
        })
      )
    }

    const errorMessage = String(req.query.error_message || req.query.error || "")

    if (errorMessage) {
      return redirectToSettings(
        res,
        new URLSearchParams({
          instagram_status: "error",
          instagram_message: errorMessage,
        })
      )
    }

    const code = String(req.query.code || "")
    const state = String(req.query.state || "")

    if (!code || !state) {
      return redirectToSettings(
        res,
        new URLSearchParams({
          instagram_status: "error",
          instagram_message: "Meta did not return an authorization code.",
        })
      )
    }

    const redirectUri = `${getBaseUrl(
      req
    )}/admin/social-media-settings/oauth/callback`
    const result = await completeInstagramOAuth({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      code,
      state,
      redirectUri,
    })

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "instagram_oauth_completed",
      entityType: "social_media_settings",
      route: "/admin/social-media-settings/oauth/callback",
      method: "GET",
      statusCode: 302,
      details: {
        facebook_page_id: result.pageId,
        instagram_business_account_id: result.instagramBusinessAccountId,
        instagram_username: result.instagramUsername,
        token_expires_at: result.tokenExpiresAt,
      },
    })

    return redirectToSettings(
      res,
      new URLSearchParams({
        instagram_status: "success",
        instagram_message: "Instagram connected successfully.",
      })
    )
  } catch (error) {
    return redirectToSettings(
      res,
      new URLSearchParams({
        instagram_status: "error",
        instagram_message:
          error instanceof Error
            ? error.message
            : "Instagram connection failed.",
      })
    )
  } finally {
    await client.end().catch(() => undefined)
  }
}
