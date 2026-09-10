import { Client } from "pg"

type MasterSettingDefinition = {
  defaultValue: string | boolean
  isSecret?: boolean
}

export const MASTER_SETTINGS_DEFINITIONS: Record<
  string,
  MasterSettingDefinition
> = {
  analytics_allowed_emails: {
    defaultValue: "admin@glabee.in,master@glabee.in",
  },
  master_account_email: {
    defaultValue: "master@glabee.in",
  },
  default_operations_admin_emails: {
    defaultValue: "admin@glabee.in",
  },
  store_display_name: {
    defaultValue: "Glabee",
  },
  support_email: {
    defaultValue: "support@glabee.in",
  },
  support_phone: {
    defaultValue: "",
  },
  delhivery_enabled: {
    defaultValue: false,
  },
  delhivery_environment: {
    defaultValue: "staging",
  },
  delhivery_api_base_url: {
    defaultValue: "https://staging-express.delhivery.com",
  },
  delhivery_api_token: {
    defaultValue: "",
    isSecret: true,
  },
  delhivery_pickup_location_name: {
    defaultValue: "",
  },
  delhivery_default_shipping_mode: {
    defaultValue: "Surface",
  },
  delhivery_seller_name: {
    defaultValue: "Glabee",
  },
  delhivery_seller_address: {
    defaultValue: "",
  },
  delhivery_seller_invoice_prefix: {
    defaultValue: "",
  },
  delhivery_return_name: {
    defaultValue: "Glabee Returns",
  },
  delhivery_return_address: {
    defaultValue: "",
  },
  delhivery_return_city: {
    defaultValue: "",
  },
  delhivery_return_state: {
    defaultValue: "",
  },
  delhivery_return_country: {
    defaultValue: "India",
  },
  delhivery_return_phone: {
    defaultValue: "",
  },
  delhivery_return_pincode: {
    defaultValue: "",
  },
  instagram_enabled: {
    defaultValue: false,
  },
  instagram_graph_api_version: {
    defaultValue: "v24.0",
  },
  instagram_business_account_id: {
    defaultValue: "",
  },
  instagram_access_token: {
    defaultValue: "",
    isSecret: true,
  },
  instagram_access_token_expires_at: {
    defaultValue: "",
  },
  instagram_homepage_reels_limit: {
    defaultValue: "6",
  },
} as const

export type MasterSettingKey = keyof typeof MASTER_SETTINGS_DEFINITIONS

type MasterSettingRow = {
  key: MasterSettingKey
  value: unknown
  is_secret: boolean
}

export type MasterSettings = Record<MasterSettingKey, string | boolean>

const SETTING_KEYS = Object.keys(
  MASTER_SETTINGS_DEFINITIONS
) as MasterSettingKey[]

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

export const parseEmailList = (value: string) =>
  value
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean)

const stringifySettingValue = (value: string | boolean) => JSON.stringify(value)

export const ensureMasterSettingsTable = async (client: Client) => {
  await client.query(`
    create table if not exists public.master_settings (
      key text primary key,
      value jsonb not null,
      is_secret boolean not null default false,
      updated_by_user_id text null,
      updated_by_email text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
}

export const seedDefaultMasterSettings = async (client: Client) => {
  await ensureMasterSettingsTable(client)

  for (const key of SETTING_KEYS) {
    const definition = MASTER_SETTINGS_DEFINITIONS[key]

    await client.query(
      `
        insert into public.master_settings (key, value, is_secret)
        values ($1, $2::jsonb, $3)
        on conflict (key) do nothing
      `,
      [
        key,
        stringifySettingValue(definition.defaultValue),
        definition.isSecret ?? false,
      ]
    )
  }
}

const coerceSettingValue = (
  key: MasterSettingKey,
  value: unknown
): string | boolean => {
  const defaultValue = MASTER_SETTINGS_DEFINITIONS[key].defaultValue

  if (typeof defaultValue === "boolean") {
    if (typeof value === "boolean") {
      return value
    }

    if (typeof value === "string") {
      return value.trim().toLowerCase() === "true"
    }

    return defaultValue
  }

  if (typeof value === "string") {
    return value
  }

  if (value == null) {
    return defaultValue
  }

  return String(value)
}

export const getMasterSettings = async (client: Client) => {
  await seedDefaultMasterSettings(client)

  const result = await client.query<MasterSettingRow>(
    `
      select key, value, is_secret
      from public.master_settings
      where key = any($1::text[])
    `,
    [SETTING_KEYS]
  )

  const settings = {} as MasterSettings

  for (const key of SETTING_KEYS) {
    settings[key] = MASTER_SETTINGS_DEFINITIONS[key].defaultValue
  }

  for (const row of result.rows) {
    settings[row.key] = coerceSettingValue(row.key, row.value)
  }

  return settings
}

export const getMasterSettingsForAdmin = async (client: Client) => {
  const settings = await getMasterSettings(client)

  return {
    settings: {
      ...settings,
      delhivery_api_token: "",
      instagram_access_token: "",
    },
    secrets: {
      delhivery_api_token_configured:
        typeof settings.delhivery_api_token === "string" &&
        settings.delhivery_api_token.length > 0,
      delhivery_api_token_masked:
        typeof settings.delhivery_api_token === "string" &&
        settings.delhivery_api_token.length > 0
          ? `${settings.delhivery_api_token.slice(0, 4)}...${settings.delhivery_api_token.slice(-4)}`
          : "",
      instagram_access_token_configured:
        typeof settings.instagram_access_token === "string" &&
        settings.instagram_access_token.length > 0,
      instagram_access_token_masked:
        typeof settings.instagram_access_token === "string" &&
        settings.instagram_access_token.length > 0
          ? `${settings.instagram_access_token.slice(0, 4)}...${settings.instagram_access_token.slice(-4)}`
          : "",
    },
  }
}

export const updateMasterSettings = async ({
  client,
  updates,
  actorUserId,
  actorEmail,
}: {
  client: Client
  updates: Partial<MasterSettings>
  actorUserId?: string | null
  actorEmail?: string | null
}) => {
  await seedDefaultMasterSettings(client)

  const currentSettings = await getMasterSettings(client)

  for (const key of Object.keys(updates) as MasterSettingKey[]) {
    const definition = MASTER_SETTINGS_DEFINITIONS[key]
    const incomingValue = updates[key]

    if (incomingValue === undefined) {
      continue
    }

    let nextValue = incomingValue

    if (
      definition.isSecret &&
      typeof incomingValue === "string" &&
      incomingValue.trim().length === 0
    ) {
      nextValue = currentSettings[key]
    }

    await client.query(
      `
        insert into public.master_settings
        (key, value, is_secret, updated_by_user_id, updated_by_email)
        values ($1, $2::jsonb, $3, $4, $5)
        on conflict (key)
        do update set
          value = excluded.value,
          is_secret = excluded.is_secret,
          updated_by_user_id = excluded.updated_by_user_id,
          updated_by_email = excluded.updated_by_email,
          updated_at = now()
      `,
      [
        key,
        stringifySettingValue(nextValue),
        definition.isSecret ?? false,
        actorUserId ?? null,
        actorEmail ? normalizeEmail(actorEmail) : null,
      ]
    )
  }

  return getMasterSettings(client)
}

export const getAnalyticsAllowedEmails = async (client: Client) => {
  const settings = await getMasterSettings(client)

  return parseEmailList(String(settings.analytics_allowed_emails || ""))
}
