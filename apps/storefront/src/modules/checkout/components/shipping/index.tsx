"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import { Button, clx, Heading, Text } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const DELIVERY_COPY: Record<
  string,
  {
    badge: string
    title: string
    description: string
  }
> = {
  express: {
    badge: "Fast delivery",
    title: "Express delivery",
    description: "Priority dispatch for urgent orders and gifting needs.",
  },
  standard: {
    badge: "Everyday value",
    title: "Standard delivery",
    description: "Balanced delivery speed for most family orders.",
  },
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) => (sm as unknown as { service_zone?: { fulfillment_set?: { type?: string; location?: { address: HttpTypes.StoreCartAddress } } } }).service_zone?.fulfillment_set?.type !== "pickup"
  )

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              if (p.value?.id) {
                pricesMap[p.value.id] = p.value.amount ?? 0
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }
  }, [_shippingMethods, cart.id])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string
  ) => {
    setError(null)

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ui-fg-base">
                Delivery speed
              </span>
              <span className="mb-4 text-ui-fg-muted txt-medium">
                Choose how quickly you want the order delivered.
              </span>
            </div>
            <div data-testid="delivery-options-container">
              <div className="pb-8 md:pt-0 pt-2">
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v)
                    }
                  }}
                  className="grid gap-4 md:grid-cols-2"
                >
                  {_shippingMethods?.map((option) => {
                    const isDisabled =
                      option.price_type === "calculated" &&
                      !isLoadingPrices &&
                      typeof calculatedPricesMap[option.id] !== "number"
                    const optionCode =
                      option.data?.type?.code ||
                      option.name?.toLowerCase().replace(/\s+/g, "_") ||
                      "standard"
                    const copy =
                      DELIVERY_COPY[optionCode.replace(/_shipping$/, "")] ||
                      {
                        badge: "Delivery option",
                        title: option.name,
                        description:
                          "Reliable courier delivery for your order.",
                      }
                    const amount =
                      option.price_type === "flat"
                        ? option.amount!
                        : calculatedPricesMap[option.id]

                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        disabled={isDisabled}
                        className={clx(
                          "relative flex h-full cursor-pointer flex-col rounded-[28px] border p-6 text-left transition-all",
                          {
                            "border-[#1b2144] bg-[#fff6ea] shadow-[0_18px_42px_rgba(27,33,68,0.12)]":
                              option.id === shippingMethodId,
                            "border-ui-border-base bg-white hover:border-[#f0b457] hover:shadow-[0_14px_34px_rgba(27,33,68,0.08)]":
                              option.id !== shippingMethodId,
                            "cursor-not-allowed opacity-50":
                              isDisabled,
                          }
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <Text className="mb-3 inline-flex rounded-full bg-[#ffe3b9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#9a5b00]">
                              {copy.badge}
                            </Text>
                            <Heading
                              level="h3"
                              className="text-xl text-[#1b2144]"
                            >
                              {copy.title}
                            </Heading>
                            <Text className="mt-2 text-sm leading-6 text-[#59627f]">
                              {copy.description}
                            </Text>
                          </div>
                          <div
                            className={clx(
                              "mt-1 flex h-6 w-6 items-center justify-center rounded-full border",
                              {
                                "border-[#1b2144] bg-[#1b2144] text-white":
                                  option.id === shippingMethodId,
                                "border-[#cfd5e6] bg-white":
                                  option.id !== shippingMethodId,
                              }
                            )}
                          >
                            {option.id === shippingMethodId && (
                              <CheckCircleSolid className="h-4 w-4" />
                            )}
                          </div>
                        </div>

                        <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#f1e3d1] pt-4">
                          <div>
                            <Text className="text-xs uppercase tracking-[0.18em] text-[#8e96b1]">
                              Charge
                            </Text>
                            <Text className="mt-1 text-lg font-semibold text-[#1b2144]">
                              {typeof amount === "number" ? (
                                convertToLocale({
                                  amount,
                                  currency_code: cart?.currency_code,
                                })
                              ) : isLoadingPrices ? (
                                <span className="inline-flex items-center gap-2">
                                  <Loader />
                                  Loading
                                </span>
                              ) : (
                                "-"
                              )}
                            </Text>
                          </div>
                          <Text className="text-sm font-medium text-[#42508c]">
                            {copy.badge}
                          </Text>
                        </div>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-[28px] border border-[#f2dfc6] bg-[#fffaf3] p-5">
            <Text className="text-sm leading-6 text-[#5d6682]">
              Courier partner is assigned after order confirmation based on your
              delivery address. Right now, shoppers only need to choose delivery
              speed.
            </Text>
          </div>

          <div>
            <ErrorMessage
              error={error}
              data-testid="delivery-option-error-message"
            />
            <Button
              size="large"
              className="mt"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!cart.shipping_methods?.[0]}
              data-testid="submit-delivery-option-button"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Delivery speed
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {cart.shipping_methods!.at(-1)!.name}{" "}
                  {convertToLocale({
                    amount: cart.shipping_methods!.at(-1)!.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
