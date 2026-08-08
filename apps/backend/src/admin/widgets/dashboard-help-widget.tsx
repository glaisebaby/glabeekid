import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, FocusModal, Heading, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"

type HelpContent = {
  badge: string
  title: string
  summary: string
  steps: string[]
  storefrontEffects: string[]
}

type ViewerAccessResponse = {
  role: string | null
  is_master: boolean
}

const HELP_LIBRARY: Array<{
  matcher: RegExp
  content: HelpContent
}> = [
  {
    matcher: /^\/?(app\/)?products\/[^/]+\/[^/]+$/i,
    content: {
      badge: "Variant Setup",
      title: "Manage one size or color variant",
      summary:
        "Use this page for size-specific pricing, stock, media, and measurements.",
      steps: [
        "Keep SKU, inventory, and prices accurate for this exact variant.",
        "Fill the right-side measurements section with garment details like chest, length, shoulder, waist, or inseam.",
        "Use metadata here when one size needs different fit details from the others.",
      ],
      storefrontEffects: [
        "Shoppers see the matching size details after they switch size on the product page.",
        "Variant stock decides whether add-to-cart stays available for that size.",
        "Variant pricing here flows into checkout and analytics.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?products\/[^/]+$/i,
    content: {
      badge: "Product Setup",
      title: "Complete a storefront-ready product",
      summary:
        "This page controls the main product story, gallery, description, and shared metadata.",
      steps: [
        "Add clean product name, description, images, options, and categories.",
        "Use product metadata for shared details that apply to every variant.",
        "Keep variants complete so size selection, inventory, and pricing stay reliable.",
      ],
      storefrontEffects: [
        "This information powers product cards, search visibility, detail pages, and collection filters.",
        "The hero image and description shape the first impression shoppers see.",
        "Shared metadata becomes the fallback when a variant does not have its own value.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?products$/i,
    content: {
      badge: "Catalog",
      title: "Build and organize the kids fashion catalog",
      summary:
        "Use the products area to create, group, and maintain everything that appears in the storefront.",
      steps: [
        "Create products with clear titles, pricing, images, categories, and variants.",
        "Review inventory and publish only the items you want shoppers to find.",
        "Use collections and categories to support browse paths like everyday wear or occasion edits.",
      ],
      storefrontEffects: [
        "Published products become visible in storefront listings and search.",
        "Strong product structure improves filtering, quick-add cards, and collection browsing.",
        "Accurate pricing and images reduce checkout drop-off.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?price-lists(\/.*)?$/i,
    content: {
      badge: "Promotional Pricing",
      title: "Create temporary or campaign-specific prices",
      summary:
        "Price lists let you run sales, launch offers, or overrides without changing the base catalog price.",
      steps: [
        "Create a list in INR with clear dates, status, and affected variants.",
        "Use sale lists for discounts and override lists when you want a fixed replacement price.",
        "Review active dates carefully so the right promotion appears at the right time.",
      ],
      storefrontEffects: [
        "Active price lists can replace or discount the base storefront price automatically.",
        "Campaign pricing changes what shoppers see on product cards, product pages, cart, and checkout.",
        "Profit analytics still helps you compare revenue against cost after promotions are applied.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?orders(\/.*)?$/i,
    content: {
      badge: "Order Flow",
      title: "Process customer orders safely",
      summary:
        "Use this page to confirm, fulfill, track returns, and keep order status aligned with real delivery progress.",
      steps: [
        "Review payment, shipping details, and item quantities before fulfillment.",
        "Mark shipments and return outcomes only when the physical action is complete.",
        "Keep notes and status changes consistent so customer support stays clear.",
      ],
      storefrontEffects: [
        "Order status changes drive what customers understand about fulfillment and returns.",
        "Refunds and returns influence revenue and profit analytics.",
        "Correct order handling protects trust and reduces support confusion.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?inventory(\/.*)?$/i,
    content: {
      badge: "Stock Control",
      title: "Control which sizes are available to buy",
      summary:
        "Inventory decides whether each variant stays purchasable and how confidently you can fulfill orders.",
      steps: [
        "Update stock counts whenever goods arrive, are sold, returned, or moved out of saleable stock.",
        "Track damaged or not-fit-to-sale items separately from sellable inventory.",
        "Review low-stock variants often for popular sizes.",
      ],
      storefrontEffects: [
        "In-stock variants stay available for add-to-cart.",
        "Low or zero inventory can hide purchase options for specific sizes.",
        "Accurate stock avoids overselling and improves customer confidence.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?customers(\/.*)?$/i,
    content: {
      badge: "Customer Records",
      title: "Monitor registered shoppers and support follow-up",
      summary:
        "Use customer records to understand who is ordering, returning, and creating accounts in the storefront.",
      steps: [
        "Review contact details, order history, and account status.",
        "Keep admin-created customer records separate from internal staff users.",
        "Use this page for support context rather than store configuration.",
      ],
      storefrontEffects: [
        "Customer accounts support faster checkout and order lookup.",
        "Accurate customer data helps support repeat shoppers smoothly.",
        "This does not directly change product display, but it shapes post-purchase experience.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?reports$/i,
    content: {
      badge: "Business Monitoring",
      title: "Track revenue, profit, and margin trends",
      summary:
        "This page is for master-account reporting across paid orders, costs, refunds, and product profitability.",
      steps: [
        "Review net revenue, estimated profit, refunds, and margin together.",
        "Make sure cost metadata exists on products or variants so profit remains accurate.",
        "Use recent orders and top-product sections to spot strong or weak performers quickly.",
      ],
      storefrontEffects: [
        "This page does not change storefront content directly.",
        "It helps you decide pricing, promotions, and assortment changes that later affect shoppers.",
        "Missing cost data weakens profit reporting even if storefront sales continue normally.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?activity-logs$/i,
    content: {
      badge: "Audit Trail",
      title: "Review who changed what and when",
      summary:
        "This master-only page helps you track sensitive operations like pricing, products, roles, and store settings.",
      steps: [
        "Use it to trace unexpected price, product, or permission changes.",
        "Review actor, timestamp, route, and payload details before making corrective updates.",
        "Treat this as the main accountability page for admin operations.",
      ],
      storefrontEffects: [
        "The page itself does not alter storefront behavior.",
        "It helps you quickly identify the source of a storefront issue caused by a dashboard change.",
        "Faster issue tracing reduces downtime and customer confusion.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?access-control$/i,
    content: {
      badge: "Permissions",
      title: "Assign the right role to the right user",
      summary:
        "Use access control to decide who can manage operations, reports, settings, and master-level tools.",
      steps: [
        "Grant master access only to highly trusted users.",
        "Use operations admin for catalog and order work without sensitive reporting or settings access.",
        "Review assignments regularly as your team changes.",
      ],
      storefrontEffects: [
        "Roles do not change the storefront directly.",
        "They control who is allowed to make changes that affect products, prices, and store behavior.",
        "Tighter permissions reduce accidental storefront changes.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?customer-accounts$/i,
    content: {
      badge: "Account Types",
      title: "Separate shoppers from internal users",
      summary:
        "This custom page helps you review storefront customer accounts independently from admin operators.",
      steps: [
        "Use it when you want to inspect shopper accounts without mixing them with staff users.",
        "Keep admin access limited to roles assigned through access control.",
        "Support customer account issues here without exposing admin tools.",
      ],
      storefrontEffects: [
        "Cleaner customer segmentation supports better service and safer admin access.",
        "Storefront account creation flows into this customer-focused view.",
        "It helps avoid confusion between buying customers and internal operators.",
      ],
    },
  },
  {
    matcher: /^\/?(app\/)?settings(\/.*)?$/i,
    content: {
      badge: "Store Configuration",
      title: "Change core store behavior carefully",
      summary:
        "Settings define store-wide defaults and are restricted to master-account users for safety.",
      steps: [
        "Review the effect of each setting before saving, especially tax, region, branding, and operational values.",
        "Use store settings for foundational behavior, not for campaign-level changes.",
        "Keep a clear approval path for any master-level setting update.",
      ],
      storefrontEffects: [
        "Store settings can change core customer-facing behavior across checkout, pricing, and branding.",
        "Incorrect values here can affect every shopper immediately.",
        "Master-only access protects the storefront from accidental system-wide changes.",
      ],
    },
  },
]

const DEFAULT_HELP: HelpContent = {
  badge: "Dashboard Guide",
  title: "Use this page with storefront impact in mind",
  summary:
    "Each dashboard page either changes the storefront directly or helps your team manage store operations safely.",
  steps: [
    "Check whether this page controls catalog data, operational flow, or reporting.",
    "Save only the fields you understand, especially on pricing, inventory, and settings screens.",
    "Use master-only pages for oversight and sensitive permissions.",
  ],
  storefrontEffects: [
    "Catalog, pricing, and inventory pages usually affect shoppers immediately.",
    "Reports and logs help you monitor the business without changing storefront content themselves.",
    "Careful admin updates keep the storefront stable and trustworthy.",
  ],
}

const normalizePath = (pathname: string) =>
  pathname.replace(/\/+$/, "") || "/"

const getHelpContent = (pathname: string) => {
  const normalized = normalizePath(pathname)

  return (
    HELP_LIBRARY.find(({ matcher }) => matcher.test(normalized))?.content ||
    DEFAULT_HELP
  )
}

const MASTER_ONLY_LINKS = [
  '/app/reports',
  '/app/activity-logs',
  '/app/access-control',
  '/app/customer-accounts',
  '/app/settings/store',
]

const DashboardHelpWidget = () => {
  const location = useLocation()
  const [viewerRole, setViewerRole] = useState<string | null>(null)

  const content = useMemo(
    () => getHelpContent(location.pathname),
    [location.pathname]
  )

  useEffect(() => {
    let isMounted = true

    const loadViewerRole = async () => {
      try {
        const response = await fetch("/admin/access-control/me", {
          credentials: "include",
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as ViewerAccessResponse

        if (isMounted) {
          setViewerRole(payload.role)
        }
      } catch {
        // Keep the default dashboard behavior if role lookup fails.
      }
    }

    void loadViewerRole()

    return () => {
      isMounted = false
    }
  }, [])

  const shouldHideMasterOnlyNavigation = viewerRole === "operations_admin"

  return (
    <>
      {shouldHideMasterOnlyNavigation ? (
        <style>
          {MASTER_ONLY_LINKS.map(
            (href) => `
              a[href="${href}"],
              a[href="${href}"] + div,
              a[href="${href}"]::before,
              a[href="${href}"]::after {
                display: none !important;
              }
            `
          ).join("\n")}
        </style>
      ) : null}

      <FocusModal>
        <FocusModal.Trigger asChild>
          <Button variant="secondary" size="small">
            Help
          </Button>
        </FocusModal.Trigger>

        <FocusModal.Content className="max-w-3xl">
          <FocusModal.Header>
            <div className="flex flex-col gap-2">
              <Text className="text-xs font-medium uppercase tracking-[0.16em] text-ui-fg-subtle">
                {content.badge}
              </Text>
              <FocusModal.Title>{content.title}</FocusModal.Title>
              <FocusModal.Description className="max-w-2xl text-sm leading-6 text-ui-fg-subtle">
                {content.summary}
              </FocusModal.Description>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex flex-col gap-6 px-6 py-6">
            <section className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-5">
              <Heading level="h2" className="text-base">
                What to do on this page
              </Heading>
              <div className="mt-4 flex flex-col gap-3">
                {content.steps.map((step) => (
                  <div key={step} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-ui-fg-base" />
                    <Text className="text-sm leading-6 text-ui-fg-base">
                      {step}
                    </Text>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-5">
              <Heading level="h2" className="text-base">
                How this affects the storefront
              </Heading>
              <div className="mt-4 flex flex-col gap-3">
                {content.storefrontEffects.map((effect) => (
                  <div key={effect} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[#2563eb]" />
                    <Text className="text-sm leading-6 text-ui-fg-base">
                      {effect}
                    </Text>
                  </div>
                ))}
              </div>
            </section>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "topbar",
  id: "glabeekid-dashboard-help",
})

export default DashboardHelpWidget
