import { Container, Heading, Text } from "@modules/common/components/ui"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <div>
      <Heading level="h2" className="mb-5 text-2xl text-black">
        Payment
      </Heading>
      <div>
        {payment && (
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border border-black/8 bg-[#f8fafc] px-4 py-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                Payment method
              </Text>
              <Text
                className="text-sm text-black/68"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="border border-black/8 bg-[#f8fafc] px-4 py-4">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                Payment details
              </Text>
              <div className="flex items-center gap-2 text-sm text-black/68">
                <Container className="flex h-8 w-fit items-center border border-black/10 bg-white px-2">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} paid at ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-6" />
    </div>
  )
}

export default PaymentDetails
