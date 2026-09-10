import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

type SocialMediaSettingsResponse = {
  settings: Record<string, string | boolean>
  secrets: {
    instagram_access_token_configured: boolean
    instagram_access_token_masked: string
  }
}

const fetchSettings = async (): Promise<SocialMediaSettingsResponse> => {
  const response = await fetch("/admin/social-media-settings", {
    credentials: "include",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(
      payload?.message || "Failed to load social media settings."
    )
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

const SocialMediaSettingsPage = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["social-media-settings"],
    queryFn: fetchSettings,
  })
  const [form, setForm] = useState<Record<string, string | boolean>>({})
  const [instagramTokenInput, setInstagramTokenInput] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings)
      setInstagramTokenInput("")
    }
  }, [data])

  const setValue = (key: string, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setStatus(null)

    try {
      const response = await fetch("/admin/social-media-settings", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          instagram_access_token: instagramTokenInput,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null

        throw new Error(
          payload?.message || "Failed to save social media settings."
        )
      }

      setStatus(
        instagramTokenInput.trim()
          ? "Social media settings saved. The Instagram token is stored and hidden after reload."
          : "Social media settings saved."
      )
      setInstagramTokenInput("")
      await refetch()
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "Failed to save social settings."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestFeed = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(
        "/admin/social-media-settings/instagram-test",
        {
          method: "POST",
          credentials: "include",
        }
      )
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to test Instagram feed.")
      }

      setTestResult(JSON.stringify(payload, null, 2))
    } catch (err) {
      setTestResult(
        err instanceof Error ? err.message : "Failed to test Instagram feed."
      )
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="p-6">
        <Heading level="h1">Social Media Settings</Heading>
        <Text className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">
          Connect Glabee&apos;s Instagram professional account so the storefront
          can show recent reels and product pages can use Instagram video links.
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
          <Text>Loading social media settings...</Text>
        </Container>
      ) : null}

      {data ? (
        <>
          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Instagram Auto Reels</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                Use an Instagram professional account linked to your Facebook
                Page. The access token stays on the backend and is never exposed
                to the storefront.
              </Text>
            </div>
            <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
              <Field
                label="Enable Instagram reels"
                hint="Disable this to hide the homepage reels section without deleting credentials."
              >
                <div className="flex h-10 items-center">
                  <Switch
                    checked={Boolean(form.instagram_enabled)}
                    onCheckedChange={(checked) =>
                      setValue("instagram_enabled", checked)
                    }
                  />
                </div>
              </Field>
              <Field
                label="Graph API version"
                hint="Use the Meta Graph API version enabled for your Meta app."
              >
                <Input
                  value={String(form.instagram_graph_api_version || "v24.0")}
                  onChange={(event) =>
                    setValue("instagram_graph_api_version", event.target.value)
                  }
                />
              </Field>
              <Field
                label="Instagram business account ID"
                hint="The Instagram professional account ID from Meta Graph API."
              >
                <Input
                  value={String(form.instagram_business_account_id || "")}
                  onChange={(event) =>
                    setValue(
                      "instagram_business_account_id",
                      event.target.value
                    )
                  }
                />
              </Field>
              <Field
                label="Homepage reels limit"
                hint="Number of recent video/reel posts to show. Allowed range is 1 to 12."
              >
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={String(form.instagram_homepage_reels_limit || "6")}
                  onChange={(event) =>
                    setValue(
                      "instagram_homepage_reels_limit",
                      event.target.value
                    )
                  }
                />
              </Field>
              <Field
                label="Long-lived access token"
                hint={
                  data.secrets.instagram_access_token_configured
                    ? `Currently saved as ${data.secrets.instagram_access_token_masked}. Leave blank to keep it unchanged.`
                    : "Paste the long-lived Instagram/Facebook access token from Meta."
                }
              >
                <Input
                  type="password"
                  value={instagramTokenInput}
                  placeholder={
                    data.secrets.instagram_access_token_configured
                      ? data.secrets.instagram_access_token_masked
                      : "Paste Instagram access token"
                  }
                  onChange={(event) =>
                    setInstagramTokenInput(event.target.value)
                  }
                />
              </Field>
              <Field
                label="Token expiry note"
                hint="Optional reminder date from Meta, for example 2026-12-31."
              >
                <Input
                  value={String(form.instagram_access_token_expires_at || "")}
                  onChange={(event) =>
                    setValue(
                      "instagram_access_token_expires_at",
                      event.target.value
                    )
                  }
                />
              </Field>
            </div>
          </Container>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Instagram Feed Test</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                Save credentials first, then test whether Meta returns recent
                video/reel posts for the configured Instagram account.
              </Text>
            </div>
            <div className="grid gap-4 px-6 py-5">
              <Button
                variant="secondary"
                isLoading={isTesting}
                onClick={handleTestFeed}
              >
                Test Instagram Feed
              </Button>
              {testResult ? (
                <pre className="overflow-x-auto rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-4 text-xs">
                  {testResult}
                </pre>
              ) : null}
            </div>
          </Container>

          <Container className="flex items-center justify-between gap-4 p-6">
            <div>
              <Heading level="h2">Save Changes</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                These settings power the storefront Instagram reels section.
              </Text>
              {status ? (
                <Text className="mt-2 text-sm text-ui-fg-subtle">{status}</Text>
              ) : null}
            </div>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Social Media Settings
            </Button>
          </Container>
        </>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Social Media Settings",
  icon: CogSixTooth,
})

export default SocialMediaSettingsPage
