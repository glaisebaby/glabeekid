"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const isVariantPurchasable = (variant?: HttpTypes.StoreProductVariant) => {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity || 0) > 0
}


export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const hasInitializedDefaultVariant = useRef(false)
  const countryCode = useParams().countryCode as string
  const productMetadata = (product.metadata ?? {}) as Record<string, unknown>

  // Default to the first purchasable variant so shoppers don't land on an
  // unnecessary out-of-stock state when stock is available in another option.
  useEffect(() => {
    if (hasInitializedDefaultVariant.current || !product.variants?.length) {
      return
    }

    const defaultVariant =
      product.variants.find((variant) => isVariantPurchasable(variant)) ||
      product.variants[0]

    const variantOptions = optionsAsKeymap(defaultVariant.options)
    setOptions((prev) => {
      if (isEqual(prev, variantOptions ?? {})) {
        return prev
      }

      return variantOptions ?? {}
    })
    hasInitializedDefaultVariant.current = true
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    return isVariantPurchasable(selectedVariant)
  }, [selectedVariant])

  const hasSelectedOptions = useMemo(() => {
    return Object.values(options).some((value) => Boolean(value))
  }, [options])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const hasSizeMeasurements = useMemo(() => {
    return (product.variants ?? []).some((variant) => {
      const metadata = (variant.metadata ?? {}) as Record<string, unknown>

      return [
        metadata.chest_cm,
        metadata.chest,
        metadata.chest_size_cm,
        metadata.total_height_cm,
        metadata.height_cm,
        metadata.total_height,
        metadata.shoulder_to_shoulder_cm,
        metadata.shoulder_cm,
        metadata.shoulder,
        metadata.garment_length_cm,
        metadata.length_cm,
        metadata.length,
      ].some((value) => typeof value === "string" || typeof value === "number")
    })
  }, [product.variants])

  const hasSizeChartImages = useMemo(() => {
    return (
      typeof productMetadata.size_chart_image_url === "string" ||
      (Array.isArray(productMetadata.size_chart_image_urls) &&
        productMetadata.size_chart_image_urls.length > 0)
    )
  }, [productMetadata])

  const hasVisibleSizeGuide = hasSizeMeasurements || hasSizeChartImages
  const sizeOption = (product.options ?? []).find((option) =>
    (option.title ?? "").toLowerCase().includes("size")
  )

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                    {hasVisibleSizeGuide && sizeOption?.id === option.id && (
                      <div className="mt-3 flex justify-end">
                        <LocalizedClientLink
                          href={`/products/${product.handle}#size-guide`}
                          className="inline-flex items-center rounded-full border border-[#1b2144]/15 bg-[#fff7eb] px-4 py-2 text-sm font-medium text-[#1b2144] transition-colors hover:bg-[#ffe8bf]"
                        >
                          View size chart
                        </LocalizedClientLink>
                      </div>
                    )}
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !hasSelectedOptions
            ? "Select variant"
            : selectedVariant && (!inStock || !isValidVariant)
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
