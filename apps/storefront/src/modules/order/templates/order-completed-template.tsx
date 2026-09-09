import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="glabee-section min-h-[calc(100vh-64px)]">
      <div className="content-container flex w-full max-w-6xl flex-col gap-y-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <section
          className="border border-black/8 bg-[linear-gradient(135deg,#ffffff_0%,#f7f9fc_55%,#eef4fb_100%)] px-5 py-8 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:px-8 sm:py-10"
          data-testid="order-complete-container"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px]">
            <div>
              <Text className="mb-3 inline-flex border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                Order confirmed
              </Text>
              <Heading
                level="h1"
                className="max-w-3xl text-[2.4rem] leading-[1.02] text-black sm:text-[3.3rem]"
              >
                Your Glabeekid order is placed and ready for the next step.
              </Heading>
              <Text className="mt-4 max-w-2xl text-sm leading-7 text-black/66 sm:text-base">
                We have recorded your order, shared the confirmation to your email,
                and prepared everything for delivery updates.
              </Text>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="border border-black/8 bg-white px-4 py-4">
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                    Order number
                  </Text>
                  <Text
                    className="mt-2 text-xl font-semibold text-black"
                    data-testid="order-confirmed-display-id"
                  >
                    #{order.display_id}
                  </Text>
                </div>
                <div className="border border-black/8 bg-white px-4 py-4">
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                    Payment
                  </Text>
                  <Text className="mt-2 text-xl font-semibold text-black">
                    {order.payment_status?.split("_").join(" ")}
                  </Text>
                </div>
                <div className="border border-black/8 bg-white px-4 py-4">
                  <Text className="text-[11px] font-semibold uppercase tracking-[0.22em] text-black/45">
                    Delivery
                  </Text>
                  <Text className="mt-2 text-xl font-semibold text-black">
                    {order.fulfillment_status?.split("_").join(" ")}
                  </Text>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <LocalizedClientLink
                  href="/store"
                  className="inline-flex items-center justify-center border border-black bg-black px-5 py-3 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#1d1d1d]"
                >
                  Continue shopping
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/account/orders"
                  className="inline-flex items-center justify-center border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#f5f8fc]"
                >
                  View my orders
                </LocalizedClientLink>
              </div>
            </div>

            <aside className="border border-black/8 bg-white p-5">
              <Text className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/45">
                Customer update
              </Text>
              <Text className="mt-4 text-sm leading-7 text-black/68">
                A confirmation has been sent to your inbox. Delivery updates will
                be shared as the order moves from review to dispatch.
              </Text>
              <div className="mt-5 border-t border-black/8 pt-5">
                <Text className="text-xs uppercase tracking-[0.2em] text-black/45">
                  Contact email
                </Text>
                <Text className="mt-2 break-all text-sm font-medium text-black">
                  {order.email}
                </Text>
              </div>
            </aside>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="border border-black/8 bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <Heading level="h2" className="text-3xl text-black">
                Order summary
              </Heading>
              <Text className="text-xs uppercase tracking-[0.22em] text-black/45">
                {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? "" : "s"}
              </Text>
            </div>
            <OrderDetails order={order} showStatus />
            <div className="mt-6">
              <Items order={order} />
            </div>
          </section>

          <div className="flex flex-col gap-8">
            <section className="border border-black/8 bg-white p-5 sm:p-6">
              <Heading level="h2" className="mb-5 text-2xl text-black">
                Payment snapshot
              </Heading>
              <CartTotals totals={order} />
            </section>

            <section className="border border-black/8 bg-white p-5 sm:p-6">
              <ShippingDetails order={order} />
            </section>

            <section className="border border-black/8 bg-white p-5 sm:p-6">
              <PaymentDetails order={order} />
            </section>

            <section className="border border-black/8 bg-white p-5 sm:p-6">
              <Help />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
