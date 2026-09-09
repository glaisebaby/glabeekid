import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  assertMasterAccount,
  createAuditLog,
  getDatabaseClient,
} from "../../../lib/access-control"
import {
  getMasterSettingsForAdmin,
  updateMasterSettings,
} from "../../../lib/master-settings"

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

    const payload = await getMasterSettingsForAdmin(client)

    return res.status(200).json(payload)
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

    const body = (req.body ?? {}) as Record<string, string | boolean>
    const settings = await updateMasterSettings({
      client,
      updates: {
        analytics_allowed_emails: String(body.analytics_allowed_emails || ""),
        master_account_email: String(body.master_account_email || ""),
        default_operations_admin_emails: String(
          body.default_operations_admin_emails || ""
        ),
        store_display_name: String(body.store_display_name || ""),
        support_email: String(body.support_email || ""),
        support_phone: String(body.support_phone || ""),
        delhivery_enabled: Boolean(body.delhivery_enabled),
        delhivery_environment: String(body.delhivery_environment || "staging"),
        delhivery_api_base_url: String(body.delhivery_api_base_url || ""),
        delhivery_api_token: String(body.delhivery_api_token || ""),
        delhivery_pickup_location_name: String(
          body.delhivery_pickup_location_name || ""
        ),
        delhivery_default_shipping_mode: String(
          body.delhivery_default_shipping_mode || "Surface"
        ),
        delhivery_seller_name: String(body.delhivery_seller_name || ""),
        delhivery_seller_address: String(body.delhivery_seller_address || ""),
        delhivery_seller_invoice_prefix: String(
          body.delhivery_seller_invoice_prefix || ""
        ),
        delhivery_return_name: String(body.delhivery_return_name || ""),
        delhivery_return_address: String(body.delhivery_return_address || ""),
        delhivery_return_city: String(body.delhivery_return_city || ""),
        delhivery_return_state: String(body.delhivery_return_state || ""),
        delhivery_return_country: String(body.delhivery_return_country || ""),
        delhivery_return_phone: String(body.delhivery_return_phone || ""),
        delhivery_return_pincode: String(body.delhivery_return_pincode || ""),
      },
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
    })

    await createAuditLog({
      client,
      actorUserId: permission.actor.id,
      actorEmail: permission.actor.email,
      action: "master_settings_updated",
      entityType: "master_settings",
      route: "/admin/master-settings",
      method: "POST",
      statusCode: 200,
      details: {
        changed_fields: Object.keys(body),
      },
    })

    return res.status(200).json({
      message: "Master settings updated successfully.",
      settings,
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
