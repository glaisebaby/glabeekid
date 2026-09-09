import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { Client } from "pg"
import {
  getAnalyticsAllowedEmails,
  getMasterSettings,
  normalizeEmail,
  parseEmailList,
} from "./master-settings"

export const MASTER_ACCOUNT_ROLE = "master_account"
export const OPERATIONS_ADMIN_ROLE = "operations_admin"

export const AVAILABLE_ADMIN_ROLES = [
  {
    value: MASTER_ACCOUNT_ROLE,
    label: "Master Account",
    description:
      "Full operations access, reports, activity logs, and role assignment.",
  },
  {
    value: OPERATIONS_ADMIN_ROLE,
    label: "Operations Admin",
    description:
      "Can manage catalog and operations, but cannot access reports or activity logs.",
  },
] as const

export type AdminRole = (typeof AVAILABLE_ADMIN_ROLES)[number]["value"]

type AdminUserRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type RoleRow = {
  user_id: string
  email: string
  role: AdminRole
}

export const getDatabaseClient = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()

  return client
}

export const ensureAccessControlTables = async (client: Client) => {
  await client.query(`
    create table if not exists public.admin_user_roles (
      user_id text primary key references public."user"(id) on delete cascade,
      email text not null,
      role text not null,
      assigned_by_user_id text null,
      assigned_by_email text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await client.query(`
    create table if not exists public.admin_activity_logs (
      id bigserial primary key,
      action text not null,
      entity_type text not null,
      entity_id text null,
      target_label text null,
      route text not null,
      method text not null,
      status_code integer not null,
      actor_user_id text null,
      actor_email text null,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)
}

export const getAdminUserByActorId = async (
  client: Client,
  actorId?: string | null
) => {
  if (!actorId) {
    return null
  }

  const result = await client.query<AdminUserRow>(
    `select id, email, first_name, last_name from public."user" where id = $1 limit 1`,
    [actorId]
  )

  return result.rows[0] ?? null
}

export const seedDefaultAdminRoles = async (client: Client) => {
  const settings = await getMasterSettings(client)
  const masterEmail = normalizeEmail(String(settings.master_account_email || ""))
  const defaultOperationsEmails = parseEmailList(
    String(settings.default_operations_admin_emails || "")
  )
  const result = await client.query<AdminUserRow>(
    `select id, email, first_name, last_name from public."user"`
  )

  for (const user of result.rows) {
    const email = user.email.toLowerCase()
    let role: AdminRole | null = null

    if (email === masterEmail) {
      role = MASTER_ACCOUNT_ROLE
    } else if (defaultOperationsEmails.includes(email)) {
      role = OPERATIONS_ADMIN_ROLE
    }

    if (!role) {
      continue
    }

    await client.query(
      `
        insert into public.admin_user_roles (user_id, email, role)
        values ($1, $2, $3)
        on conflict (user_id)
        do update set
          email = excluded.email,
          role = excluded.role,
          updated_at = now()
      `,
      [user.id, user.email.toLowerCase(), role]
    )
  }
}

export const getAdminRoleForUser = async (
  client: Client,
  userId: string,
  email: string
): Promise<AdminRole | null> => {
  const normalizedEmail = email.toLowerCase()
  const settings = await getMasterSettings(client)
  const masterEmail = normalizeEmail(String(settings.master_account_email || ""))

  if (normalizedEmail === masterEmail) {
    return MASTER_ACCOUNT_ROLE
  }

  const result = await client.query<RoleRow>(
    `select user_id, email, role from public.admin_user_roles where user_id = $1 limit 1`,
    [userId]
  )

  return (result.rows[0]?.role as AdminRole | undefined) ?? null
}

export const canViewAnalytics = async (client: Client, email: string) => {
  const normalizedEmail = normalizeEmail(email)
  const settings = await getMasterSettings(client)
  const masterEmail = normalizeEmail(String(settings.master_account_email || ""))

  if (normalizedEmail === masterEmail) {
    return true
  }

  const allowedEmails = await getAnalyticsAllowedEmails(client)

  return allowedEmails.includes(normalizedEmail)
}

export const getActorContext = async (
  req: AuthenticatedMedusaRequest,
  client: Client
) => {
  const actor = await getAdminUserByActorId(client, req.auth_context?.actor_id)

  if (!actor) {
    return null
  }

  const role = await getAdminRoleForUser(client, actor.id, actor.email)

  return {
    actor,
    role,
  }
}

export const assertMasterAccount = async (
  req: AuthenticatedMedusaRequest,
  client: Client
) => {
  await ensureAccessControlTables(client)
  await seedDefaultAdminRoles(client)

  const context = await getActorContext(req, client)

  if (!context?.actor) {
    return {
      ok: false as const,
      status: 401,
      message: "Authentication required.",
    }
  }

  if (context.role !== MASTER_ACCOUNT_ROLE) {
    return {
      ok: false as const,
      status: 403,
      message: "Only the master account can access this area.",
    }
  }

  return {
    ok: true as const,
    ...context,
  }
}

export const assertAdminRole = async (
  req: AuthenticatedMedusaRequest,
  client: Client,
  allowedRoles: AdminRole[]
) => {
  await ensureAccessControlTables(client)
  await seedDefaultAdminRoles(client)

  const context = await getActorContext(req, client)

  if (!context?.actor) {
    return {
      ok: false as const,
      status: 401,
      message: "Authentication required.",
    }
  }

  if (!context.role || !allowedRoles.includes(context.role)) {
    return {
      ok: false as const,
      status: 403,
      message: "You do not have permission to access this area.",
    }
  }

  return {
    ok: true as const,
    ...context,
  }
}

export const sanitizeAuditDetails = (details: Record<string, unknown>) => {
  return JSON.parse(
    JSON.stringify(details, (_, value) => {
      if (typeof value === "string" && value.length > 500) {
        return `${value.slice(0, 500)}...`
      }

      return value
    })
  )
}

export const createAuditLog = async ({
  client,
  actorUserId,
  actorEmail,
  action,
  entityType,
  entityId,
  targetLabel,
  route,
  method,
  statusCode,
  details,
}: {
  client: Client
  actorUserId?: string | null
  actorEmail?: string | null
  action: string
  entityType: string
  entityId?: string | null
  targetLabel?: string | null
  route: string
  method: string
  statusCode: number
  details?: Record<string, unknown>
}) => {
  await ensureAccessControlTables(client)

  await client.query(
    `
      insert into public.admin_activity_logs
      (action, entity_type, entity_id, target_label, route, method, status_code, actor_user_id, actor_email, details)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    `,
    [
      action,
      entityType,
      entityId ?? null,
      targetLabel ?? null,
      route,
      method,
      statusCode,
      actorUserId ?? null,
      actorEmail?.toLowerCase() ?? null,
      JSON.stringify(sanitizeAuditDetails(details ?? {})),
    ]
  )
}

export const summarizeAdminMutation = (input: {
  method: string
  path: string
  params?: Record<string, string>
  body?: Record<string, unknown>
}) => {
  const { method, path, params = {}, body = {} } = input
  const normalizedPath = path.split("?")[0]

  if (method === "POST" && normalizedPath === "/admin/products") {
    return {
      action: "product_created",
      entityType: "product",
      entityId: null,
      targetLabel: typeof body.title === "string" ? body.title : null,
    }
  }

  if (method === "POST" && /\/admin\/products\/[^/]+$/.test(normalizedPath)) {
    return {
      action: "product_updated",
      entityType: "product",
      entityId: params.id ?? null,
      targetLabel: typeof body.title === "string" ? body.title : null,
    }
  }

  if (
    method === "POST" &&
    /\/admin\/products\/[^/]+\/variants\/[^/]+$/.test(normalizedPath)
  ) {
    const isPriceChange = Array.isArray(body.prices) || "prices" in body

    return {
      action: isPriceChange ? "variant_price_updated" : "variant_updated",
      entityType: "product_variant",
      entityId: params.variant_id ?? null,
      targetLabel:
        typeof body.title === "string"
          ? body.title
          : typeof body.sku === "string"
          ? body.sku
          : null,
    }
  }

  if (method === "POST" && /\/admin\/price-lists\/[^/]+$/.test(normalizedPath)) {
    return {
      action: "price_list_updated",
      entityType: "price_list",
      entityId: params.id ?? null,
      targetLabel: typeof body.title === "string" ? body.title : null,
    }
  }

  if (method === "POST" && normalizedPath === "/admin/price-lists") {
    return {
      action: "price_list_created",
      entityType: "price_list",
      entityId: null,
      targetLabel: typeof body.title === "string" ? body.title : null,
    }
  }

  if (method === "POST" && /\/admin\/users\/[^/]+$/.test(normalizedPath)) {
    return {
      action: "admin_user_updated",
      entityType: "admin_user",
      entityId: params.id ?? null,
      targetLabel: typeof body.email === "string" ? body.email : null,
    }
  }

  if (method === "POST" && /\/admin\/stores(\/[^/]+)?$/.test(normalizedPath)) {
    return {
      action: "store_settings_updated",
      entityType: "store",
      entityId: params.id ?? null,
      targetLabel: typeof body.name === "string" ? body.name : "Store settings",
    }
  }

  return {
    action: "admin_mutation",
    entityType: "admin_operation",
    entityId: null,
    targetLabel: null,
  }
}
