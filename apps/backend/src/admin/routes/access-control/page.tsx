import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

type RoleOption = {
  value: string
  label: string
  description: string
}

type AdminUserRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  created_at: string
  role: string
  assigned_by_email: string | null
  updated_at: string | null
}

type AccessControlResponse = {
  roles: RoleOption[]
  users: AdminUserRow[]
}

const fetchUsers = async (): Promise<AccessControlResponse> => {
  const response = await fetch("/admin/access-control/users", {
    credentials: "include",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(payload?.message || "Failed to load access control data.")
  }

  return response.json()
}

const AccessControlPage = () => {
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-access-control-users"],
    queryFn: fetchUsers,
  })

  const handleSave = async (userId: string) => {
    const role = selectedRoles[userId]

    if (!role) {
      return
    }

    setSavingUserId(userId)
    setStatus(null)

    try {
      const response = await fetch("/admin/access-control/users", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          role,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null

        throw new Error(payload?.message || "Failed to update role.")
      }

      setStatus("User role updated successfully.")
      await refetch()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to update role.")
    } finally {
      setSavingUserId(null)
    }
  }

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="p-6">
        <Heading level="h1">Access Control</Heading>
        <Text className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">
          Only the master account can assign admin roles. Reports and activity
          logs stay restricted to the master role.
        </Text>
      </Container>

      {error ? (
        <Container className="p-6">
          <Heading level="h2">Access denied or unavailable</Heading>
          <Text className="mt-2 text-sm text-ui-fg-subtle">
            {error instanceof Error ? error.message : "Unable to load roles."}
          </Text>
        </Container>
      ) : null}

      {isLoading ? (
        <Container className="p-6">
          <Text>Loading access control...</Text>
        </Container>
      ) : null}

      {data ? (
        <>
          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Available Roles</Heading>
            </div>
            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              {data.roles.map((role) => (
                <div
                  key={role.value}
                  className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-4"
                >
                  <Text className="text-sm font-semibold text-ui-fg-base">
                    {role.label}
                  </Text>
                  <Text className="mt-2 text-sm leading-6 text-ui-fg-subtle">
                    {role.description}
                  </Text>
                </div>
              ))}
            </div>
          </Container>

          <Container className="p-0">
            <div className="border-b border-ui-border-base px-6 py-4">
              <Heading level="h2">Admin Users</Heading>
              <Text className="mt-1 text-sm text-ui-fg-subtle">
                Assign roles to dashboard users. Unassigned users cannot access
                master-only areas.
              </Text>
            </div>

            {status ? (
              <div className="px-6 pt-4">
                <Text className="text-sm text-ui-fg-subtle">{status}</Text>
              </div>
            ) : null}

            <div className="overflow-x-auto px-6 py-4">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ui-border-base text-ui-fg-subtle">
                    <th className="py-3 pr-4 font-medium">User</th>
                    <th className="py-3 pr-4 font-medium">Role</th>
                    <th className="py-3 pr-4 font-medium">Assigned by</th>
                    <th className="py-3 pr-4 font-medium">Updated</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => {
                    const currentRole =
                      selectedRoles[user.id] ??
                      (user.role === "unassigned"
                        ? "operations_admin"
                        : user.role)

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-ui-border-base last:border-b-0"
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium">{user.email}</div>
                          <Text className="mt-1 text-xs text-ui-fg-subtle">
                            {[user.first_name, user.last_name]
                              .filter(Boolean)
                              .join(" ") || "No display name"}
                          </Text>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            value={currentRole}
                            onChange={(event) =>
                              setSelectedRoles((current) => ({
                                ...current,
                                [user.id]: event.target.value,
                              }))
                            }
                            className="h-10 min-w-[220px] rounded-xl border border-ui-border-base bg-ui-bg-base px-3"
                          >
                            {data.roles.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          {user.assigned_by_email || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {user.updated_at
                            ? new Date(user.updated_at).toLocaleString("en-IN")
                            : "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => handleSave(user.id)}
                            disabled={savingUserId === user.id}
                            className="rounded-full border border-ui-border-base px-4 py-2 font-medium transition-colors hover:border-ui-fg-base hover:text-ui-fg-base disabled:opacity-50"
                          >
                            {savingUserId === user.id ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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
  label: "Access Control",
})

export default AccessControlPage
