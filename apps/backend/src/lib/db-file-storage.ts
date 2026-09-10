import { Readable } from "node:stream"
import { Client } from "pg"

type StoredFile = {
  key: string
  mimeType: string
  content: Buffer
}

export const getPublicBackendUrl = () =>
  (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.glabee.in"
      : "http://localhost:9000")
  ).replace(/\/$/, "")

const getDatabaseClient = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  return client
}

export const ensureDbFileStorageTable = async (client: Client) => {
  await client.query(`
    create table if not exists public.glabee_file_storage (
      key text primary key,
      mime_type text not null,
      content bytea not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
}

export const createDbFileKey = (filename: string) => {
  const parts = filename.split(/[\\/]/)
  const name = parts[parts.length - 1] || "upload"
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "-")

  return `${Date.now()}-${safeName}`
}

export const getDbFileUrl = (key: string) =>
  `${getPublicBackendUrl()}/static/${encodeURIComponent(key)}`

export const decodeUploadContent = (content: string, mimeType?: string) => {
  const decodedBase64 = Buffer.from(content, "base64")

  if (decodedBase64.toString("base64") === content) {
    return decodedBase64
  }

  const isTextContent =
    mimeType?.startsWith("text/") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("json") ||
    mimeType?.includes("xml")

  return isTextContent ? Buffer.from(content, "utf8") : Buffer.from(content, "binary")
}

export const saveDbFile = async ({
  key,
  mimeType,
  content,
}: StoredFile) => {
  const client = await getDatabaseClient()

  try {
    await ensureDbFileStorageTable(client)
    await client.query(
      `
        insert into public.glabee_file_storage (key, mime_type, content)
        values ($1, $2, $3)
        on conflict (key) do update set
          mime_type = excluded.mime_type,
          content = excluded.content,
          updated_at = now()
      `,
      [key, mimeType, content]
    )
  } finally {
    await client.end().catch(() => undefined)
  }
}

export const deleteDbFiles = async (keys: string[]) => {
  if (!keys.length) {
    return
  }

  const client = await getDatabaseClient()

  try {
    await ensureDbFileStorageTable(client)
    await client.query(
      "delete from public.glabee_file_storage where key = any($1::text[])",
      [keys]
    )
  } finally {
    await client.end().catch(() => undefined)
  }
}

export const getDbFile = async (key: string) => {
  const client = await getDatabaseClient()

  try {
    await ensureDbFileStorageTable(client)
    const result = await client.query(
      "select key, mime_type, content from public.glabee_file_storage where key = $1",
      [key]
    )

    if (!result.rows[0]) {
      return null
    }

    return {
      key: result.rows[0].key as string,
      mimeType: result.rows[0].mime_type as string,
      content: result.rows[0].content as Buffer,
    }
  } finally {
    await client.end().catch(() => undefined)
  }
}

export const getDbFileStream = async (key: string) => {
  const file = await getDbFile(key)

  if (!file) {
    return null
  }

  return {
    mimeType: file.mimeType,
    stream: Readable.from(file.content),
  }
}
