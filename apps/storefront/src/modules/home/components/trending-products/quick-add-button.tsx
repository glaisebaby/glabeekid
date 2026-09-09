"use client"

import { addToCart } from "@lib/data/cart"
import { getPublicStorefrontPath } from "@lib/util/localized-path"
import { Button } from "@modules/common/components/ui"
import { useParams, useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type QuickAddButtonProps = {
  handle: string
  title: string
  variantId?: string
  disabled?: boolean
}

export default function QuickAddButton({
  handle,
  title,
  variantId,
  disabled,
}: QuickAddButtonProps) {
  const params = useParams()
  const router = useRouter()
  const countryCode = params.countryCode as string
  const [added, setAdded] = useState(false)
  const [isPending, startTransition] = useTransition()

  const canQuickAdd = !!variantId && !disabled

  const handleClick = () => {
    if (!canQuickAdd || !variantId) {
      router.push(getPublicStorefrontPath(`/products/${handle}`, countryCode))
      return
    }

    startTransition(async () => {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode,
      })

      setAdded(true)
      router.refresh()
      window.setTimeout(() => setAdded(false), 1800)
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isPending}
      isLoading={isPending}
      className="h-11 w-full border-black bg-black text-white hover:bg-[#1d1d1d]"
      aria-label={canQuickAdd ? `Add ${title} to cart` : `Choose options for ${title}`}
    >
      {canQuickAdd ? (added ? "Added to cart" : "Add to cart") : "Choose size"}
    </Button>
  )
}
