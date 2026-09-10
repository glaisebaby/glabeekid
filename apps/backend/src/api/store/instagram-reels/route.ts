import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getDatabaseClient } from "../../../lib/access-control"
import { fetchInstagramReels } from "../../../lib/instagram"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const client = await getDatabaseClient()

  try {
    const payload = await fetchInstagramReels(client)

    return res.status(200).json(payload)
  } catch (error) {
    return res.status(200).json({
      enabled: false,
      reels: [],
      message:
        error instanceof Error ? error.message : "Instagram feed unavailable.",
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
