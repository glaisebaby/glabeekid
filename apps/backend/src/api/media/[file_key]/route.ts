import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getDbFile } from "../../../lib/db-file-storage"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fileKey = req.params.file_key

  if (!fileKey) {
    return res.status(404).send("File not found")
  }

  const file = await getDbFile(fileKey)

  if (!file) {
    return res.status(404).send("File not found")
  }

  res
    .status(200)
    .setHeader("Content-Type", file.mimeType)
    .setHeader("Cache-Control", "public, max-age=31536000, immutable")
    .send(file.content)
}
