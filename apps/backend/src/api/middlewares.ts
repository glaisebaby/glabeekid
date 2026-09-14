import path from "node:path"
import { createReadStream, existsSync } from "node:fs"
import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  defineMiddlewares,
} from "@medusajs/framework/http"
import {
  MASTER_ACCOUNT_ROLE,
  assertAdminRole,
  createAuditLog,
  ensureAccessControlTables,
  getAdminUserByActorId,
  getDatabaseClient,
  seedDefaultAdminRoles,
  summarizeAdminMutation,
} from "../lib/access-control"

const PRODUCT_IMAGE_UPLOAD_SIZE_LIMIT = "5mb"
const ADMIN_ASSETS_DIR = path.join(process.cwd(), "public", "admin", "assets")
const ASSET_CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
}

const serveAdminAsset = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const assetName = decodeURIComponent(req.path.replace(/^\/app\/assets\//, ""))
  const assetPath = path.resolve(ADMIN_ASSETS_DIR, assetName)

  if (!assetPath.startsWith(path.resolve(ADMIN_ASSETS_DIR) + path.sep)) {
    return res.status(400).send("Invalid asset path")
  }

  if (!existsSync(assetPath)) {
    return next()
  }

  const extension = path.extname(assetPath).toLowerCase()
  res.setHeader(
    "Content-Type",
    ASSET_CONTENT_TYPES[extension] || "application/octet-stream"
  )
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable")

  return createReadStream(assetPath).pipe(res)
}

const auditAdminMutation = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const bodySnapshot =
    req.body && typeof req.body === "object" ? { ...(req.body as object) } : {}
  const routeSnapshot = req.path
  const methodSnapshot = req.method
  const paramsSnapshot = { ...(req.params ?? {}) }
  const actorId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id

  res.on("finish", async () => {
    if (res.statusCode >= 400 || !actorId) {
      return
    }

    const summary = summarizeAdminMutation({
      method: methodSnapshot,
      path: routeSnapshot,
      params: paramsSnapshot,
      body: bodySnapshot as Record<string, unknown>,
    })

    const client = await getDatabaseClient().catch(() => null)

    if (!client) {
      return
    }

    try {
      await ensureAccessControlTables(client)
      await seedDefaultAdminRoles(client)

      const actor = await getAdminUserByActorId(client, actorId)

      if (!actor) {
        return
      }

      await createAuditLog({
        client,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: summary.action,
        entityType: summary.entityType,
        entityId: summary.entityId,
        targetLabel: summary.targetLabel,
        route: routeSnapshot,
        method: methodSnapshot,
        statusCode: res.statusCode,
        details: {
          changed_fields: Object.keys(
            (bodySnapshot as Record<string, unknown>) ?? {}
          ),
          request_body: bodySnapshot,
        },
      })
    } finally {
      await client.end().catch(() => undefined)
    }
  })

  next()
}

const requireMasterForStoreSettings = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const client = await getDatabaseClient().catch(() => null)

  if (!client) {
    return res
      .status(500)
      .json({ message: "Access control database connection failed." })
  }

  try {
    const permission = await assertAdminRole(
      req as AuthenticatedMedusaRequest,
      client,
      [MASTER_ACCOUNT_ROLE]
    )

    if (!permission.ok) {
      return res.status(permission.status).json({ message: permission.message })
    }

    return next()
  } finally {
    await client.end().catch(() => undefined)
  }
}

export default defineMiddlewares([
  {
    methods: ["GET"],
    matcher: "/app/assets/*",
    middlewares: [serveAdminAsset],
  },
  {
    methods: ["POST"],
    matcher: "/admin/uploads",
    bodyParser: {
      sizeLimit: PRODUCT_IMAGE_UPLOAD_SIZE_LIMIT,
    },
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/stores",
    middlewares: [requireMasterForStoreSettings, auditAdminMutation],
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/stores/*",
    middlewares: [requireMasterForStoreSettings, auditAdminMutation],
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/products",
    middlewares: [auditAdminMutation],
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/products/*",
    middlewares: [auditAdminMutation],
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/price-lists",
    middlewares: [auditAdminMutation],
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/price-lists/*",
    middlewares: [auditAdminMutation],
  },
  {
    methods: ["POST", "DELETE"],
    matcher: "/admin/users/*",
    middlewares: [auditAdminMutation],
  },
])
