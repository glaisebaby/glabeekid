import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getDatabaseClient } from "../../../../lib/access-control"
import { checkDelhiveryPincodeServiceability } from "../../../../lib/delhivery"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pincode = String(req.query.pincode || "").trim()

  if (!pincode) {
    return res.status(400).json({ message: "Provide a pincode." })
  }

  const client = await getDatabaseClient()

  try {
    const payload = await checkDelhiveryPincodeServiceability(client, pincode)

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
