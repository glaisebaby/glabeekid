import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  canViewAnalytics,
  getDatabaseClient,
} from "../../../../lib/access-control"

type OrderRow = {
  id: string
  display_id: number
  email: string | null
  status: string
  currency_code: string
  created_at: string
  totals: {
    paid_total?: number | string
    refunded_total?: number | string
    current_order_total?: number | string
    original_order_total?: number | string
  } | null
}

type OrderItemRow = {
  order_id: string
  product_title: string | null
  product_handle: string | null
  variant_id: string | null
  variant_title: string | null
  quantity: string | number
  unit_price: string | number | null
  variant_metadata: Record<string, unknown> | null
  product_metadata: Record<string, unknown> | null
}

type MetadataObject = Record<string, unknown>

const COST_KEYS = [
  "cost_price",
  "costPrice",
  "cost_price_inr",
  "purchase_price",
  "purchasePrice",
  "purchase_cost",
  "cogs",
]

const normalizeNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined
  }

  if (typeof value === "string" && value.trim()) {
    const cleaned = value.replace(/[^\d.-]/g, "")
    const parsed = Number(cleaned)

    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const getCostPrice = (variantMetadata: MetadataObject, productMetadata: MetadataObject) => {
  for (const metadata of [variantMetadata, productMetadata]) {
    for (const key of COST_KEYS) {
      const value = normalizeNumber(metadata[key])

      if (value !== undefined) {
        return value
      }
    }
  }

  return undefined
}

const toMoney = (value: unknown) => normalizeNumber(value) ?? 0

const roundMoney = (value: number) => Math.round(value * 100) / 100

const formatDay = (value: Date) => value.toISOString().slice(0, 10)

const getDateWindow = (days: number) => {
  const safeDays = Number.isFinite(days) ? Math.min(Math.max(days, 7), 365) : 30
  const from = new Date()
  from.setUTCHours(0, 0, 0, 0)
  from.setUTCDate(from.getUTCDate() - (safeDays - 1))

  return {
    safeDays,
    from,
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const actorId = req.auth_context?.actor_id

  if (!actorId) {
    return res.status(401).json({ message: "Authentication required." })
  }

  const requestedDays = Number(req.query.days)
  const { safeDays, from } = getDateWindow(requestedDays)
  const client = await getDatabaseClient()

  try {
    const permission = await (async () => {
      const actorId = req.auth_context?.actor_id

      if (!actorId) {
        return {
          ok: false as const,
          status: 401,
          message: "Authentication required.",
        }
      }

      const users = await client.query<{
        id: string
        email: string
        first_name: string | null
        last_name: string | null
      }>(
        `select id, email, first_name, last_name from public."user" where id = $1 limit 1`,
        [actorId]
      )

      const actor = users.rows[0]

      if (!actor) {
        return {
          ok: false as const,
          status: 401,
          message: "Authentication required.",
        }
      }

      const allowed = await canViewAnalytics(client, actor.email)

      if (!allowed) {
        return {
          ok: false as const,
          status: 403,
          message: "You do not have permission to access analytics.",
        }
      }

      return {
        ok: true as const,
        actor,
      }
    })()

    if (!permission.ok) {
      return res.status(permission.status).json({
        message: permission.message,
      })
    }

    const [ordersResult, itemsResult] = await Promise.all([
      client.query<OrderRow>(
        `
          with latest_summaries as (
            select distinct on (order_id)
              order_id,
              totals,
              version
            from public.order_summary
            where deleted_at is null
            order by order_id, version desc, updated_at desc
          )
          select
            o.id,
            o.display_id,
            o.email,
            o.status::text,
            o.currency_code,
            o.created_at,
            ls.totals
          from public."order" o
          left join latest_summaries ls on ls.order_id = o.id
          where o.deleted_at is null
            and coalesce(o.is_draft_order, false) = false
            and o.created_at >= $1
          order by o.created_at desc
        `,
        [from.toISOString()]
      ),
      client.query<OrderItemRow>(
        `
          with latest_order_items as (
            select distinct on (oi.order_id, oi.item_id)
              oi.order_id,
              oi.item_id,
              oi.quantity,
              li.product_title,
              li.product_handle,
              li.variant_id,
              li.variant_title,
              li.unit_price,
              pv.metadata as variant_metadata,
              p.metadata as product_metadata
            from public.order_item oi
            join public.order_line_item li on li.id = oi.item_id and li.deleted_at is null
            left join public.product_variant pv on pv.id = li.variant_id and pv.deleted_at is null
            left join public.product p on p.id = li.product_id and p.deleted_at is null
            where oi.deleted_at is null
            order by oi.order_id, oi.item_id, oi.version desc, oi.updated_at desc
          )
          select *
          from latest_order_items
          where order_id in (
            select id
            from public."order"
            where deleted_at is null
              and coalesce(is_draft_order, false) = false
              and created_at >= $1
          )
        `,
        [from.toISOString()]
      ),
    ])

    const orders = ordersResult.rows.map((order) => {
      const paidTotal = toMoney(order.totals?.paid_total)
      const refundedTotal = toMoney(order.totals?.refunded_total)
      const placedTotal =
        toMoney(order.totals?.current_order_total) ||
        toMoney(order.totals?.original_order_total)

      return {
        id: order.id,
        displayId: order.display_id,
        email: order.email,
        status: order.status,
        currencyCode: order.currency_code,
        createdAt: order.created_at,
        paidTotal,
        refundedTotal,
        placedTotal,
        netRevenue: roundMoney(Math.max(paidTotal - refundedTotal, 0)),
      }
    })

    const paidOrderIds = new Set(
      orders.filter((order) => order.paidTotal > 0).map((order) => order.id)
    )

    const orderItemsByOrder = new Map<
      string,
      Array<{
        productTitle: string
        productHandle: string | null
        variantId: string | null
        variantTitle: string | null
        quantity: number
        unitPrice: number
        revenue: number
        costPrice?: number
        cogs: number
        missingCost: boolean
      }>
    >()

    for (const item of itemsResult.rows) {
      const quantity = toMoney(item.quantity)
      const unitPrice = toMoney(item.unit_price)
      const revenue = roundMoney(quantity * unitPrice)
      const costPrice = getCostPrice(
        (item.variant_metadata ?? {}) as MetadataObject,
        (item.product_metadata ?? {}) as MetadataObject
      )
      const cogs = roundMoney(quantity * (costPrice ?? 0))
      const normalizedItem = {
        productTitle: item.product_title ?? "Untitled product",
        productHandle: item.product_handle,
        variantId: item.variant_id,
        variantTitle: item.variant_title,
        quantity,
        unitPrice,
        revenue,
        costPrice,
        cogs,
        missingCost: costPrice === undefined,
      }

      const existing = orderItemsByOrder.get(item.order_id) ?? []
      existing.push(normalizedItem)
      orderItemsByOrder.set(item.order_id, existing)
    }

    const dayMap = new Map<
      string,
      {
        date: string
        ordersPlaced: number
        paidOrders: number
        placedRevenue: number
        paidRevenue: number
        refundedTotal: number
        estimatedCogs: number
        estimatedProfit: number
      }
    >()
    const productMap = new Map<
      string,
      {
        title: string
        handle: string | null
        unitsSold: number
        revenue: number
        estimatedCogs: number
        estimatedProfit: number
        missingCostUnits: number
      }
    >()

    let unitsSold = 0
    let estimatedCogs = 0
    let missingCostUnits = 0

    const recentOrders = orders.map((order) => {
      const items = orderItemsByOrder.get(order.id) ?? []
      const paidItems = paidOrderIds.has(order.id) ? items : []
      const orderCogs = roundMoney(
        paidItems.reduce((sum, item) => sum + item.cogs, 0)
      )
      const orderMissingCostUnits = paidItems.reduce(
        (sum, item) => sum + (item.missingCost ? item.quantity : 0),
        0
      )
      const orderProfit = roundMoney(order.netRevenue - orderCogs)
      const marginPct =
        order.netRevenue > 0
          ? roundMoney((orderProfit / order.netRevenue) * 100)
          : 0

      if (paidItems.length > 0) {
        unitsSold += paidItems.reduce((sum, item) => sum + item.quantity, 0)
        estimatedCogs += orderCogs
        missingCostUnits += orderMissingCostUnits

        for (const item of paidItems) {
          const key = item.productHandle || `${item.productTitle}:${item.variantId || "na"}`
          const current =
            productMap.get(key) ??
            {
              title: item.productTitle,
              handle: item.productHandle,
              unitsSold: 0,
              revenue: 0,
              estimatedCogs: 0,
              estimatedProfit: 0,
              missingCostUnits: 0,
            }

          current.unitsSold += item.quantity
          current.revenue += item.revenue
          current.estimatedCogs += item.cogs
          current.estimatedProfit += item.revenue - item.cogs
          current.missingCostUnits += item.missingCost ? item.quantity : 0
          productMap.set(key, current)
        }
      }

      const dayKey = formatDay(new Date(order.createdAt))
      const currentDay =
        dayMap.get(dayKey) ??
        {
          date: dayKey,
          ordersPlaced: 0,
          paidOrders: 0,
          placedRevenue: 0,
          paidRevenue: 0,
          refundedTotal: 0,
          estimatedCogs: 0,
          estimatedProfit: 0,
        }

      currentDay.ordersPlaced += 1
      currentDay.placedRevenue += order.placedTotal
      currentDay.refundedTotal += order.refundedTotal

      if (order.paidTotal > 0) {
        currentDay.paidOrders += 1
        currentDay.paidRevenue += order.netRevenue
        currentDay.estimatedCogs += orderCogs
        currentDay.estimatedProfit += orderProfit
      }

      dayMap.set(dayKey, currentDay)

      return {
        id: order.id,
        displayId: order.displayId,
        email: order.email,
        status: order.status,
        createdAt: order.createdAt,
        paidTotal: roundMoney(order.paidTotal),
        refundedTotal: roundMoney(order.refundedTotal),
        netRevenue: roundMoney(order.netRevenue),
        estimatedCogs: orderCogs,
        estimatedProfit: orderProfit,
        marginPct,
        missingCostUnits: roundMoney(orderMissingCostUnits),
      }
    })

    estimatedCogs = roundMoney(estimatedCogs)
    const recognizedRevenue = roundMoney(
      orders.reduce((sum, order) => sum + order.paidTotal, 0)
    )
    const refundedTotal = roundMoney(
      orders.reduce((sum, order) => sum + order.refundedTotal, 0)
    )
    const netRevenue = roundMoney(
      orders.reduce((sum, order) => sum + order.netRevenue, 0)
    )
    const estimatedProfit = roundMoney(netRevenue - estimatedCogs)
    const profitMarginPct =
      netRevenue > 0 ? roundMoney((estimatedProfit / netRevenue) * 100) : 0

    const daily = Array.from(dayMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => ({
        ...day,
        placedRevenue: roundMoney(day.placedRevenue),
        paidRevenue: roundMoney(day.paidRevenue),
        refundedTotal: roundMoney(day.refundedTotal),
        estimatedCogs: roundMoney(day.estimatedCogs),
        estimatedProfit: roundMoney(day.estimatedProfit),
      }))

    const topProducts = Array.from(productMap.values())
      .map((product) => ({
        ...product,
        revenue: roundMoney(product.revenue),
        estimatedCogs: roundMoney(product.estimatedCogs),
        estimatedProfit: roundMoney(product.estimatedProfit),
        marginPct:
          product.revenue > 0
            ? roundMoney((product.estimatedProfit / product.revenue) * 100)
            : 0,
      }))
      .sort((a, b) => b.estimatedProfit - a.estimatedProfit)
      .slice(0, 10)

    return res.status(200).json({
      viewer: {
        email: permission.actor.email,
        firstName: permission.actor.first_name,
        lastName: permission.actor.last_name,
      },
      configuration: {
        days: safeDays,
        acceptedCostKeys: COST_KEYS,
      },
      summary: {
        ordersPlaced: orders.length,
        paidOrders: orders.filter((order) => order.paidTotal > 0).length,
        unpaidOrders: orders.filter((order) => order.paidTotal <= 0).length,
        unitsSold: roundMoney(unitsSold),
        recognizedRevenue,
        refundedTotal,
        netRevenue,
        estimatedCogs,
        estimatedProfit,
        profitMarginPct,
        missingCostUnits: roundMoney(missingCostUnits),
      },
      daily,
      topProducts,
      recentOrders: recentOrders.slice(0, 12),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: "Failed to load analytics data.",
    })
  } finally {
    await client.end().catch(() => undefined)
  }
}
