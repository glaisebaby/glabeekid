import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  AVAILABLE_ADMIN_ROLES,
  assertMasterAccount,
  createAuditLog,
  ensureAccessControlTables,
  getDatabaseClient,
  seedDefaultAdminRoles,
} from "../../../../lib/access-control"

const isAdminRole = (value: unknown): value is "master_account" | "operations_admin" =>
  AVAILABLE_ADMIN_ROLES.some((role) => role.value === value)

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const client = await getDatabaseClient()

  try {
    const permission = await assertMasterAccount(req, client)

    if (!permission.ok) {
      return res.status(permission.status).json({ message: permission.message })
    }

    const usersResult = await client.query<{
      id: string
      email: string
      first_name: string | null
      last_name: string | null
      created_at: string
      role: string | null
      assigned_by_email: string | null
      updated_at: string | null
    }>(`
      select
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at,
        aur.role,
        aur.assigned_by_email,
        aur.updated_at
      from public."user" u
      left join public.admin_user_roles aur on aur.user_id = u.id
      order by u.created_at asc
    `)

    return res.status(200).json({
      roles: AVAILABLE_ADMIN_ROLES,
      users: usersResult.rows.map((user) => ({
        ...user,
        role: user.role ?? "unassigned",
      })),
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const client = await getDatabaseClient()

  try {
    const permission = await assertMasterAccount(req, client)

    if (!permission.ok) {
      return res.status(permission.status).json({ message: permission.message })
    }

    await ensureAccessControlTables(client)
    await seedDefaultAdminRoles(client)

    const body = (req.body ?? {}) as Record<string, unknown>
    const userId = body.user_id
    const role = body.role

    if (typeof userId !== "string" || !isAdminRole(role)) {
      return res.status(400).json({
        message: "Provide a valid user_id and role.",
      })
    }

    const userResult = await client.query<{
      id: string
      email: string
    }>(`select id, email from public."user" where id = $1 limit 1`, [userId])

    const targetUser = userResult.rows[0]

    if (!targetUser) {
      return res.status(404).json({ message: "User not found." })
    }

    await client.query(
      `
        insert into public.admin_user_roles
        (user_id, email, role, assigned_by_user_id, assigned_by_email)
        values ($1, $2, $3, $4, $5)
        on conflict (user_id)
        do update set
          email = excluded.email,
          role = excluded.role,
          assigned_by_user_id = excluded.assigned_by_user_id,
          assigned_by_email = excluded.assigned_by_email,
          updated_at = now()
      `,
      [
        targetUser.id,
        targetUser.email.toLowerCase(),
        role,
        permission.actor.id,
        permission.actor.email.toLowerCase(),
      ]
    )

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "admin_role_assigned",
      entityType: "admin_user_role",
      entityId: targetUser.id,
      targetLabel: targetUser.email,
      route: "/admin/access-control/users",
      method: "POST",
      statusCode: 200,
      details: {
        role,
      },
    })

    return res.status(200).json({
      message: "Role updated successfully.",
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
