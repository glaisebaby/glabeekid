import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { sendBrandAsset } from "../_brand-assets"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  await sendBrandAsset(res, "favicon.ico", "image/vnd.microsoft.icon")
}
