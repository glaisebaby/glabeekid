import { MedusaResponse } from "@medusajs/framework/http"
import { promises as fs } from "fs"
import path from "path"

export const sendBrandAsset = async (
  res: MedusaResponse,
  fileName: string,
  contentType: string
) => {
  const file = await fs.readFile(path.join(process.cwd(), "public", fileName))

  res
    .status(200)
    .setHeader("Cache-Control", "public, max-age=31536000, immutable")
    .setHeader("Content-Type", contentType)
    .send(file)
}
