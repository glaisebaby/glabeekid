import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  createAuditLog,
  getDatabaseClient,
} from "../../../lib/access-control"
import {
  getMasterSettingsForAdmin,
  updateMasterSettings,
} from "../../../lib/master-settings"

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

    const payload = await getMasterSettingsForAdmin(client)

    return res.status(200).json(payload)
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const client = await getDatabaseClient()

  try {
    const permission = await assertMasterAccount(req, client)

    if (!permission.ok) {
      return res.status(permission.status).json({ message: permission.message })
    }

    const body = (req.body ?? {}) as Record<string, string | boolean>
    const settings = await updateMasterSettings({
      client,
      updates: {
        instagram_enabled: Boolean(body.instagram_enabled),
        instagram_graph_api_version: String(
          body.instagram_graph_api_version || "v24.0"
        ),
        instagram_business_account_id: String(
          body.instagram_business_account_id || ""
        ),
        instagram_access_token: String(body.instagram_access_token || ""),
        instagram_access_token_expires_at: String(
          body.instagram_access_token_expires_at || ""
        ),
        instagram_homepage_reels_limit: String(
          body.instagram_homepage_reels_limit || "6"
        ),
      },
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
    })

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "social_media_settings_updated",
      entityType: "social_media_settings",
      route: "/admin/social-media-settings",
      method: "POST",
      statusCode: 200,
      details: {
        changed_fields: Object.keys(body).filter(
          (key) => key !== "instagram_access_token"
        ),
        instagram_access_token_changed:
          typeof body.instagram_access_token === "string" &&
          body.instagram_access_token.trim().length > 0,
      },
    })

    return res.status(200).json({
      message: "Social media settings updated successfully.",
      settings,
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
