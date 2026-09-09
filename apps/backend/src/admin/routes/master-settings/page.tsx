import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Switch, Text, Textarea } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

const DELHIVERY_BASE_URLS = {
  staging: "https://staging-express.delhivery.com",
  production: "https://track.delhivery.com",
} as const

type MasterSettingsResponse = {
  settings: Record<string, string | boolean>
  secrets: {
    delhivery_api_token_configured: boolean
    delhivery_api_token_masked: string
  }
}

const fetchSettings = async (): Promise<MasterSettingsResponse> => {
  const response = await fetch("/admin/master-settings", {
    credentials: "include",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(payload?.message || "Failed to load master settings.")
  }

  return response.json()
}

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    {children}
    {hint ? (
      <Text className="text-xs text-ui-fg-subtle">{hint}</Text>
    ) : null}
  </div>
)

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "")

const MasterSettingsPage = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["master-settings"],
    queryFn: fetchSettings,
  })
  const [form, setForm] = useState<Record<string, string | boolean>>({})
  const [delhiveryTokenInput, setDelhiveryTokenInput] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [serviceabilityPincode, setServiceabilityPincode] = useState("")
  const [serviceabilityResult, setServiceabilityResult] = useState<string | null>(
    null
  )
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false)

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings)
      setDelhiveryTokenInput("")
    }
  }, [data])

  const selectedEnvironment =
    String(form.delhivery_environment || "staging") as keyof typeof DELHIVERY_BASE_URLS
  const normalizedDelhiveryBaseUrl = normalizeBaseUrl(
    String(form.delhivery_api_base_url || "")
  )
  const expectedDelhiveryBaseUrl = DELHIVERY_BASE_URLS[selectedEnvironment]
  const hasDelhiveryBaseUrlMismatch =
    normalizedDelhiveryBaseUrl.length > 0 &&
    normalizedDelhiveryBaseUrl !== expectedDelhiveryBaseUrl

  const setValue = (key: string, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleEnvironmentChange = (environment: "staging" | "production") => {
    setForm((current) => {
      const currentBaseUrl = normalizeBaseUrl(
        String(current.delhivery_api_base_url || "")
      )
      const previousEnvironment =
        String(current.delhivery_environment || "staging") as keyof typeof DELHIVERY_BASE_URLS
      const previousExpectedBaseUrl = DELHIVERY_BASE_URLS[previousEnvironment]
      const nextExpectedBaseUrl = DELHIVERY_BASE_URLS[environment]

      return {
        ...current,
        delhivery_environment: environment,
        delhivery_api_base_url:
          !currentBaseUrl || currentBaseUrl === previousExpectedBaseUrl
            ? nextExpectedBaseUrl
            : current.delhivery_api_base_url,
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatus(null)

    try {
      const response = await fetch("/admin/master-settings", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          delhivery_api_token: delhiveryTokenInput,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null

        throw new Error(payload?.message || "Failed to save settings.")
      }

      setStatus(
        delhiveryTokenInput.trim()
          ? "Master settings saved successfully. The Delhivery token is stored and hidden after reload."
          : "Master settings saved successfully."
      )
      setDelhiveryTokenInput("")
      await refetch()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCheckServiceability = async () => {
    setIsCheckingServiceability(true)
    setServiceabilityResult(null)

    try {
      const response = await fetch("/admin/delhivery/pincode-serviceability", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          pincode: serviceabilityPincode,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          payload?.message || "Failed to check Delhivery serviceability."
        )
      }

      setServiceabilityResult(JSON.stringify(payload, null, 2))
    } catch (err) {
      setServiceabilityResult(
        err instanceof Error ? err.message : "Failed to check serviceability."
      )
    } finally {
      setIsCheckingServiceability(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="p-6">
        <Heading level="h1">Master Settings</Heading>
        <Text className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">
          Use this page as the single source of truth for sensitive business
          settings, admin email rules, Delhivery credentials, and operational
          defaults used by backend integrations.
        </Text>
      </Container>

      {error ? (
        <Container className="p-6">
          <Heading level="h2">Access denied or unavailable</Heading>
          <Text className="mt-2 text-sm text-ui-fg-subtle">
            {error instanceof Error ? error.message : "Unable to load settings."}
          </Text>
        </Container>
      ) : null}

      {isLoading ? (
        <Container className="p-6">
          <Text>Loading master settings...</Text>
        </Container>
      ) : null}

      {data ? (
        <>
          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Admin Access Defaults</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                These values now drive master access, operations admin defaults,
                and analytics access from the database instead of hardcoded
                runtime values.
              </Text>
            </div>
            <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
              <Field
                label="Master account email"
                hint="This account always keeps master-level access."
              >
                <Input
                  value={String(form.master_account_email || "")}
                  onChange={(event) =>
                    setValue("master_account_email", event.target.value)
                  }
                />
              </Field>
              <Field
                label="Analytics allowed emails"
                hint="Comma-separated emails that can access the reports page."
              >
                <Input
                  value={String(form.analytics_allowed_emails || "")}
                  onChange={(event) =>
                    setValue("analytics_allowed_emails", event.target.value)
                  }
                />
              </Field>
              <Field
                label="Default operations admin emails"
                hint="Comma-separated emails automatically seeded with operations admin access."
              >
                <Input
                  value={String(form.default_operations_admin_emails || "")}
                  onChange={(event) =>
                    setValue(
                      "default_operations_admin_emails",
                      event.target.value
                    )
                  }
                />
              </Field>
            </div>
          </Container>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Site Defaults</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                Store-wide business details that backend features can reuse
                without new environment variables.
              </Text>
            </div>
            <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
              <Field label="Store display name">
                <Input
                  value={String(form.store_display_name || "")}
                  onChange={(event) =>
                    setValue("store_display_name", event.target.value)
                  }
                />
              </Field>
              <Field label="Support email">
                <Input
                  value={String(form.support_email || "")}
                  onChange={(event) =>
                    setValue("support_email", event.target.value)
                  }
                />
              </Field>
              <Field label="Support phone">
                <Input
                  value={String(form.support_phone || "")}
                  onChange={(event) =>
                    setValue("support_phone", event.target.value)
                  }
                />
              </Field>
            </div>
          </Container>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Delhivery Integration</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                Based on Delhivery&apos;s official B2C API flow, the backend now
                supports pincode serviceability, shipment creation, tracking,
                pickup requests, waybill fetching, and shipping-label generation
                from these settings.
              </Text>
            </div>
            <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
              <Field
                label="Enable Delhivery"
                hint="Disable this to stop all Delhivery API usage without removing credentials."
              >
                <div className="flex h-10 items-center">
                  <Switch
                    checked={Boolean(form.delhivery_enabled)}
                    onCheckedChange={(checked) =>
                      setValue("delhivery_enabled", checked)
                    }
                  />
                </div>
              </Field>
              <Field
                label="Environment"
                hint="Keep staging unless your live Delhivery account is ready."
              >
                <select
                  value={selectedEnvironment}
                  onChange={(event) =>
                    handleEnvironmentChange(
                      event.target.value as "staging" | "production"
                    )
                  }
                  className="h-10 rounded-md border border-ui-border-base bg-ui-bg-base px-3"
                >
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </Field>
              <Field
                label="API base URL"
                hint="Default staging URL is prefilled. Replace this with your live Delhivery base URL when you switch environments."
              >
                <div className="grid gap-2">
                  <Input
                    value={String(form.delhivery_api_base_url || "")}
                    onChange={(event) =>
                      setValue("delhivery_api_base_url", event.target.value)
                    }
                  />
                  <Text className="text-xs text-ui-fg-subtle">
                    Recommended for {selectedEnvironment}:{" "}
                    {expectedDelhiveryBaseUrl}
                  </Text>
                  {hasDelhiveryBaseUrlMismatch ? (
                    <Text className="text-xs text-ui-fg-error">
                      This base URL does not match the selected environment and
                      can cause Delhivery authentication failures.
                    </Text>
                  ) : null}
                </div>
              </Field>
              <Field
                label="API token"
                hint={
                  data.secrets.delhivery_api_token_configured
                    ? `Currently saved as ${data.secrets.delhivery_api_token_masked}. Leave blank to keep it unchanged.`
                    : "Paste the Delhivery API token generated from the Delhivery One API Setup page."
                }
              >
                <Input
                  type="password"
                  value={delhiveryTokenInput}
                  placeholder={
                    data.secrets.delhivery_api_token_configured
                      ? data.secrets.delhivery_api_token_masked
                      : "Paste Delhivery API token"
                  }
                  onChange={(event) =>
                    setDelhiveryTokenInput(event.target.value)
                  }
                />
              </Field>
              <Field
                label="Pickup location name"
                hint="Use the exact Delhivery warehouse/pickup location name registered in your account."
              >
                <Input
                  value={String(form.delhivery_pickup_location_name || "")}
                  onChange={(event) =>
                    setValue(
                      "delhivery_pickup_location_name",
                      event.target.value
                    )
                  }
                />
              </Field>
              <Field label="Default shipping mode">
                <select
                  value={String(form.delhivery_default_shipping_mode || "Surface")}
                  onChange={(event) =>
                    setValue(
                      "delhivery_default_shipping_mode",
                      event.target.value
                    )
                  }
                  className="h-10 rounded-md border border-ui-border-base bg-ui-bg-base px-3"
                >
                  <option value="Surface">Surface</option>
                  <option value="Express">Express</option>
                </select>
              </Field>
              <Field label="Seller name">
                <Input
                  value={String(form.delhivery_seller_name || "")}
                  onChange={(event) =>
                    setValue("delhivery_seller_name", event.target.value)
                  }
                />
              </Field>
              <Field label="Seller invoice prefix">
                <Input
                  value={String(form.delhivery_seller_invoice_prefix || "")}
                  onChange={(event) =>
                    setValue(
                      "delhivery_seller_invoice_prefix",
                      event.target.value
                    )
                  }
                />
              </Field>
              <Field label="Seller address" hint="Used as the default seller address in shipment payloads.">
                <Textarea
                  value={String(form.delhivery_seller_address || "")}
                  onChange={(event) =>
                    setValue("delhivery_seller_address", event.target.value)
                  }
                  rows={4}
                />
              </Field>
              <Field label="Return name">
                <Input
                  value={String(form.delhivery_return_name || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_name", event.target.value)
                  }
                />
              </Field>
              <Field label="Return address">
                <Textarea
                  value={String(form.delhivery_return_address || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_address", event.target.value)
                  }
                  rows={4}
                />
              </Field>
              <Field label="Return city">
                <Input
                  value={String(form.delhivery_return_city || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_city", event.target.value)
                  }
                />
              </Field>
              <Field label="Return state">
                <Input
                  value={String(form.delhivery_return_state || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_state", event.target.value)
                  }
                />
              </Field>
              <Field label="Return country">
                <Input
                  value={String(form.delhivery_return_country || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_country", event.target.value)
                  }
                />
              </Field>
              <Field label="Return phone">
                <Input
                  value={String(form.delhivery_return_phone || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_phone", event.target.value)
                  }
                />
              </Field>
              <Field label="Return pincode">
                <Input
                  value={String(form.delhivery_return_pincode || "")}
                  onChange={(event) =>
                    setValue("delhivery_return_pincode", event.target.value)
                  }
                />
              </Field>
            </div>
          </Container>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Delhivery Quick Test</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                This checks Delhivery pincode serviceability using the saved
                token and base URL, which is a good first validation after setup.
              </Text>
            </div>
            <div className="grid gap-4 px-6 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <Field label="Pincode">
                  <Input
                    value={serviceabilityPincode}
                    onChange={(event) =>
                      setServiceabilityPincode(event.target.value)
                    }
                  />
                </Field>
                <Button
                  variant="secondary"
                  isLoading={isCheckingServiceability}
                  onClick={handleCheckServiceability}
                >
                  Check Serviceability
                </Button>
              </div>
              {serviceabilityResult ? (
                <pre className="overflow-x-auto rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-4 text-xs">
                  {serviceabilityResult}
                </pre>
              ) : null}
            </div>
          </Container>

          <Container className="flex items-center justify-between gap-4 p-6">
            <div>
              <Heading level="h2">Save Changes</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                Keep this page updated so the backend can read current values
                directly from the database.
              </Text>
              {status ? (
                <Text className="mt-2 text-sm text-ui-fg-subtle">{status}</Text>
              ) : null}
            </div>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Master Settings
            </Button>
          </Container>
        </>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Master Settings",
  icon: CogSixTooth,
})

export default MasterSettingsPage
