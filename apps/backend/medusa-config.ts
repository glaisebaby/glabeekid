import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const databaseProfile = process.env.DATABASE_PROFILE || "production"

const databaseUrl =
  databaseProfile === "local"
    ? process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL
    : process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL

const productImageUploadSizeLimit = 5 * 1024 * 1024

const r2FileUrl = (process.env.R2_FILE_URL || "").replace(/\/$/, "")
const imageKitUrlEndpoint = (
  process.env.IMAGEKIT_URL_ENDPOINT || ""
).replace(/\/$/, "")
const publicBackendUrl = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.BACKEND_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.glabee.in"
    : "http://localhost:9000")
).replace(/\/$/, "")

const hasImageKitConfig =
  !!imageKitUrlEndpoint && !!process.env.IMAGEKIT_PRIVATE_KEY

const hasR2Config =
  !!r2FileUrl &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET &&
  !!process.env.R2_ENDPOINT

const fileProviderConfig = hasImageKitConfig
  ? {
      resolve: "./src/modules/imagekit-file-provider",
      id: "imagekit",
      options: {
        private_key: process.env.IMAGEKIT_PRIVATE_KEY,
        url_endpoint: imageKitUrlEndpoint,
        folder: process.env.IMAGEKIT_FOLDER || "/products",
      },
    }
  : hasR2Config
  ? {
      resolve: "@medusajs/medusa/file-s3",
      id: "r2",
      options: {
        file_url: r2FileUrl,
        access_key_id: process.env.R2_ACCESS_KEY_ID,
        secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
        region: process.env.R2_REGION || "auto",
        bucket: process.env.R2_BUCKET,
        endpoint: process.env.R2_ENDPOINT,
        prefix: process.env.R2_PREFIX || "products/",
        cache_control: "public, max-age=31536000, immutable",
        acl: false,
      },
    }
  : {
      resolve: "@medusajs/medusa/file-local",
      id: "local",
      options: {
        upload_dir: "static",
        backend_url: `${publicBackendUrl}/static`,
      },
    }

module.exports = defineConfig({
  admin: {
    maxUploadFileSize: productImageUploadSizeLimit,
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        provider: fileProviderConfig,
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
