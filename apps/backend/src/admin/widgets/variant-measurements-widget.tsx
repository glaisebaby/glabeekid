import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type VariantMetadataWidgetProps = {
  data?: {
    id: string
    product_id: string
    title?: string | null
    metadata?: Record<string, unknown> | null
  }
}

type FieldDefinition = {
  key: string
  label: string
  placeholder: string
}

const BASE_FIELDS: FieldDefinition[] = [
  { key: "width", label: "Width", placeholder: "25CM" },
  { key: "length", label: "Length", placeholder: "34CM" },
  { key: "chest_cm", label: "Chest", placeholder: "58CM" },
  { key: "total_height_cm", label: "Total Height", placeholder: "84CM" },
  {
    key: "shoulder_to_shoulder_cm",
    label: "Shoulder to Shoulder",
    placeholder: "28CM",
  },
  {
    key: "garment_length_cm",
    label: "Garment Length",
    placeholder: "42CM",
  },
  { key: "waist_cm", label: "Waist", placeholder: "46CM" },
  { key: "hip_cm", label: "Hip", placeholder: "60CM" },
  { key: "inseam_cm", label: "Inseam", placeholder: "38CM" },
]

const EXCLUDED_KEYS = new Set([
  "size_chart_image_url",
  "size_chart_image_urls",
  "cost_price",
  "costPrice",
  "cost_price_inr",
  "purchase_price",
  "purchasePrice",
  "purchase_cost",
  "cogs",
])

const toLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())

const toInputValue = (value: unknown) => {
  if (typeof value === "number") {
    return String(value)
  }

  if (typeof value === "string") {
    return value
  }

  return ""
}

const getPrimitiveMetadata = (metadata: Record<string, unknown>) =>
  Object.entries(metadata).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value)
  )

const VariantMeasurementsWidget = ({
  data,
}: VariantMetadataWidgetProps) => {
  const variantId = data?.id
  const productId = data?.product_id
  const rawMetadata = (data?.metadata ?? {}) as Record<string, unknown>
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error"
    message?: string
  }>({ type: "idle" })
  const [isSaving, setIsSaving] = useState(false)

  const fields = useMemo(() => {
    const configuredFields = getPrimitiveMetadata(rawMetadata)
      .filter(([key]) => !EXCLUDED_KEYS.has(key))
      .map(([key]) => ({
        key,
        label: toLabel(key),
        placeholder: "",
      }))

    const merged = new Map<string, FieldDefinition>()

    for (const field of [...BASE_FIELDS, ...configuredFields]) {
      if (!merged.has(field.key)) {
        merged.set(field.key, field)
      }
    }

    return Array.from(merged.values())
  }, [rawMetadata])

  useEffect(() => {
    const nextValues: Record<string, string> = {}

    for (const field of fields) {
      nextValues[field.key] = toInputValue(rawMetadata[field.key])
    }

    setFormValues(nextValues)
    setStatus({ type: "idle" })
  }, [fields, rawMetadata])

  const handleChange = (key: string, value: string) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    if (!variantId || !productId) {
      setStatus({
        type: "error",
        message: "Variant details are missing, so metadata could not be saved.",
      })
      return
    }

    setIsSaving(true)
    setStatus({ type: "idle" })

    const nextMetadata = { ...rawMetadata } as Record<string, unknown>

    for (const field of fields) {
      const nextValue = (formValues[field.key] ?? "").trim()

      if (nextValue) {
        nextMetadata[field.key] = nextValue
      } else {
        delete nextMetadata[field.key]
      }
    }

    try {
      const response = await fetch(
        `/admin/products/${productId}/variants/${variantId}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            metadata: nextMetadata,
          }),
        }
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null

        throw new Error(payload?.message || "Failed to save variant metadata.")
      }

      setStatus({
        type: "success",
        message: "Variant measurements saved successfully.",
      })
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save variant metadata.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">Variant Measurements</Heading>
        <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
          Save size-specific fit details for this variant. The storefront will
          switch these values when shoppers choose another size.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        {fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ui-fg-base">
              {field.label}
            </span>
            <input
              value={formValues[field.key] ?? ""}
              onChange={(event) => handleChange(field.key, event.target.value)}
              placeholder={field.placeholder}
              className="h-10 rounded-xl border border-ui-border-base bg-ui-bg-base px-3 text-sm outline-none transition-colors focus:border-ui-fg-base"
            />
          </label>
        ))}

        {status.message ? (
          <Text
            className={`text-sm ${
              status.type === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {status.message}
          </Text>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-ui-fg-base px-4 text-sm font-medium text-ui-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save measurements"}
        </button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.after",
})

export default VariantMeasurementsWidget
