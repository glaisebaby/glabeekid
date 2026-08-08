import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

type CustomerAccount = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  has_account: boolean | null
  created_at: string
  updated_at: string
}

const fetchCustomerAccounts = async (): Promise<{
  role_label: string
  customers: CustomerAccount[]
}> => {
  const response = await fetch("/admin/access-control/customers", {
    credentials: "include",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(payload?.message || "Failed to load customer accounts.")
  }

  return response.json()
}

const CustomerAccountsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["customer-accounts"],
    queryFn: fetchCustomerAccounts,
  })

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="p-6">
        <Heading level="h1">Customer Accounts</Heading>
        <Text className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">
          Separate view for storefront and admin-created customer users. These
          accounts are treated as customer records, not admin staff roles.
        </Text>
      </Container>

      {error ? (
        <Container className="p-6">
          <Heading level="h2">Access denied or unavailable</Heading>
          <Text className="mt-2 text-sm text-ui-fg-subtle">
            {error instanceof Error
              ? error.message
              : "Unable to load customer accounts."}
          </Text>
        </Container>
      ) : null}

      {isLoading ? (
        <Container className="p-6">
          <Text>Loading customer accounts...</Text>
        </Container>
      ) : null}

      {data ? (
        <Container className="p-0">
          <div className="border-b border-ui-border-base px-6 py-4">
            <Heading level="h2">{data.role_label}</Heading>
          </div>
          <div className="overflow-x-auto px-6 py-4">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ui-border-base text-ui-fg-subtle">
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Account status</th>
                  <th className="py-3 pr-4 font-medium">Created</th>
                  <th className="py-3 pr-4 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-ui-border-base last:border-b-0"
                  >
                    <td className="py-3 pr-4">{customer.email || "-"}</td>
                    <td className="py-3 pr-4">
                      {[customer.first_name, customer.last_name]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {customer.has_account ? "Has login" : "Record only"}
                    </td>
                    <td className="py-3 pr-4">
                      {new Date(customer.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 pr-4">
                      {new Date(customer.updated_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      ) : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Customer Accounts",
})

export default CustomerAccountsPage
