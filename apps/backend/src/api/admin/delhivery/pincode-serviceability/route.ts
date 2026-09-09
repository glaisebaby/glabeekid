import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  createAuditLog,
  getDatabaseClient,
} from "../../../../lib/access-control"
import { checkDelhiveryPincodeServiceability } from "../../../../lib/delhivery"

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

    const body = (req.body ?? {}) as { pincode?: string }
    const pincode = body.pincode?.trim()

    if (!pincode) {
      return res.status(400).json({ message: "Provide a pincode." })
    }

    const payload = await checkDelhiveryPincodeServiceability(client, pincode)

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "delhivery_serviceability_checked",
      entityType: "delhivery_serviceability",
      targetLabel: pincode,
      route: "/admin/delhivery/pincode-serviceability",
      method: "POST",
      statusCode: 200,
      details: {
        pincode,
      },
    })

    return res.status(200).json(payload)
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Delhivery request failed.",
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
