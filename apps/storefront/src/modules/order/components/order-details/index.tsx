import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div className="border border-black/8 bg-[#f8fafc] px-4 py-4 sm:px-5">
      <Text className="text-sm leading-7 text-black/68">
        We have sent the order confirmation details to{" "}
        <span
          className="font-semibold text-black"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2 text-sm text-black/68">
        Order date:{" "}
        <span className="font-medium text-black" data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-sm text-black/68">
        Order number:{" "}
        <span className="font-semibold text-black" data-testid="order-id">
          {order.display_id}
        </span>
      </Text>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-compact-small">
        {showStatus && (
          <>
            <Text className="border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-black/55">
              Order status:{" "}
              <span className="font-semibold text-black" data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text className="border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-[0.18em] text-black/55">
              Payment status:{" "}
              <span
                className="font-semibold text-black"
                data-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
