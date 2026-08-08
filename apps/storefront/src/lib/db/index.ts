import "server-only"

import { Pool } from "pg"

const connectionString =
  process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/glabeekid"

declare global {
  var glabeekidPgPool: Pool | undefined
}

export const pgPool =
  global.glabeekidPgPool ||
  new Pool({
    connectionString,
  })

if (process.env.NODE_ENV !== "production") {
  global.glabeekidPgPool = pgPool
}
