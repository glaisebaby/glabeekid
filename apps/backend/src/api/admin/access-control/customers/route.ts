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

    const result = await client.query<{
      id: string
      email: string | null
      first_name: string | null
      last_name: string | null
      has_account: boolean | null
      created_at: string
      updated_at: string
    }>(`
      select
        id,
        email,
        first_name,
        last_name,
        has_account,
        created_at,
        updated_at
      from public.customer
      order by created_at desc
    `)

    return res.status(200).json({
      role_label: "Customer accounts",
      customers: result.rows,
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
