"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
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

  const selectedMeasurements = useMemo(() => {
    const metadata = (selectedVariant?.metadata ?? {}) as Record<string, unknown>
    const chest = readMeasurement(metadata, [
      "chest_cm",
      "chest",
      "chest_size_cm",
    ])
    const shoulder = readMeasurement(metadata, [
      "shoulder_to_shoulder_cm",
      "shoulder_cm",
      "shoulder",
    ])
    const length = readMeasurement(metadata, [
      "garment_length_cm",
      "length_cm",
      "length",
    ])
    const totalHeight = readMeasurement(metadata, [
      "total_height_cm",
      "height_cm",
      "total_height",
    ])

    return { chest, shoulder, length, totalHeight }
  }, [selectedVariant])
  const hasSelectedMeasurements = Object.values(selectedMeasurements).some(Boolean)

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
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {hasSelectedMeasurements && selectedVariant ? (
          <div className="border border-black/10 bg-[#fffaf3] px-4 py-3 text-sm text-black">
            <p className="font-semibold">
              Measurements for selected size {selectedVariant.title}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs leading-5 text-black/70">
              {selectedMeasurements.shoulder ? (
                <p>Shoulder: {selectedMeasurements.shoulder}</p>
              ) : null}
              {selectedMeasurements.chest ? (
                <p>Chest: {selectedMeasurements.chest}</p>
              ) : null}
              {selectedMeasurements.length ? (
                <p>Length: {selectedMeasurements.length}</p>
              ) : null}
              {selectedMeasurements.totalHeight ? (
                <p>Total height: {selectedMeasurements.totalHeight}</p>
              ) : null}
            </div>
          </div>
        ) : null}

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
        <p className="text-xs text-black/52">
          {isAdding
            ? "Adding to cart. Usually takes 1-2 seconds."
            : "Stock and pricing refresh automatically when you switch options."}
        </p>
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
