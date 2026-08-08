import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const databaseProfile = process.env.DATABASE_PROFILE || "production"

const databaseUrl =
  databaseProfile === "local"
    ? process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL
    : process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL

module.exports = defineConfig({
  projectConfig: {
    databaseUrl,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  }
})
