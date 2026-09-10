import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type ProductInstagramWidgetProps = {
  data?: {
    id: string
    metadata?: Record<string, unknown> | null
  }
}

const INSTAGRAM_METADATA_KEY = "instagram_reel_url"

const ProductInstagramWidget = ({ data }: ProductInstagramWidgetProps) => {
  const productId = data?.id
  const rawMetadata = (data?.metadata ?? {}) as Record<string, unknown>
  const [instagramUrl, setInstagramUrl] = useState("")
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error"
    message?: string
  }>({ type: "idle" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const value = rawMetadata[INSTAGRAM_METADATA_KEY]

    setInstagramUrl(typeof value === "string" ? value : "")
    setStatus({ type: "idle" })
  }, [rawMetadata])

  const handleSave = async () => {
    if (!productId) {
      setStatus({
        type: "error",
        message: "Product details are missing, so the Instagram URL was not saved.",
      })
      return
    }

    setIsSaving(true)
    setStatus({ type: "idle" })

    const nextMetadata = { ...rawMetadata }
    const nextUrl = instagramUrl.trim()

    if (nextUrl) {
      nextMetadata[INSTAGRAM_METADATA_KEY] = nextUrl
    } else {
      delete nextMetadata[INSTAGRAM_METADATA_KEY]
    }

    try {
      const response = await fetch(`/admin/products/${productId}`, {
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

        throw new Error(payload?.message || "Failed to save Instagram URL.")
      }

      setStatus({
        type: "success",
        message: "Instagram URL saved successfully.",
      })
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save Instagram URL.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">Instagram Video</Heading>
        <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
          Add an Instagram Reel or Post URL for this product. The storefront
          will show it on the product page when present.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ui-fg-base">
            Instagram Reel/Post URL
          </span>
          <Input
            value={instagramUrl}
            onChange={(event) => setInstagramUrl(event.target.value)}
            placeholder="https://www.instagram.com/reel/..."
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

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-ui-fg-base px-4 text-sm font-medium text-ui-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Instagram URL"}
        </button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default ProductInstagramWidget
