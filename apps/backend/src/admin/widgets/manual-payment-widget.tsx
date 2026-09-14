import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useState } from "react"

type PaymentCollection = {
  id: string
  status?: string
  amount?: number
}

type ManualPaymentWidgetProps = {
  data?: {
    id: string
    currency_code?: string
    payment_status?: string
    total?: number
    paid_total?: number
    summary?: {
      pending_difference?: number
    }
    payment_collections?: PaymentCollection[]
  }
}

const PAID_COLLECTION_STATUSES = new Set(["completed"])
const PAYABLE_COLLECTION_STATUSES = new Set([
  "not_paid",
  "awaiting",
  "authorized",
  "partially_authorized",
])

const formatAmount = (amount: number, currencyCode?: string) => {
  const divisor = currencyCode?.toLowerCase() === "inr" ? 100 : 100

  return `${currencyCode?.toUpperCase() ?? "INR"} ${(amount / divisor).toFixed(2)}`
}

const getOutstandingAmount = (order?: ManualPaymentWidgetProps["data"]) => {
  if (!order) {
    return 0
  }

  if (typeof order.summary?.pending_difference === "number") {
    return Math.max(order.summary.pending_difference, 0)
  }

  return Math.max((order.total ?? 0) - (order.paid_total ?? 0), 0)
}

const getPayableCollection = (order?: ManualPaymentWidgetProps["data"]) =>
  order?.payment_collections?.find((collection) =>
    PAYABLE_COLLECTION_STATUSES.has(collection.status ?? "")
  )

const ManualPaymentWidget = ({ data }: ManualPaymentWidgetProps) => {
  const orderId = data?.id
  const outstandingAmount = getOutstandingAmount(data)
  const payableCollection = getPayableCollection(data)
  const isPaid =
    data?.payment_status === "captured" ||
    data?.payment_collections?.some((collection) =>
      PAID_COLLECTION_STATUSES.has(collection.status ?? "")
    )
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error"
    message?: string
  }>({ type: "idle" })
  const [isSaving, setIsSaving] = useState(false)

  const requestJson = async <ResponseBody,>(
    url: string,
    body: Record<string, unknown>
  ) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null

      throw new Error(payload?.message || "Manual payment update failed.")
    }

    return (await response.json()) as ResponseBody
  }

  const getPaymentCollectionId = async () => {
    if (payableCollection?.id) {
      return payableCollection.id
    }

    if (!orderId || outstandingAmount <= 0) {
      throw new Error("There is no outstanding amount to mark as paid.")
    }

    const payload = await requestJson<{
      payment_collection?: PaymentCollection
    }>("/admin/payment-collections", {
      order_id: orderId,
      amount: outstandingAmount,
    })

    if (!payload.payment_collection?.id) {
      throw new Error("Payment collection was not created.")
    }

    return payload.payment_collection.id
  }

  const handleMarkPaid = async () => {
    if (!orderId) {
      setStatus({
        type: "error",
        message: "Order details are missing, so payment was not updated.",
      })
      return
    }

    if (isPaid || outstandingAmount <= 0) {
      setStatus({
        type: "success",
        message: "This order is already paid.",
      })
      return
    }

    const confirmed = window.confirm(
      `Mark this order as manually paid for ${formatAmount(
        outstandingAmount,
        data?.currency_code
      )}?`
    )

    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setStatus({ type: "idle" })

    try {
      const paymentCollectionId = await getPaymentCollectionId()

      await requestJson(
        `/admin/payment-collections/${paymentCollectionId}/mark-as-paid`,
        {
          order_id: orderId,
        }
      )

      setStatus({
        type: "success",
        message: "Order marked as manually paid. Refreshing order...",
      })

      window.setTimeout(() => window.location.reload(), 800)
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to mark order as manually paid.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-4">
        <Heading level="h2">Manual Payment</Heading>
        <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
          Use this after receiving cash, UPI, bank transfer, or any other
          offline payment.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle px-3 py-3">
          <Text className="text-sm text-ui-fg-subtle">Outstanding amount</Text>
          <Text className="mt-1 text-lg font-semibold text-ui-fg-base">
            {formatAmount(outstandingAmount, data?.currency_code)}
          </Text>
        </div>

        {status.message ? (
          <Text
            className={`text-sm ${
              status.type === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {status.message}
          </Text>
        ) : null}

        <button
          type="button"
          onClick={handleMarkPaid}
          disabled={isSaving || isPaid || outstandingAmount <= 0}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-ui-fg-base px-4 text-sm font-medium text-ui-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Marking paid..." : isPaid ? "Already paid" : "Mark as paid manually"}
        </button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default ManualPaymentWidget
