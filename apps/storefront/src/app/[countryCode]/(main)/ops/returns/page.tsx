import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, Text } from "@modules/common/components/ui"
import {
  createReturnCase,
  listRecentSoldItems,
  listReturnCases,
  markRefunded,
  markReturnReceived,
  moveToNotFitToSale,
  restockReturnedItem,
} from "@lib/data/india-ops"

export const metadata = {
  title: "Returns Operations | Glabeekid",
}

const statusTone: Record<string, string> = {
  requested: "bg-[#fff1da] text-[#9a5b00]",
  received: "bg-[#e9f5ff] text-[#1d5f8c]",
  inspected: "bg-[#eef7ea] text-[#2f6b1a]",
}

export default async function ReturnsOperationsPage() {
  const [recentSoldItems, returnCases] = await Promise.all([
    listRecentSoldItems(),
    listReturnCases(),
  ])

  return (
    <div className="content-container py-10">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Text className="mb-3 inline-flex rounded-full bg-[#ffe3b9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#9a5b00]">
            India operations
          </Text>
          <Heading level="h1" className="text-4xl text-[#1b2144]">
            Returns and inspection desk
          </Heading>
          <Text className="mt-3 max-w-3xl text-base leading-7 text-[#5c6480]">
            Track returned items, mark them as refunded, restock clean pieces,
            or move damaged items into the Not Fit to Sale list.
          </Text>
        </div>
        <LocalizedClientLink href="/ops/not-fit-to-sale" className="text-sm font-medium text-[#1b2144] underline-offset-4 hover:underline">
          View Not Fit to Sale items
        </LocalizedClientLink>
      </div>

      <section className="mb-12 rounded-[28px] border border-[#f0dcc7] bg-white p-6 shadow-[0_18px_44px_rgba(27,33,68,0.06)]">
        <div className="mb-6 flex items-center justify-between">
          <Heading level="h2" className="text-2xl text-[#1b2144]">
            Active return cases
          </Heading>
          <Text className="text-sm text-[#68708b]">
            {returnCases.length} case{returnCases.length === 1 ? "" : "s"}
          </Text>
        </div>

        {returnCases.length ? (
          <div className="grid gap-4">
            {returnCases.map((item) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-[#efe3d5] bg-[#fffaf4] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          statusTone[item.inspectionStatus] || "bg-[#f1f3f8] text-[#506080]"
                        }`}
                      >
                        {item.inspectionStatus}
                      </span>
                      <span className="rounded-full bg-[#eef1fa] px-3 py-1 text-xs font-medium text-[#42508c]">
                        Refund: {item.refundStatus}
                      </span>
                      <span className="rounded-full bg-[#f7efe4] px-3 py-1 text-xs font-medium text-[#7f6338]">
                        Stock: {item.stockStatus.replaceAll("_", " ")}
                      </span>
                    </div>
                    <Heading level="h3" className="text-xl text-[#1b2144]">
                      {item.productTitle}
                    </Heading>
                    <Text className="mt-1 text-sm text-[#5c6480]">
                      Order #{item.orderDisplayId}
                      {item.variantTitle ? ` • ${item.variantTitle}` : ""}
                      {item.sku ? ` • SKU ${item.sku}` : ""}
                    </Text>
                    <Text className="mt-2 text-sm text-[#5c6480]">
                      Quantity: {item.quantity}
                      {item.requestedReason ? ` • ${item.requestedReason}` : ""}
                    </Text>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:w-[360px]">
                    <form action={markReturnReceived}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button className="h-11 w-full rounded-full bg-[#1b2144] hover:bg-[#2f3a75]">
                        Mark received
                      </Button>
                    </form>
                    <form action={markRefunded}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button
                        variant="secondary"
                        className="h-11 w-full rounded-full border-[#d8deef] bg-white text-[#1b2144]"
                      >
                        Mark refunded
                      </Button>
                    </form>
                    <form action={restockReturnedItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button
                        variant="secondary"
                        className="h-11 w-full rounded-full border-[#cbe9d1] bg-[#eefaf0] text-[#245d31]"
                      >
                        Restock inventory
                      </Button>
                    </form>
                    <form action={moveToNotFitToSale}>
                      <input type="hidden" name="id" value={item.id} />
                      <Button
                        variant="secondary"
                        className="h-11 w-full rounded-full border-[#efd6d6] bg-[#fff0f0] text-[#8b2f2f]"
                      >
                        Move to Not Fit to Sale
                      </Button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Text className="text-sm leading-6 text-[#5c6480]">
            No return cases yet. Use the recent sold items list below to create
            one when a customer asks for a return.
          </Text>
        )}
      </section>

      <section className="rounded-[28px] border border-[#f0dcc7] bg-white p-6 shadow-[0_18px_44px_rgba(27,33,68,0.06)]">
        <div className="mb-6">
          <Heading level="h2" className="text-2xl text-[#1b2144]">
            Recent sold items
          </Heading>
          <Text className="mt-2 text-sm leading-6 text-[#5c6480]">
            Create a return case from a sold order line. For launch, one return
            case is tracked per sold line item.
          </Text>
        </div>

        <div className="grid gap-4">
          {recentSoldItems.map((item) => (
            <article
              key={item.orderItemId}
              className="flex flex-col gap-4 rounded-[24px] border border-[#efe3d5] bg-[#fffdf9] p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <Heading level="h3" className="text-xl text-[#1b2144]">
                  {item.productTitle}
                </Heading>
                <Text className="mt-1 text-sm text-[#5c6480]">
                  Order #{item.orderDisplayId}
                  {item.variantTitle ? ` • ${item.variantTitle}` : ""}
                  {item.sku ? ` • SKU ${item.sku}` : ""}
                </Text>
                <Text className="mt-2 text-sm text-[#5c6480]">
                  Qty {item.quantity} • {item.currencyCode.toUpperCase()} {item.unitPrice}
                </Text>
              </div>
              {item.hasReturnCase ? (
                <span className="inline-flex rounded-full bg-[#eef1fa] px-4 py-2 text-sm font-medium text-[#42508c]">
                  Return case already created
                </span>
              ) : (
                <form action={createReturnCase}>
                  <input
                    type="hidden"
                    name="order_item_id"
                    value={item.orderItemId}
                  />
                  <Button className="h-11 rounded-full bg-[#ffb648] px-5 text-[#1b2144] hover:bg-[#ffc96e]">
                    Create return case
                  </Button>
                </form>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
