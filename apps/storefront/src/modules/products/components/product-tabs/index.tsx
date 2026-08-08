"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

type MetadataDetail = {
  label: string
  value: string
}

type SizeMeasurement = {
  label: string
  chest?: string
  totalHeight?: string
  shoulder?: string
  garmentLength?: string
}

const METADATA_EXCLUDE_KEYS = new Set([
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

const getMetadataRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

const readMeasurement = (
  metadata: Record<string, unknown>,
  keys: string[]
) => {
  for (const key of keys) {
    const value = metadata[key]

    if (typeof value === "number") {
      return `${value} cm`
    }

    if (typeof value === "string" && value.trim()) {
      return value.toLowerCase().includes("cm") ? value : `${value} cm`
    }
  }

  return undefined
}

const toDisplayValue = (value: unknown) => {
  if (typeof value === "number") {
    return String(value)
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (typeof value === "string" && value.trim()) {
    return value
  }

  return undefined
}

const formatMetadataLabel = (key: string) => {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const getProductMetadataDetails = (
  product: HttpTypes.StoreProduct,
  selectedVariant?: HttpTypes.StoreProductVariant
): MetadataDetail[] => {
  const metadata = {
    ...getMetadataRecord(product.metadata),
    ...getMetadataRecord(selectedVariant?.metadata),
  }

  return Object.entries(metadata)
    .filter(([key]) => !METADATA_EXCLUDE_KEYS.has(key))
    .map(([key, value]) => ({
      label: formatMetadataLabel(key),
      value: toDisplayValue(value),
    }))
    .filter(
      (detail): detail is MetadataDetail =>
        Boolean(detail.value) &&
        !["material", "country of origin", "type", "weight", "dimensions"].includes(
          detail.label.toLowerCase()
        )
    )
}

const getDefaultVariant = (product: HttpTypes.StoreProduct) =>
  (product.variants ?? []).find((variant) => {
    if (!variant.manage_inventory) {
      return true
    }

    if (variant.allow_backorder) {
      return true
    }

    return (variant.inventory_quantity || 0) > 0
  }) ?? product.variants?.[0]

const getSizeMeasurements = (product: HttpTypes.StoreProduct): SizeMeasurement[] =>
  (product.variants ?? [])
    .map((variant) => {
      const metadata = getMetadataRecord(variant.metadata)
      const label =
        variant.title ||
        variant.options
          ?.map((option) => option.value)
          .filter(Boolean)
          .join(" / ") ||
        "Standard"

      const chest = readMeasurement(metadata, [
        "chest_cm",
        "chest",
        "chest_size_cm",
      ])
      const totalHeight = readMeasurement(metadata, [
        "total_height_cm",
        "height_cm",
        "total_height",
      ])
      const shoulder = readMeasurement(metadata, [
        "shoulder_to_shoulder_cm",
        "shoulder_cm",
        "shoulder",
      ])
      const garmentLength = readMeasurement(metadata, [
        "garment_length_cm",
        "length_cm",
        "length",
      ])

      if (!chest && !totalHeight && !shoulder && !garmentLength) {
        return null
      }

      return {
        label,
        chest,
        totalHeight,
        shoulder,
        garmentLength,
      }
    })
    .filter((item): item is SizeMeasurement => item !== null)

const ProductTabs = ({ product }: ProductTabsProps) => {
  const searchParams = useSearchParams()
  const selectedVariantId = searchParams.get("v_id")
  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) {
      return undefined
    }

    return (
      product.variants.find((variant) => variant.id === selectedVariantId) ??
      getDefaultVariant(product)
    )
  }, [product, selectedVariantId])
  const sizeMeasurements = getSizeMeasurements(product)
  const metadata = getMetadataRecord(product.metadata)
  const hasSizeChartImage =
    typeof metadata.size_chart_image_url === "string" ||
    (Array.isArray(metadata.size_chart_image_urls) &&
      metadata.size_chart_image_urls.length > 0)

  const tabs = [
    {
      label: "Product Information",
      component: (
        <ProductInfoTab product={product} selectedVariant={selectedVariant} />
      ),
    },
    ...(sizeMeasurements.length || hasSizeChartImage
      ? [
          {
            label: "Size Guide",
            component: <SizeGuideTab measurements={sizeMeasurements} />,
          },
        ]
      : []),
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const SizeGuideTab = ({ measurements }: { measurements: SizeMeasurement[] }) => {
  return (
    <div id="size-guide" className="py-8 scroll-mt-32">
      <p className="max-w-2xl text-sm leading-6 text-ui-fg-subtle">
        All garment measurements are shown in centimeters. For best fit, compare
        these values with a similar outfit your child already wears comfortably.
      </p>

      {measurements.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ui-border-base">
          <table className="min-w-full divide-y divide-ui-border-base text-left text-sm">
            <thead className="bg-ui-bg-subtle">
              <tr>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">Chest</th>
                <th className="px-4 py-3 font-semibold">Total Height</th>
                <th className="px-4 py-3 font-semibold">Shoulder to Shoulder</th>
                <th className="px-4 py-3 font-semibold">Garment Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ui-border-base bg-white">
              {measurements.map((measurement) => (
                <tr key={measurement.label}>
                  <td className="px-4 py-3 font-medium text-ui-fg-base">
                    {measurement.label}
                  </td>
                  <td className="px-4 py-3">{measurement.chest ?? "-"}</td>
                  <td className="px-4 py-3">{measurement.totalHeight ?? "-"}</td>
                  <td className="px-4 py-3">{measurement.shoulder ?? "-"}</td>
                  <td className="px-4 py-3">
                    {measurement.garmentLength ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ui-fg-subtle">
          Add variant measurement metadata in Medusa admin to display the size
          guide table here.
        </p>
      )}

      <p className="mt-4 text-sm text-ui-fg-subtle">
        If you upload a size-chart image to the product gallery, or add
        `size_chart_image_url` in product metadata, it will also appear with the
        product images.
      </p>
    </div>
  )
}

const ProductInfoTab = ({
  product,
  selectedVariant,
}: ProductTabsProps & { selectedVariant?: HttpTypes.StoreProductVariant }) => {
  const metadataDetails = getProductMetadataDetails(product, selectedVariant)
  const selectedVariantLabel =
    selectedVariant?.title ||
    selectedVariant?.options
      ?.map((option) => option.value)
      .filter(Boolean)
      .join(" / ")

  return (
    <div className="text-small-regular py-8">
      {selectedVariantLabel ? (
        <p className="mb-6 text-sm text-ui-fg-subtle">
          Showing fit details for size{" "}
          <span className="font-semibold">{selectedVariantLabel}</span>.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-x-8">
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Material</span>
            <p>{product.material ? product.material : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Country of origin</span>
            <p>{product.origin_country ? product.origin_country : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Type</span>
            <p>{product.type ? product.type.value : "-"}</p>
          </div>
        </div>
        <div className="flex flex-col gap-y-4">
          <div>
            <span className="font-semibold">Weight</span>
            <p>{product.weight ? `${product.weight} g` : "-"}</p>
          </div>
          <div>
            <span className="font-semibold">Dimensions</span>
            <p>
              {product.length && product.width && product.height
                ? `${product.length}L x ${product.width}W x ${product.height}H`
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {metadataDetails.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
          {metadataDetails.map((detail) => (
            <div key={detail.label}>
              <span className="font-semibold">{detail.label}</span>
              <p>{detail.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Fast delivery</span>
            <p className="max-w-sm">
              Your package will arrive in 3-5 business days at your pick up
              location or in the comfort of your home.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Simple exchanges</span>
            <p className="max-w-sm">
              Is the fit not quite right? No worries - we&apos;ll exchange your
              product for a new one.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Simple return process</span>
            <p className="max-w-sm">
              Just return your product and we&apos;ll refund your money. No
              questions asked – we&apos;ll do our best to make sure your return
              is hassle-free.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
