import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  createAuditLog,
  getDatabaseClient,
} from "../../../../lib/access-control"
import { fetchInstagramReels } from "../../../../lib/instagram"

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

    const payload = await fetchInstagramReels(client)

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "instagram_feed_tested",
      entityType: "social_media_settings",
      route: "/admin/social-media-settings/instagram-test",
      method: "POST",
      statusCode: 200,
      details: {
        reel_count: payload.reels.length,
      },
    })

    return res.status(200).json(payload)
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Instagram request failed.",
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
