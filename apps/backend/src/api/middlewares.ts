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
