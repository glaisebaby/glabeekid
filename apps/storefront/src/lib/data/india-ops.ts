"use server"

import "server-only"

import { revalidatePath } from "next/cache"
import { pgPool } from "@lib/db"

export type ReturnCase = {
  id: string
  orderId: string
  orderDisplayId: number
  orderItemId: string
  orderLineItemId: string
  productId: string | null
  productHandle: string | null
  variantId: string | null
  productTitle: string
  variantTitle: string | null
  thumbnail: string | null
  sku: string | null
  quantity: number
  requestedReason: string | null
  inspectionStatus: string
  refundStatus: string
  stockStatus: string
  inspectionNotes: string | null
  requestedAt: string
  receivedAt: string | null
  inspectedAt: string | null
  refundedAt: string | null
  restockedAt: string | null
}

export type SoldItem = {
  orderId: string
  orderDisplayId: number
  orderItemId: string
  orderLineItemId: string
  productId: string | null
  productHandle: string | null
  variantId: string | null
  productTitle: string
  variantTitle: string | null
  thumbnail: string | null
  sku: string | null
  quantity: number
  currencyCode: string
  unitPrice: number
  createdAt: string
  hasReturnCase: boolean
}

const OPERATION_PATHS = ["/in/ops/returns", "/in/ops/not-fit-to-sale"]

const revalidateOpsPages = () => {
  for (const path of OPERATION_PATHS) {
    revalidatePath(path)
  }
}

export async function listReturnCases(): Promise<ReturnCase[]> {
  const { rows } = await pgPool.query<ReturnCase>(
    `
      select
        id,
        order_id as "orderId",
        order_display_id as "orderDisplayId",
        order_item_id as "orderItemId",
        order_line_item_id as "orderLineItemId",
        product_id as "productId",
        product_handle as "productHandle",
        variant_id as "variantId",
        product_title as "productTitle",
        variant_title as "variantTitle",
        thumbnail,
        sku,
        quantity::float8 as quantity,
        requested_reason as "requestedReason",
        inspection_status as "inspectionStatus",
        refund_status as "refundStatus",
        stock_status as "stockStatus",
        inspection_notes as "inspectionNotes",
        requested_at::text as "requestedAt",
        received_at::text as "receivedAt",
        inspected_at::text as "inspectedAt",
        refunded_at::text as "refundedAt",
        restocked_at::text as "restockedAt"
      from ops_return_case
      order by requested_at desc
    `
  )

  return rows
}

export async function listNotFitToSaleItems(): Promise<ReturnCase[]> {
  const { rows } = await pgPool.query<ReturnCase>(
    `
      select
        id,
        order_id as "orderId",
        order_display_id as "orderDisplayId",
        order_item_id as "orderItemId",
        order_line_item_id as "orderLineItemId",
        product_id as "productId",
        product_handle as "productHandle",
        variant_id as "variantId",
        product_title as "productTitle",
        variant_title as "variantTitle",
        thumbnail,
        sku,
        quantity::float8 as quantity,
        requested_reason as "requestedReason",
        inspection_status as "inspectionStatus",
        refund_status as "refundStatus",
        stock_status as "stockStatus",
        inspection_notes as "inspectionNotes",
        requested_at::text as "requestedAt",
        received_at::text as "receivedAt",
        inspected_at::text as "inspectedAt",
        refunded_at::text as "refundedAt",
        restocked_at::text as "restockedAt"
      from ops_return_case
      where stock_status = 'not_fit_to_sale'
      order by inspected_at desc nulls last, requested_at desc
    `
  )

  return rows
}

export async function listRecentSoldItems(): Promise<SoldItem[]> {
  const { rows } = await pgPool.query<SoldItem>(
    `
      select
        o.id as "orderId",
        o.display_id as "orderDisplayId",
        oi.id as "orderItemId",
        oli.id as "orderLineItemId",
        oli.product_id as "productId",
        oli.product_handle as "productHandle",
        oli.variant_id as "variantId",
        oli.product_title as "productTitle",
        oli.variant_title as "variantTitle",
        oli.thumbnail,
        oli.variant_sku as sku,
        oi.quantity::float8 as quantity,
        o.currency_code as "currencyCode",
        coalesce(oi.unit_price, oli.unit_price)::float8 as "unitPrice",
        o.created_at::text as "createdAt",
        exists(
          select 1
          from ops_return_case orc
          where orc.order_item_id = oi.id
        ) as "hasReturnCase"
      from "order" o
      join order_item oi on oi.order_id = o.id and oi.deleted_at is null
      join order_line_item oli on oli.id = oi.item_id and oli.deleted_at is null
      where o.deleted_at is null
      order by o.created_at desc
      limit 24
    `
  )

  return rows
}

export async function createReturnCase(formData: FormData) {
  const orderItemId = String(formData.get("order_item_id") || "")

  if (!orderItemId) {
    throw new Error("Missing order item")
  }

  await pgPool.query(
    `
      insert into ops_return_case (
        id,
        order_id,
        order_display_id,
        order_item_id,
        order_line_item_id,
        product_id,
        product_handle,
        variant_id,
        product_title,
        variant_title,
        thumbnail,
        sku,
        quantity,
        requested_reason,
        inspection_status,
        refund_status,
        stock_status,
        requested_at,
        updated_at
      )
      select
        concat('orc_', md5(random()::text || clock_timestamp()::text || oi.id)),
        o.id,
        o.display_id,
        oi.id,
        oli.id,
        oli.product_id,
        oli.product_handle,
        oli.variant_id,
        coalesce(oli.product_title, oli.title),
        oli.variant_title,
        oli.thumbnail,
        oli.variant_sku,
        oi.quantity,
        'Customer return requested',
        'requested',
        'pending',
        'pending',
        now(),
        now()
      from "order" o
      join order_item oi on oi.order_id = o.id and oi.deleted_at is null
      join order_line_item oli on oli.id = oi.item_id and oli.deleted_at is null
      where oi.id = $1
      on conflict (order_item_id) do nothing
    `,
    [orderItemId]
  )

  revalidateOpsPages()
}

export async function markReturnReceived(formData: FormData) {
  const id = String(formData.get("id") || "")

  await pgPool.query(
    `
      update ops_return_case
      set
        inspection_status = 'received',
        received_at = coalesce(received_at, now()),
        updated_at = now()
      where id = $1
    `,
    [id]
  )

  revalidateOpsPages()
}

export async function markRefunded(formData: FormData) {
  const id = String(formData.get("id") || "")

  await pgPool.query(
    `
      update ops_return_case
      set
        refund_status = 'refunded',
        refunded_at = coalesce(refunded_at, now()),
        updated_at = now()
      where id = $1
    `,
    [id]
  )

  revalidateOpsPages()
}

export async function restockReturnedItem(formData: FormData) {
  const id = String(formData.get("id") || "")

  const client = await pgPool.connect()

  try {
    await client.query("begin")

    const { rows } = await client.query<{
      id: string
      variant_id: string | null
      quantity: number
    }>(
      `
        select id, variant_id, quantity::float8 as quantity
        from ops_return_case
        where id = $1
        for update
      `,
      [id]
    )

    const currentCase = rows[0]

    if (!currentCase?.variant_id) {
      throw new Error("Missing variant for restock")
    }

    const inventoryItems = await client.query<{
      inventory_item_id: string
      required_quantity: number
    }>(
      `
        select inventory_item_id, required_quantity
        from product_variant_inventory_item
        where variant_id = $1 and deleted_at is null
      `,
      [currentCase.variant_id]
    )

    for (const item of inventoryItems.rows) {
      await client.query(
        `
          update inventory_level
          set
            stocked_quantity = stocked_quantity + ($1 * $2),
            updated_at = now()
          where inventory_item_id = $3 and deleted_at is null
        `,
        [currentCase.quantity, item.required_quantity, item.inventory_item_id]
      )
    }

    await client.query(
      `
        update ops_return_case
        set
          inspection_status = 'inspected',
          stock_status = 'restocked',
          restocked_at = coalesce(restocked_at, now()),
          inspected_at = coalesce(inspected_at, now()),
          updated_at = now()
        where id = $1
      `,
      [id]
    )

    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }

  revalidateOpsPages()
}

export async function moveToNotFitToSale(formData: FormData) {
  const id = String(formData.get("id") || "")

  await pgPool.query(
    `
      update ops_return_case
      set
        inspection_status = 'inspected',
        stock_status = 'not_fit_to_sale',
        inspected_at = coalesce(inspected_at, now()),
        updated_at = now()
      where id = $1
    `,
    [id]
  )

  revalidateOpsPages()
}
