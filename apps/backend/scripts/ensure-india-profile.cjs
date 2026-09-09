const { Client } = require("pg")

const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_PRODUCTION ||
  process.env.DATABASE_URL_LOCAL

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required to normalize the India store profile.")
  process.exit(1)
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    await client.query("begin")

    const regionResult = await client.query(
      `select id from region where deleted_at is null order by created_at asc limit 1`
    )

    const storeResult = await client.query(
      `select id from store where deleted_at is null order by created_at asc limit 1`
    )

    const locationResult = await client.query(
      `select id, address_id from stock_location where deleted_at is null order by created_at asc limit 1`
    )

    const fulfillmentSetResult = await client.query(
      `select id from fulfillment_set where deleted_at is null order by created_at asc limit 1`
    )

    const serviceZoneResult = await client.query(
      `select id from service_zone where deleted_at is null order by created_at asc limit 1`
    )

    if (!regionResult.rowCount || !storeResult.rowCount || !locationResult.rowCount) {
      throw new Error("Core seed records are missing, so India normalization cannot continue.")
    }

    const regionId = regionResult.rows[0].id
    const storeId = storeResult.rows[0].id
    const locationId = locationResult.rows[0].id
    const addressId = locationResult.rows[0].address_id
    const fulfillmentSetId = fulfillmentSetResult.rows[0]?.id
    const serviceZoneId = serviceZoneResult.rows[0]?.id

    await client.query(
      `update region
       set name = 'India',
           currency_code = 'inr',
           automatic_taxes = true,
           updated_at = now()
       where id = $1`,
      [regionId]
    )

    await client.query(
      `update region_country
       set region_id = case when iso_2 = 'in' then $1 else null end,
           updated_at = now()
       where deleted_at is null`,
      [regionId]
    )

    await client.query(
      `update store
       set name = 'Glabee Store',
           default_region_id = $1,
           default_location_id = $2,
           updated_at = now()
       where id = $3`,
      [regionId, locationId, storeId]
    )

    await client.query(
      `with ranked as (
         select id,
                row_number() over (partition by store_id order by is_default desc, created_at asc) as rn
         from store_currency
         where store_id = $1 and deleted_at is null
       )
       update store_currency sc
       set currency_code = case when ranked.rn = 1 then 'inr' else sc.currency_code end,
           is_default = ranked.rn = 1,
           deleted_at = case when ranked.rn = 1 then null else now() end,
           updated_at = now()
       from ranked
       where sc.id = ranked.id`,
      [storeId]
    )

    await client.query(
      `update stock_location
       set name = 'India Warehouse',
           updated_at = now()
       where id = $1`,
      [locationId]
    )

    await client.query(
      `update stock_location_address
       set city = 'Bengaluru',
           country_code = 'IN',
           address_1 = 'Glabee Fulfillment Hub',
           updated_at = now()
       where id = $1`,
      [addressId]
    )

    if (fulfillmentSetId) {
      await client.query(
        `update fulfillment_set
         set name = 'India delivery network',
             updated_at = now()
         where id = $1`,
        [fulfillmentSetId]
      )
    }

    if (serviceZoneId) {
      await client.query(
        `update service_zone
         set name = 'India',
             updated_at = now()
         where id = $1`,
        [serviceZoneId]
      )

      await client.query(
        `with ranked as (
           select id,
                  row_number() over (partition by service_zone_id order by created_at asc) as rn
           from geo_zone
           where service_zone_id = $1 and deleted_at is null
         )
         update geo_zone gz
         set country_code = case when ranked.rn = 1 then 'in' else gz.country_code end,
             type = case when ranked.rn = 1 then 'country' else gz.type end,
             deleted_at = case when ranked.rn = 1 then null else now() end,
             updated_at = now()
         from ranked
         where gz.id = ranked.id`,
        [serviceZoneId]
      )
    }

    await client.query(
      `with ranked as (
         select id,
                row_number() over (order by created_at asc) as rn
         from tax_region
         where deleted_at is null
       )
       update tax_region tr
       set country_code = case when ranked.rn = 1 then 'in' else tr.country_code end,
           province_code = case when ranked.rn = 1 then null else tr.province_code end,
           parent_id = case when ranked.rn = 1 then null else tr.parent_id end,
           deleted_at = case when ranked.rn = 1 then null else now() end,
           updated_at = now()
       from ranked
       where tr.id = ranked.id`
    )

    await client.query(
      `with ranked as (
         select id,
                row_number() over (order by created_at asc) as rn
         from shipping_option_type
         where deleted_at is null
       )
       update shipping_option_type sot
       set label = case ranked.rn
             when 1 then 'Normal Delivery'
             when 2 then 'Fast Delivery'
             else sot.label
           end,
           description = case ranked.rn
             when 1 then 'Delivery across India in 4-7 business days.'
             when 2 then 'Priority dispatch for quicker India delivery.'
             else sot.description
           end,
           code = case ranked.rn
             when 1 then 'standard'
             when 2 then 'express'
             else sot.code
           end,
           updated_at = now()
       from ranked
       where sot.id = ranked.id`
    )

    await client.query(
      `with ranked as (
         select id,
                row_number() over (order by created_at asc) as rn
         from shipping_option
         where deleted_at is null
       )
       update shipping_option so
       set name = case ranked.rn
             when 1 then 'Normal Delivery'
             when 2 then 'Fast Delivery'
             else so.name
           end,
           updated_at = now()
       from ranked
       where so.id = ranked.id`
    )

    await client.query(
      `with default_prices as (
         select p.id,
                row_number() over (
                  partition by p.price_set_id
                  order by
                    case
                      when p.currency_code = 'inr' then 0
                      when p.currency_code = 'eur' then 1
                      when p.currency_code = 'usd' then 2
                      else 3
                    end,
                    p.created_at asc
                ) as rn
         from price p
         left join price_rule pr
           on pr.price_id = p.id
          and pr.deleted_at is null
          and pr.attribute = 'region_id'
         where p.deleted_at is null
           and pr.id is null
       )
       update price p
       set deleted_at = now(),
           updated_at = now()
       from default_prices dp
       where p.id = dp.id
         and dp.rn > 1`
    )

    await client.query(
      `update price
       set currency_code = 'inr',
           updated_at = now()
       where deleted_at is null`
    )

    await client.query("commit")
    console.log("India store profile is now active.")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
