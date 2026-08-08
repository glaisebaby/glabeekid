import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"

type AnalyticsResponse = {
  viewer: {
    email: string
    firstName: string | null
    lastName: string | null
  }
  configuration: {
    days: number
    acceptedCostKeys: string[]
  }
  summary: {
    ordersPlaced: number
    paidOrders: number
    unpaidOrders: number
    unitsSold: number
    recognizedRevenue: number
    refundedTotal: number
    netRevenue: number
    estimatedCogs: number
    estimatedProfit: number
    profitMarginPct: number
    missingCostUnits: number
  }
  daily: Array<{
    date: string
    ordersPlaced: number
    paidOrders: number
    placedRevenue: number
    paidRevenue: number
    refundedTotal: number
    estimatedCogs: number
    estimatedProfit: number
  }>
  topProducts: Array<{
    title: string
    handle: string | null
    unitsSold: number
    revenue: number
    estimatedCogs: number
    estimatedProfit: number
    marginPct: number
    missingCostUnits: number
  }>
  recentOrders: Array<{
    id: string
    displayId: number
    email: string | null
    status: string
    createdAt: string
    paidTotal: number
    refundedTotal: number
    netRevenue: number
    estimatedCogs: number
    estimatedProfit: number
    marginPct: number
    missingCostUnits: number
  }>
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value)

const formatPercent = (value: number) => `${value.toFixed(1)}%`

const fetchAnalytics = async (days: number): Promise<AnalyticsResponse> => {
  const response = await fetch(`/admin/analytics/profit?days=${days}`, {
    credentials: "include",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(payload?.message || "Failed to load analytics.")
  }

  return response.json()
}

const StatCard = ({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) => (
  <div className="rounded-2xl border border-ui-border-base bg-ui-bg-base px-4 py-4 shadow-elevation-card-rest">
    <Text className="text-xs font-medium uppercase tracking-[0.16em] text-ui-fg-subtle">
      {label}
    </Text>
    <Heading level="h2" className="mt-3 text-2xl">
      {value}
    </Heading>
    {helper ? (
      <Text className="mt-2 text-sm leading-6 text-ui-fg-subtle">{helper}</Text>
    ) : null}
  </div>
)

const ReportsPage = () => {
  const [days, setDays] = useState(30)
  const { data, isLoading, error } = useQuery({
    queryKey: ["profit-analytics", days],
    queryFn: () => fetchAnalytics(days),
  })

  const chartMax = useMemo(() => {
    if (!data?.daily.length) {
      return 1
    }

    return Math.max(
      ...data.daily.flatMap((day) => [day.paidRevenue, day.estimatedProfit, 1])
    )
  }, [data])

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Heading level="h1">Profit Analytics</Heading>
            <Text className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">
              Monitor orders placed, paid revenue, refunds, estimated cost of
              goods, and profit trends. Cost calculations use variant metadata
              first, then product metadata.
            </Text>
            {data ? (
              <Text className="mt-2 text-sm text-ui-fg-subtle">
                Signed in as {data.viewer.email}
              </Text>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                onClick={() => setDays(value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  days === value
                    ? "border-ui-fg-base bg-ui-fg-base text-ui-bg-base"
                    : "border-ui-border-base bg-ui-bg-base text-ui-fg-subtle hover:border-ui-fg-base hover:text-ui-fg-base"
                }`}
              >
                Last {value} days
              </button>
            ))}
          </div>
        </div>
      </Container>

      {error ? (
        <Container className="p-6">
          <Heading level="h2">Access or data error</Heading>
          <Text className="mt-2 text-sm leading-6 text-ui-fg-subtle">
            {error instanceof Error ? error.message : "Failed to load analytics."}
          </Text>
        </Container>
      ) : null}

      {isLoading ? (
        <Container className="p-6">
          <Text>Loading analytics...</Text>
        </Container>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Orders placed"
              value={String(data.summary.ordersPlaced)}
              helper={`${data.summary.paidOrders} paid / ${data.summary.unpaidOrders} awaiting payment`}
            />
            <StatCard
              label="Net revenue"
              value={formatCurrency(data.summary.netRevenue)}
              helper={`Recognized ${formatCurrency(
                data.summary.recognizedRevenue
              )} with refunds of ${formatCurrency(data.summary.refundedTotal)}`}
            />
            <StatCard
              label="Estimated profit"
              value={formatCurrency(data.summary.estimatedProfit)}
              helper={`COGS ${formatCurrency(
                data.summary.estimatedCogs
              )} | Margin ${formatPercent(data.summary.profitMarginPct)}`}
            />
            <StatCard
              label="Units sold"
              value={String(data.summary.unitsSold)}
              helper={
                data.summary.missingCostUnits > 0
                  ? `${data.summary.missingCostUnits} unit(s) missing cost metadata`
                  : "Cost metadata coverage is complete for paid units"
              }
            />
          </div>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Revenue vs Profit Trend</Heading>
              <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
                Daily view of paid revenue and estimated profit for the selected
                time window.
              </Text>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-10">
                {data.daily.map((day) => (
                  <div
                    key={day.date}
                    className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-3"
                  >
                    <Text className="text-[11px] uppercase tracking-[0.12em] text-ui-fg-subtle">
                      {day.date.slice(5)}
                    </Text>
                    <div className="mt-4 flex h-28 items-end gap-2">
                      <div className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-full bg-[#111827]"
                          style={{
                            height: `${Math.max(
                              10,
                              (day.paidRevenue / chartMax) * 100
                            )}%`,
                          }}
                        />
                        <Text className="text-[10px] text-ui-fg-subtle">Rev</Text>
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-full bg-[#16a34a]"
                          style={{
                            height: `${Math.max(
                              10,
                              (Math.max(day.estimatedProfit, 0) / chartMax) * 100
                            )}%`,
                          }}
                        />
                        <Text className="text-[10px] text-ui-fg-subtle">Profit</Text>
                      </div>
                    </div>
                    <Text className="mt-4 text-xs text-ui-fg-subtle">
                      {formatCurrency(day.paidRevenue)}
                    </Text>
                    <Text className="mt-1 text-sm font-medium text-ui-fg-base">
                      {formatCurrency(day.estimatedProfit)}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Container>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Container className="p-0">
              <div className="border-b border-ui-border-base px-6 py-4">
                <Heading level="h2">Top Products by Profit</Heading>
                <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
                  Product profitability uses paid order items and your cost metadata.
                </Text>
              </div>
              <div className="overflow-x-auto px-6 py-4">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ui-border-base text-ui-fg-subtle">
                      <th className="py-3 pr-4 font-medium">Product</th>
                      <th className="py-3 pr-4 font-medium">Units</th>
                      <th className="py-3 pr-4 font-medium">Revenue</th>
                      <th className="py-3 pr-4 font-medium">Profit</th>
                      <th className="py-3 pr-4 font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((product) => (
                      <tr
                        key={`${product.handle || product.title}`}
                        className="border-b border-ui-border-base last:border-b-0"
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium text-ui-fg-base">
                            {product.title}
                          </div>
                          {product.missingCostUnits > 0 ? (
                            <Text className="mt-1 text-xs text-rose-600">
                              {product.missingCostUnits} unit(s) missing cost
                            </Text>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">{product.unitsSold}</td>
                        <td className="py-3 pr-4">
                          {formatCurrency(product.revenue)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatCurrency(product.estimatedProfit)}
                        </td>
                        <td className="py-3 pr-4">
                          {formatPercent(product.marginPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Container>

            <Container className="p-0">
              <div className="border-b border-ui-border-base px-6 py-4">
                <Heading level="h2">Cost Metadata Keys</Heading>
                <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
                  Add one of these metadata keys on a variant first, or on the
                  product as a fallback, to power profit calculations.
                </Text>
              </div>
              <div className="flex flex-wrap gap-2 px-6 py-5">
                {data.configuration.acceptedCostKeys.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-ui-border-base bg-ui-bg-subtle px-3 py-1 text-xs font-medium text-ui-fg-base"
                  >
                    {key}
                  </span>
                ))}
              </div>
            </Container>
          </div>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Recent Orders</Heading>
              <Text className="mt-1 text-sm leading-6 text-ui-fg-subtle">
                Order-level revenue, cost, and profit snapshot for quick review.
              </Text>
            </div>
            <div className="overflow-x-auto px-6 py-4">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ui-border-base text-ui-fg-subtle">
                    <th className="py-3 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">Placed</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Net revenue</th>
                    <th className="py-3 pr-4 font-medium">COGS</th>
                    <th className="py-3 pr-4 font-medium">Profit</th>
                    <th className="py-3 pr-4 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-ui-border-base last:border-b-0"
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium">#{order.displayId}</div>
                        <Text className="mt-1 text-xs text-ui-fg-subtle">
                          {order.email || "No customer email"}
                        </Text>
                      </td>
                      <td className="py-3 pr-4">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 pr-4">{order.status}</td>
                      <td className="py-3 pr-4">
                        {formatCurrency(order.netRevenue)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(order.estimatedCogs)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatCurrency(order.estimatedProfit)}
                      </td>
                      <td className="py-3 pr-4">
                        {formatPercent(order.marginPct)}
                        {order.missingCostUnits > 0 ? (
                          <Text className="mt-1 text-xs text-rose-600">
                            Missing cost on {order.missingCostUnits} unit(s)
                          </Text>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Profit Analytics",
  icon: ChartBar,
})

export default ReportsPage
