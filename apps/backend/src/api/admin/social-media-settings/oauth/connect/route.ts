import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  createAuditLog,
  getDatabaseClient,
} from "../../../../../lib/access-control"
import { getInstagramOAuthUrl } from "../../../../../lib/instagram"

const getBaseUrl = (req: AuthenticatedMedusaRequest) => {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "https")
  const forwardedHost = String(req.headers["x-forwarded-host"] || "")
  const host = forwardedHost || String(req.headers.host || "")

  return `${forwardedProto}://${host}`
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const client = await getDatabaseClient()

  try {
    const permission = await assertMasterAccount(req, client)

    if (!permission.ok) {
      return res.status(permission.status).json({ message: permission.message })
    }

    const redirectUri = `${getBaseUrl(
      req
    )}/admin/social-media-settings/oauth/callback`
    const oauthUrl = await getInstagramOAuthUrl({
      client,
      actorId: permission.actor.id,
      redirectUri,
    })

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "instagram_oauth_started",
      entityType: "social_media_settings",
      route: "/admin/social-media-settings/oauth/connect",
      method: "GET",
      statusCode: 302,
    })

    return res.redirect(oauthUrl)
  } finally {
    await client.end().catch(() => undefined)
  }
}
