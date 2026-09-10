import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const databaseProfile = process.env.DATABASE_PROFILE || "production"

const databaseUrl =
  databaseProfile === "local"
    ? process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL
    : process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL

const productImageUploadSizeLimit = 5 * 1024 * 1024
const publicBackendUrl = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.glabee.in"
    : "http://localhost:9000")
).replace(/\/$/, "")

module.exports = defineConfig({
  admin: {
    maxUploadFileSize: productImageUploadSizeLimit,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: `${publicBackendUrl}/static`,
            },
          },
        ],
      },
    },
  ],
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
