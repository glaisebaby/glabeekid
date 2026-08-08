import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  _req: MedusaRequest,
  res: MedusaResponse
) {
  return res.status(200).json({
    ok: true,
    service: "glabeekid-medusa-backend",
    route: "/ping",
    timestamp: new Date().toISOString(),
  })
}
