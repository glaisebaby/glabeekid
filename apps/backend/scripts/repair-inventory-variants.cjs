const path = require("node:path")
const xlsx = require("xlsx")
const { Client } = require("pg")
const { ulid } = require("ulid")
const dotenv = require("dotenv")

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const workbookPath =
  process.env.GLABEE_INVENTORY_XLSX ||
  "C:/Users/glais/Downloads/Glabee_Inventory_final copy.xlsx"

const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const target = args.has("--production") ? "production" : "local"
const limitArg = process.argv
  .find((arg) => arg.startsWith("--limit="))
  ?.split("=")[1]
const limit = limitArg ? Number(limitArg) : 0

const databaseUrl =
  target === "production"
    ? process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL
    : process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL

if (!databaseUrl) {
  console.error(`Missing database URL for ${target}.`)
  process.exit(1)
}

const now = () => new Date()
const id = (prefix) => `${prefix}_${ulid()}`

const normalizeItemCode = (value, sheetName) => {
  const raw = String(value ?? "").trim()

  if (sheetName === "Ladies" && raw === "1") {
    return "L1"
  }

  if (sheetName === "Ladies" && raw === "2") {
    return "L2"
  }

  return raw.replace(/\[/g, "").toUpperCase()
}

const titleCase = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const isNumberish = (value) =>
  typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value ?? "").trim())

const parseSellingPrice = (value) => {
  if (!isNumberish(value)) {
    return null
  }

  return Number(value)
}

const normalizeSize = (value) => {
  const upper = String(value ?? "").trim().toUpperCase()

  if (!upper) {
    return null
  }

  if (/^\d+\s*YEAR(S)?$/.test(upper)) {
    return upper.replace(/\s*YEAR(S)?$/, "Y")
  }

  if (/^\d+\s*Y$/.test(upper)) {
    return upper.replace(/\s+/g, "")
  }

  if (/^\d+$/.test(upper)) {
    return upper
  }

  if (["S", "M", "L", "XL"].includes(upper)) {
    return upper
  }

  if (["XXL", "2XL", "2X"].includes(upper)) {
    return "2XL"
  }

  if (["XXXL", "3XL", "3X"].includes(upper)) {
    return "3XL"
  }

  return null
}

const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]

const expandRange = (start, end) => {
  const normalizedStart = normalizeSize(start)
  const normalizedEnd = normalizeSize(end)
  const startIndex = sizeOrder.indexOf(normalizedStart)
  const endIndex = sizeOrder.indexOf(normalizedEnd)

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return []
  }

  return sizeOrder.slice(startIndex, endIndex + 1)
}

const countSizeTokens = (text) => {
  const counts = new Map()
  const add = (size, quantity = 1) => {
    const normalized = normalizeSize(size)
    if (!normalized) {
      return
    }

    counts.set(normalized, (counts.get(normalized) || 0) + quantity)
  }

  const upper = String(text ?? "").toUpperCase()
  const beforeMeasurements = upper
    .replace(
      /\b(XS|S|M|L|XL|XXL|2XL|3XL|XXXL)\s+(?=SHOULDER|CHEST|LENGTH|TOTAL LENGTH)\b/g,
      ""
    )
    .split(/\b(SHOULDER|CHEST|LENGTH|TOTAL LENGTH)\b/)[0]
    .replace(/\[[^\]]*\]/g, " ")

  const explicitCount = Number(
    beforeMeasurements.match(/\b(\d+)\s*(?:COUNT|PC)\b/)?.[1] || 0
  )

  const eachQuantity = Number(
    upper.match(/\[\s*(\d+)\s*PC\s*EACH\s*\]/i)?.[1] || 0
  )

  if (eachQuantity) {
    const eachSource = upper
      .split(/\[\s*\d+\s*PC\s*EACH\s*\]/i)[0]
      .replace(/\b\d+\s*(?:COUNT|PC)\b/g, " ")
    const tokenMatches =
      eachSource.match(/\b(?:XS|S|M|L|XL|XXL|2XL|3XL|XXXL|\d{1,2})\b/g) ||
      []
    for (const token of tokenMatches) {
      add(token, eachQuantity)
    }
  }

  for (const rangeMatch of beforeMeasurements.matchAll(/\b(XS|S|M|L|XL|XXL|2XL|3XL|XXXL)\s*(?:=\s*\d+)?\s*(?:TO|-)\s*(XS|S|M|L|XL|XXL|2XL|3XL|XXXL)\b/g)) {
    for (const size of expandRange(rangeMatch[1], rangeMatch[2])) {
      add(size)
    }
  }

  if (!counts.size) {
    for (const match of beforeMeasurements.matchAll(/\bSIZE\s*(\d{1,2})\b/g)) {
      add(match[1])
    }
  }

  if (!counts.size) {
    for (const match of beforeMeasurements.matchAll(/\b(\d{1,2})\s*YEAR(S)?\b/g)) {
      add(`${match[1]}Y`)
    }
  }

  if (!counts.size) {
    const tokens =
      beforeMeasurements.match(/\b(?:XS|S|M|L|XL|XXL|2XL|3XL|XXXL)\b/g) || []
    if (explicitCount && tokens.length === 2) {
      const range = expandRange(tokens[0], tokens[1])

      if (range.length === explicitCount) {
        for (const size of range) {
          add(size)
        }
      }
    }

    if (!counts.size) {
      for (const token of tokens) {
        add(token)
      }
    }
  }

  if (counts.size === 1 && explicitCount > 1) {
    const [size, quantity] = [...counts.entries()][0]

    if (quantity === 1) {
      counts.set(size, explicitCount)
    }
  }

  if (!counts.size && explicitCount) {
    counts.set("One Size", explicitCount)
  }

  if (!counts.size) {
    counts.set("One Size", 1)
  }

  return [...counts.entries()]
}

const getWorkbookProducts = () => {
  const workbook = xlsx.readFile(workbookPath)
  const products = new Map()

  for (const sheetName of workbook.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    })

    for (const row of rows) {
      const code = normalizeItemCode(row.item, sheetName)
      if (!code) {
        continue
      }

      const key = `${sheetName}:${code}`
      const existing = products.get(key)
      const sizeText = String(row.Size ?? "").trim()
      const sellingPrice = parseSellingPrice(row["additional amount added"])

      if (!existing) {
        products.set(key, {
          key,
          sheetName,
          code,
          sizeText,
          type: String(row.Type ?? "").trim(),
          fabric: String(row.fabric ?? "").trim(),
          gender: String(row["Gender "] ?? "").trim(),
          purchasePrice: row.price,
          sellingPrice,
          quantityRows: 1,
        })
      } else {
        existing.quantityRows += 1
        if (sellingPrice !== null && existing.sellingPrice === null) {
          existing.sellingPrice = sellingPrice
        }
      }
    }
  }

  return [...products.values()].map((product) => ({
    ...product,
    variants: countSizeTokens(product.sizeText).map(([size, quantity]) => ({
      size,
      quantity:
        product.quantityRows > 1 && countSizeTokens(product.sizeText).length === 1
          ? product.quantityRows
          : quantity,
    })),
  }))
}

const queryOne = async (client, text, params = []) =>
  (await client.query(text, params)).rows[0]

const run = async () => {
  const workbookProducts = getWorkbookProducts()
  const client = new Client({
    connectionString: databaseUrl,
    query_timeout: 30000,
    ssl: databaseUrl.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  })

  client.on("error", (error) => {
    console.error(`Database connection error: ${error.message}`)
  })

  await client.connect()

  const dbProducts = await client.query(`
    select id, title, handle, metadata
    from product
    where deleted_at is null
      and metadata->>'glabee_inventory_import' = 'true'
    order by title
  `)

  const dbByKey = new Map(
    dbProducts.rows.map((product) => [
      product.metadata?.glabee_inventory_key,
      product,
    ])
  )

  const plan = workbookProducts
    .map((source) => ({
      source,
      product: dbByKey.get(source.key),
    }))
    .filter(
      (item) => item.product && item.product.metadata?.repaired_size_variants !== true
    )

  const limitedPlan = limit > 0 ? plan.slice(0, limit) : plan

  console.log(
    `${dryRun ? "Dry run" : "Applying"} ${limitedPlan.length} of ${
      plan.length
    } unrepaired imported products on ${target}.`
  )
  for (const item of limitedPlan) {
    console.log(
      `${item.source.key}: ${item.source.variants
        .map((variant) => `${variant.size} x${variant.quantity}`)
        .join(", ")} | price ${
        item.source.sellingPrice === null ? "missing" : item.source.sellingPrice
      }`
    )
  }

  if (dryRun) {
    await client.end()
    return
  }

  const location = await queryOne(
    client,
    "select id from stock_location where deleted_at is null order by created_at limit 1"
  )

  if (!location?.id) {
    throw new Error("No stock location found.")
  }

  let updatedCount = 0

  for (const [index, { source, product }] of limitedPlan.entries()) {
    console.log(`[${index + 1}/${limitedPlan.length}] Updating ${source.key}`)
    await client.query("begin")

    try {
      const productOptionLink = await queryOne(
        client,
        `
          select ppo.id, po.id as option_id
          from product_product_option ppo
          join product_option po on po.id = ppo.product_option_id
          where ppo.product_id = $1
            and ppo.deleted_at is null
            and po.deleted_at is null
            and lower(po.title) = 'size'
          limit 1
        `,
        [product.id]
      )

      if (!productOptionLink?.id) {
        throw new Error(`Missing Size option for ${source.key}`)
      }

      const existingVariants = await client.query(
        `
          select id
          from product_variant
          where product_id = $1 and deleted_at is null
        `,
        [product.id]
      )

      if (existingVariants.rows.length) {
        await client.query(
          `
            update product_variant
            set deleted_at = now(), updated_at = now()
            where product_id = $1 and deleted_at is null
          `,
          [product.id]
        )
      }

      const existingOptionValues = await client.query(
        `
          select pov.id, pov.value
          from product_product_option_value ppov
          join product_option_value pov on pov.id = ppov.product_option_value_id
          where ppov.product_product_option_id = $1
            and ppov.deleted_at is null
            and pov.deleted_at is null
        `,
        [productOptionLink.id]
      )

      const optionValueBySize = new Map(
        existingOptionValues.rows.map((row) => [row.value, row.id])
      )

      for (const [rank, variantPlan] of source.variants.entries()) {
        let optionValueId = optionValueBySize.get(variantPlan.size)

        if (!optionValueId) {
          optionValueId = id("optval")
          await client.query(
            `
              insert into product_option_value
                (id, value, option_id, metadata, created_at, updated_at, rank)
              values ($1, $2, $3, '{}'::jsonb, $4, $4, $5)
            `,
            [
              optionValueId,
              variantPlan.size,
              productOptionLink.option_id,
              now(),
              rank,
            ]
          )
          await client.query(
            `
              insert into product_product_option_value
                (id, product_product_option_id, product_option_value_id, created_at, updated_at)
              values ($1, $2, $3, $4, $4)
            `,
            [id("prodoptval"), productOptionLink.id, optionValueId, now()]
          )
        }

        const variantId = id("variant")
        const sku = `GLABEE-${source.sheetName}-${source.code}-${variantPlan.size}`
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
        const metadata = {
          ...(product.metadata || {}),
          repaired_size_variants: true,
          size_parse_source: source.sizeText,
          variant_inventory_quantity: variantPlan.quantity,
        }

        await client.query(
          `
            insert into product_variant
              (id, title, sku, allow_backorder, manage_inventory, metadata, variant_rank, product_id, created_at, updated_at)
            values ($1, $2, $3, false, true, $4::jsonb, $5, $6, $7, $7)
          `,
          [
            variantId,
            variantPlan.size,
            sku,
            JSON.stringify(metadata),
            rank,
            product.id,
            now(),
          ]
        )

        await client.query(
          `
            insert into product_variant_option (variant_id, option_value_id)
            values ($1, $2)
          `,
          [variantId, optionValueId]
        )

        const priceSetId = id("pset")
        await client.query(
          "insert into price_set (id, created_at, updated_at) values ($1, $2, $2)",
          [priceSetId, now()]
        )
        await client.query(
          `
            insert into product_variant_price_set
              (id, variant_id, price_set_id, created_at, updated_at)
            values ($1, $2, $3, $4, $4)
          `,
          [id("pvps"), variantId, priceSetId, now()]
        )

        if (source.sellingPrice !== null) {
          await client.query(
            `
              insert into price
                (id, title, price_set_id, currency_code, raw_amount, rules_count, created_at, updated_at, amount)
              values ($1, $2, $3, 'inr', $4::jsonb, 0, $5, $5, $6)
            `,
            [
              id("price"),
              `${source.code} ${variantPlan.size}`,
              priceSetId,
              JSON.stringify({ value: String(source.sellingPrice), precision: 20 }),
              now(),
              source.sellingPrice,
            ]
          )
        }

        const inventoryItemId = id("iitem")
        await client.query(
          `
            insert into inventory_item
              (id, created_at, updated_at, sku, requires_shipping, title, description, metadata)
            values ($1, $2, $2, $3, true, $4, $5, $6::jsonb)
          `,
          [
            inventoryItemId,
            now(),
            sku,
            `${source.code} ${variantPlan.size}`,
            titleCase(source.type || source.code),
            JSON.stringify(metadata),
          ]
        )
        await client.query(
          `
            insert into product_variant_inventory_item
              (id, variant_id, inventory_item_id, required_quantity, created_at, updated_at)
            values ($1, $2, $3, 1, $4, $4)
          `,
          [id("pvitem"), variantId, inventoryItemId, now()]
        )
        await client.query(
          `
            insert into inventory_level
              (id, created_at, updated_at, inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity, raw_stocked_quantity, raw_reserved_quantity, raw_incoming_quantity)
            values ($1, $2, $2, $3, $4, $5, 0, 0, $6::jsonb, $7::jsonb, $7::jsonb)
          `,
          [
            id("ilev"),
            now(),
            inventoryItemId,
            location.id,
            variantPlan.quantity,
            JSON.stringify({ value: String(variantPlan.quantity), precision: 20 }),
            JSON.stringify({ value: "0", precision: 20 }),
          ]
        )
      }

      await client.query(
        `
          update product
          set metadata = metadata || $2::jsonb,
              updated_at = now()
          where id = $1
        `,
        [
          product.id,
          JSON.stringify({
            repaired_size_variants: true,
            repaired_size_variants_at: new Date().toISOString(),
          }),
        ]
      )

      await client.query("commit")
      updatedCount += 1
    } catch (error) {
      await client.query("rollback")
      throw error
    }
  }

  await client.end()
  console.log(`Updated ${updatedCount} imported products on ${target}.`)
}

run().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
