import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  canViewAnalytics,
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

    const canViewReports = await canViewAnalytics(client, context.actor.email)
    const isMaster = context.role === "master_account"

    return res.status(200).json({
      user: {
        id: context.actor.id,
        email: context.actor.email,
        first_name: context.actor.first_name,
        last_name: context.actor.last_name,
      },
      role: context.role,
      is_master: isMaster,
      permissions: {
        can_view_reports: canViewReports,
        can_manage_master_settings: isMaster,
        can_view_activity_logs: isMaster,
        can_manage_access_control: isMaster,
        can_view_customer_accounts: isMaster,
      },
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
