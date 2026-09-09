import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"

import Divider from "@modules/common/components/divider"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div>
      <Heading level="h2" className="mb-5 text-2xl text-black">
        Delivery
      </Heading>
      <div className="grid gap-5 md:grid-cols-3">
        <div
          className="border border-black/8 bg-[#f8fafc] px-4 py-4"
          data-testid="shipping-address-summary"
        >
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Shipping Address
          </Text>
          <Text className="text-sm text-black/68">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          <Text className="text-sm text-black/68">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text className="text-sm text-black/68">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </Text>
          <Text className="text-sm text-black/68">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="border border-black/8 bg-[#f8fafc] px-4 py-4"
          data-testid="shipping-contact-summary"
        >
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Contact
          </Text>
          <Text className="text-sm text-black/68">
            {order.shipping_address?.phone}
          </Text>
          <Text className="break-all text-sm text-black/68">{order.email}</Text>
        </div>

        <div
          className="border border-black/8 bg-[#f8fafc] px-4 py-4"
          data-testid="shipping-method-summary"
        >
          <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Method
          </Text>
          <Text className="text-sm text-black/68">
            {(order.shipping_methods?.[0] as { name?: string })?.name} (
            {convertToLocale({
              amount: order.shipping_methods?.[0].total ?? 0,
              currency_code: order.currency_code,
            })}
            )
          </Text>
        </div>
      </div>
      <Divider className="mt-6" />
    </div>
  )
}

export default ShippingDetails
