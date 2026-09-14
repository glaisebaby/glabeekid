import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type ManualShippingWidgetProps = {
  data?: {
    id: string
    display_id?: number
    metadata?: Record<string, unknown> | null
  }
}

type ManualShippingForm = {
  enabled: boolean
  courierName: string
  trackingNumber: string
  trackingUrl: string
  shippedAt: string
  notes: string
}

type ManualShippingMetadata = {
  enabled?: boolean
  bypass_delhivery?: boolean
  courier_name?: string
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  notes?: string
  updated_at?: string
}

const MANUAL_SHIPPING_METADATA_KEY = "manual_shipping"

const EMPTY_FORM: ManualShippingForm = {
  enabled: false,
  courierName: "",
  trackingNumber: "",
  trackingUrl: "",
  shippedAt: "",
  notes: "",
}

const toStringValue = (value: unknown) =>
  typeof value === "string" ? value : ""

const getManualShipping = (
  value: unknown
): ManualShippingMetadata | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }

  return value as ManualShippingMetadata
}

const toForm = (metadata: Record<string, unknown>): ManualShippingForm => {
  const manualShipping = getManualShipping(
    metadata[MANUAL_SHIPPING_METADATA_KEY]
  )

  if (!manualShipping) {
    return EMPTY_FORM
  }

  return {
    enabled: manualShipping.enabled === true,
    courierName: toStringValue(manualShipping.courier_name),
    trackingNumber: toStringValue(manualShipping.tracking_number),
    trackingUrl: toStringValue(manualShipping.tracking_url),
    shippedAt: toStringValue(manualShipping.shipped_at),
    notes: toStringValue(manualShipping.notes),
  }
}

const ManualShippingWidget = ({ data }: ManualShippingWidgetProps) => {
  const orderId = data?.id
  const rawMetadata = (data?.metadata ?? {}) as Record<string, unknown>
  const [form, setForm] = useState<ManualShippingForm>(EMPTY_FORM)
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error"
    message?: string
  }>({ type: "idle" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setForm(toForm(rawMetadata))
    setStatus({ type: "idle" })
  }, [rawMetadata])

  const updateForm = <Key extends keyof ManualShippingForm>(
    key: Key,
    value: ManualShippingForm[Key]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const saveMetadata = async (nextMetadata: Record<string, unknown>) => {
    if (!orderId) {
      throw new Error("Order details are missing, so shipping info was not saved.")
    }

    const response = await fetch(`/admin/orders/${orderId}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        metadata: nextMetadata,
      }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null

      throw new Error(payload?.message || "Failed to save manual shipping info.")
    }
  }

  const handleSave = async () => {
    const courierName = form.courierName.trim()

    if (form.enabled && !courierName) {
      setStatus({
        type: "error",
        message: "Courier partner name is required when manual shipping is enabled.",
      })
      return
    }

    setIsSaving(true)
    setStatus({ type: "idle" })

    const nextMetadata = { ...rawMetadata }

    if (form.enabled) {
      nextMetadata[MANUAL_SHIPPING_METADATA_KEY] = {
        enabled: true,
        bypass_delhivery: true,
        courier_name: courierName,
        tracking_number: form.trackingNumber.trim(),
        tracking_url: form.trackingUrl.trim(),
        shipped_at: form.shippedAt.trim(),
        notes: form.notes.trim(),
        updated_at: new Date().toISOString(),
      }
    } else {
      delete nextMetadata[MANUAL_SHIPPING_METADATA_KEY]
    }

    try {
      await saveMetadata(nextMetadata)
      setStatus({
        type: "success",
        message: form.enabled
          ? "Manual shipping info saved. Delhivery can be bypassed for this order."
          : "Manual shipping info cleared.",
      })
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save manual shipping info.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = async () => {
    setIsSaving(true)
    setStatus({ type: "idle" })

    const nextMetadata = { ...rawMetadata }
    delete nextMetadata[MANUAL_SHIPPING_METADATA_KEY]

    try {
      await saveMetadata(nextMetadata)
      setForm(EMPTY_FORM)
      setStatus({
        type: "success",
        message: "Manual shipping info cleared.",
      })
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to clear manual shipping info.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">Manual Shipping</Heading>
        <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
          Add courier details when an order is shipped outside Delhivery.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => updateForm("enabled", event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-ui-border-base"
          />
          <span>
            <span className="block text-sm font-medium text-ui-fg-base">
              Use manual courier for this order
            </span>
            <span className="block text-sm leading-6 text-ui-fg-subtle">
              Saves tracking information without creating a Delhivery shipment.
            </span>
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ui-fg-base">
            Courier partner
          </span>
          <Input
            value={form.courierName}
            onChange={(event) => updateForm("courierName", event.target.value)}
            placeholder="DTDC, India Post, Professional Courier..."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ui-fg-base">
            Tracking/AWB number
          </span>
          <Input
            value={form.trackingNumber}
            onChange={(event) =>
              updateForm("trackingNumber", event.target.value)
            }
            placeholder="Courier tracking number"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ui-fg-base">
            Tracking URL
          </span>
          <Input
            value={form.trackingUrl}
            onChange={(event) => updateForm("trackingUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ui-fg-base">
            Shipped date
          </span>
          <Input
            type="date"
            value={form.shippedAt}
            onChange={(event) => updateForm("shippedAt", event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ui-fg-base">Notes</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateForm("notes", event.target.value)}
            placeholder="Any manual courier notes for the team"
            rows={3}
            className="rounded-xl border border-ui-border-base bg-ui-bg-base px-3 py-2 text-sm outline-none transition-colors focus:border-ui-fg-base"
          />
        </label>

        {status.message ? (
          <Text
            className={`text-sm ${
              status.type === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {status.message}
          </Text>
        ) : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-ui-fg-base px-4 text-sm font-medium text-ui-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save manual shipping"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-ui-border-base px-4 text-sm font-medium text-ui-fg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear manual shipping
          </button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default ManualShippingWidget
