import { MedusaError } from "@medusajs/framework/utils"
import { Client } from "pg"
import { getMasterSettings } from "./master-settings"

type DelhiveryRequestInit = {
  method?: "GET" | "POST"
  path: string
  query?: Record<string, string | number | boolean | undefined>
  body?: string | URLSearchParams
  contentType?: string
}

export type DelhiveryShipmentRequest = {
  name: string
  phone: string
  add: string
  pin: string
  city: string
  state: string
  country?: string
  order: string
  payment_mode: "COD" | "Prepaid" | "Pickup" | "REPL"
  total_amount?: string
  cod_amount?: string
  products_desc?: string
  quantity?: string
  waybill?: string
  weight?: string
  shipment_width?: string
  shipment_height?: string
  shipment_length?: string
  shipping_mode?: string
  address_type?: string
  seller_name?: string
  seller_add?: string
  seller_inv?: string
  return_name?: string
  return_address?: string
  return_city?: string
  return_state?: string
  return_country?: string
  return_phone?: string
  return_pin?: string
}

export const getDelhiveryConfiguration = async (client: Client) => {
  const settings = await getMasterSettings(client)

  return {
    enabled: Boolean(settings.delhivery_enabled),
    environment: String(settings.delhivery_environment || "staging"),
    baseUrl: String(settings.delhivery_api_base_url || "").replace(/\/+$/, ""),
    apiToken: String(settings.delhivery_api_token || ""),
    pickupLocationName: String(settings.delhivery_pickup_location_name || ""),
    defaultShippingMode: String(
      settings.delhivery_default_shipping_mode || "Surface"
    ),
    sellerName: String(settings.delhivery_seller_name || ""),
    sellerAddress: String(settings.delhivery_seller_address || ""),
    sellerInvoicePrefix: String(settings.delhivery_seller_invoice_prefix || ""),
    returnName: String(settings.delhivery_return_name || ""),
    returnAddress: String(settings.delhivery_return_address || ""),
    returnCity: String(settings.delhivery_return_city || ""),
    returnState: String(settings.delhivery_return_state || ""),
    returnCountry: String(settings.delhivery_return_country || "India"),
    returnPhone: String(settings.delhivery_return_phone || ""),
    returnPincode: String(settings.delhivery_return_pincode || ""),
  }
}

const assertDelhiveryReady = async (client: Client) => {
  const config = await getDelhiveryConfiguration(client)

  if (!config.enabled) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Delhivery integration is disabled in master settings."
    )
  }

  if (!config.baseUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Configure the Delhivery API base URL in master settings."
    )
  }

  if (!config.apiToken) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Configure the Delhivery API token in master settings."
    )
  }

  return config
}

const buildUrl = (
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined>
) => {
  const url = new URL(path.replace(/^\/+/, ""), `${baseUrl}/`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") {
      continue
    }

    url.searchParams.set(key, String(value))
  }

  return url
}

const delhiveryRequest = async (
  client: Client,
  init: DelhiveryRequestInit
) => {
  const config = await assertDelhiveryReady(client)
  const url = buildUrl(config.baseUrl, init.path, init.query)

  const response = await fetch(url, {
    method: init.method || "GET",
    headers: {
      Authorization: `Token ${config.apiToken}`,
      Accept: "application/json",
      ...(init.contentType ? { "Content-Type": init.contentType } : {}),
    },
    body: init.body,
  })

  const text = await response.text()

  let payload: unknown = text

  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = text
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload && "message" in payload
        ? String(
            (payload as { message?: unknown }).message ||
              "Delhivery request failed."
          )
        : typeof payload === "string" && payload.trim().length > 0
        ? payload.trim()
        : `Delhivery request failed with status ${response.status}.`

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `${errorMessage} (status ${response.status})`
    )
  }

  return payload
}

export const checkDelhiveryPincodeServiceability = async (
  client: Client,
  pincode: string
) =>
  delhiveryRequest(client, {
    path: "c/api/pin-codes/json/",
    query: {
      filter_codes: pincode,
    },
  })

export const fetchDelhiveryWaybills = async (
  client: Client,
  count: number
) =>
  delhiveryRequest(client, {
    path: "waybill/api/bulk/json/",
    query: {
      count,
      token: (await assertDelhiveryReady(client)).apiToken,
    },
  })

export const fetchSingleDelhiveryWaybill = async (client: Client) =>
  delhiveryRequest(client, {
    path: "waybill/api/fetch/json/",
    query: {
      token: (await assertDelhiveryReady(client)).apiToken,
    },
  })

export const createDelhiveryShipment = async (
  client: Client,
  shipment: DelhiveryShipmentRequest
) => {
  const config = await assertDelhiveryReady(client)

  if (!config.pickupLocationName) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Configure the Delhivery pickup location name in master settings."
    )
  }

  const payload = {
    format: "json",
    data: JSON.stringify({
      pickup_location: {
        name: config.pickupLocationName,
      },
      shipments: [
        {
          shipping_mode: config.defaultShippingMode,
          seller_name: config.sellerName || shipment.seller_name || "",
          seller_add: config.sellerAddress || shipment.seller_add || "",
          seller_inv:
            shipment.seller_inv ||
            (config.sellerInvoicePrefix
              ? `${config.sellerInvoicePrefix}-${shipment.order}`
              : ""),
          return_name: config.returnName || shipment.return_name || "",
          return_address: config.returnAddress || shipment.return_address || "",
          return_city: config.returnCity || shipment.return_city || "",
          return_state: config.returnState || shipment.return_state || "",
          return_country: config.returnCountry || shipment.return_country || "",
          return_phone: config.returnPhone || shipment.return_phone || "",
          return_pin: config.returnPincode || shipment.return_pin || "",
          country: "India",
          ...shipment,
        },
      ],
    }),
  }

  return delhiveryRequest(client, {
    method: "POST",
    path: "api/cmu/create.json",
    body: new URLSearchParams(payload),
    contentType: "application/x-www-form-urlencoded",
  })
}

export const trackDelhiveryShipment = async ({
  client,
  waybill,
  orderId,
}: {
  client: Client
  waybill?: string
  orderId?: string
}) => {
  if (!waybill && !orderId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Provide a waybill or order ID to track a shipment."
    )
  }

  return delhiveryRequest(client, {
    path: "api/v1/packages/json/",
    query: {
      waybill,
      ref_ids: orderId,
    },
  })
}

export const createDelhiveryPickupRequest = async ({
  client,
  pickupDate,
  pickupTime,
  expectedPackageCount,
  pickupLocation,
}: {
  client: Client
  pickupDate: string
  pickupTime: string
  expectedPackageCount: number
  pickupLocation?: string
}) => {
  const config = await assertDelhiveryReady(client)

  const body = {
    pickup_time: pickupTime,
    pickup_date: pickupDate,
    pickup_location: pickupLocation || config.pickupLocationName,
    expected_package_count: expectedPackageCount,
  }

  return delhiveryRequest(client, {
    method: "POST",
    path: "fm/request/new/",
    body: JSON.stringify(body),
    contentType: "application/json",
  })
}

export const generateDelhiveryShippingLabel = async ({
  client,
  waybill,
  pdf = true,
  pdfSize = "4R",
}: {
  client: Client
  waybill: string
  pdf?: boolean
  pdfSize?: "A4" | "4R"
}) =>
  delhiveryRequest(client, {
    path: "api/p/packing_slip",
    query: {
      wbns: waybill,
      pdf,
      pdf_size: pdfSize,
    },
  })
