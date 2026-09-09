import { Dialog, Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import useToggleState from "@lib/hooks/use-toggle-state"
import { getProductPrice } from "@lib/util/get-product-price"
import { isSimpleProduct } from "@lib/util/product"
import ChevronDown from "@modules/common/icons/chevron-down"
import X from "@modules/common/icons/x"
import { Button, clx } from "@modules/common/components/ui"
import React, { Fragment, useMemo } from "react"

import OptionSelect from "./option-select"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }

    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const hasSelectedOptions = useMemo(() => {
    return Object.values(options).some((value) => Boolean(value))
  }, [options])

  const isSimple = isSimpleProduct(product)
  const selectedOptionsLabel = Object.values(options).filter(Boolean).join(" / ")

  return (
    <>
      <div
        className={clx("fixed inset-x-0 bottom-0 z-50 lg:hidden", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-in-out duration-300"
          enterFrom="translate-y-full opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="ease-in duration-200"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="translate-y-full opacity-0"
        >
          <div
            className="flex h-full w-full flex-col gap-y-3 border-t border-black/10 bg-[#fdfefe] p-4 text-large-regular shadow-[0_-12px_24px_rgba(15,23,42,0.05)]"
            data-testid="mobile-actions"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span
                  className="block truncate text-sm font-semibold text-black"
                  data-testid="mobile-title"
                >
                  {product.title}
                </span>
                {selectedPrice ? (
                  <div className="mt-1 flex items-end gap-x-2 text-ui-fg-base">
                    {selectedPrice.price_type === "sale" && (
                      <span className="text-xs text-black/45 line-through">
                        {selectedPrice.original_price}
                      </span>
                    )}
                    <span
                      className={clx("text-sm font-semibold", {
                        "text-ui-fg-interactive":
                          selectedPrice.price_type === "sale",
                      })}
                    >
                      {selectedPrice.calculated_price}
                    </span>
                  </div>
                ) : null}
              </div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-black/40">
                Quick actions
              </span>
            </div>

            <div
              className={clx("grid w-full grid-cols-2 gap-x-3", {
                "!grid-cols-1": isSimple,
              })}
            >
              {!isSimple && (
                <Button
                  onClick={open}
                  variant="secondary"
                  className="w-full border-black/12 bg-white text-black hover:bg-[#f4f7fb]"
                  data-testid="mobile-actions-button"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="truncate">
                      {variant ? selectedOptionsLabel : "Select options"}
                    </span>
                    <ChevronDown />
                  </div>
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || !variant}
                className="w-full"
                isLoading={isAdding}
                data-testid="mobile-cart-button"
              >
                {!variant && !hasSelectedOptions
                  ? "Select variant"
                  : variant && !inStock
                    ? "Out of stock"
                    : "Add to cart"}
              </Button>
            </div>
          </div>
        </Transition>
      </div>

      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/55 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0">
            <div className="flex min-h-full items-end justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="translate-y-full opacity-0"
                enterTo="translate-y-0 opacity-100"
                leave="ease-in duration-200"
                leaveFrom="translate-y-0 opacity-100"
                leaveTo="translate-y-full opacity-0"
              >
                <Dialog.Panel
                  className="flex w-full flex-col gap-y-3 overflow-hidden text-left"
                  data-testid="mobile-actions-modal"
                >
                  <div className="flex w-full justify-end pr-5">
                    <button
                      onClick={close}
                      className="flex h-12 w-12 items-center justify-center border border-black/12 bg-white text-ui-fg-base"
                      data-testid="close-modal-button"
                    >
                      <X />
                    </button>
                  </div>
                  <div className="border-t border-black/10 bg-[#fdfefe] px-5 py-8">
                    {(product.variants?.length ?? 0) > 1 && (
                      <div className="flex flex-col gap-y-6">
                        {(product.options || []).map((option) => {
                          return (
                            <div key={option.id}>
                              <OptionSelect
                                option={option}
                                current={options[option.id]}
                                updateOption={updateOptions}
                                title={option.title ?? ""}
                                disabled={optionsDisabled}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
