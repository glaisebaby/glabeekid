import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  getDatabaseClient,
} from "../../../../lib/access-control"

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

    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500)

    const result = await client.query<{
      id: number
      action: string
      entity_type: string
      entity_id: string | null
      target_label: string | null
      route: string
      method: string
      status_code: number
      actor_user_id: string | null
      actor_email: string | null
      details: Record<string, unknown>
      created_at: string
    }>(
      `
        select
          id,
          action,
          entity_type,
          entity_id,
          target_label,
          route,
          method,
          status_code,
          actor_user_id,
          actor_email,
          details,
          created_at
        from public.admin_activity_logs
        order by created_at desc
        limit $1
      `,
      [limit]
    )

    return res.status(200).json({
      logs: result.rows,
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
