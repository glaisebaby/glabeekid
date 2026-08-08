import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ensureAccessControlTables,
  getActorContext,
  getDatabaseClient,
  seedDefaultAdminRoles,
} from "../../../../lib/access-control"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const client = await getDatabaseClient()

  try {
    await ensureAccessControlTables(client)
    await seedDefaultAdminRoles(client)

    const context = await getActorContext(req, client)

    if (!context?.actor) {
      return res.status(401).json({ message: "Authentication required." })
    }

    return res.status(200).json({
      user: {
        id: context.actor.id,
        email: context.actor.email,
        first_name: context.actor.first_name,
        last_name: context.actor.last_name,
      },
      role: context.role,
      is_master: context.role === "master_account",
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
