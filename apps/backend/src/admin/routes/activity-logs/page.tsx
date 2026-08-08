import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

type ActivityLog = {
  id: number
  action: string
  entity_type: string
  entity_id: string | null
  target_label: string | null
  route: string
  method: string
  status_code: number
  actor_user_id: string | null
  actor_email: string | null
  details: Record<string, unknown>
  created_at: string
}

const fetchLogs = async (): Promise<{ logs: ActivityLog[] }> => {
  const response = await fetch("/admin/access-control/logs?limit=200", {
    credentials: "include",
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null

    throw new Error(payload?.message || "Failed to load activity logs.")
  }

  return response.json()
}

const ActivityLogsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: fetchLogs,
  })

  return (
    <div className="flex flex-col gap-y-6">
      <Container className="p-6">
        <Heading level="h1">Activity Logs</Heading>
        <Text className="mt-2 max-w-3xl text-sm leading-6 text-ui-fg-subtle">
          Master-account audit trail for catalog, pricing, and role-management
          changes across the dashboard.
        </Text>
      </Container>

      {error ? (
        <Container className="p-6">
          <Heading level="h2">Access denied or unavailable</Heading>
          <Text className="mt-2 text-sm text-ui-fg-subtle">
            {error instanceof Error ? error.message : "Unable to load logs."}
          </Text>
        </Container>
      ) : null}

      {isLoading ? (
        <Container className="p-6">
          <Text>Loading activity logs...</Text>
        </Container>
      ) : null}

      {data ? (
        <Container className="p-0">
          <div className="border-b border-ui-border-base px-6 py-4">
            <Heading level="h2">Recent Operations</Heading>
          </div>
          <div className="overflow-x-auto px-6 py-4">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ui-border-base text-ui-fg-subtle">
                  <th className="py-3 pr-4 font-medium">When</th>
                  <th className="py-3 pr-4 font-medium">Actor</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                  <th className="py-3 pr-4 font-medium">Target</th>
                  <th className="py-3 pr-4 font-medium">Route</th>
                  <th className="py-3 pr-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-ui-border-base align-top last:border-b-0"
                  >
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 pr-4">
                      {log.actor_email || "Unknown user"}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{log.action}</div>
                      <Text className="mt-1 text-xs text-ui-fg-subtle">
                        {log.entity_type}
                      </Text>
                    </td>
                    <td className="py-3 pr-4">
                      <div>{log.target_label || "-"}</div>
                      <Text className="mt-1 text-xs text-ui-fg-subtle">
                        {log.entity_id || "-"}
                      </Text>
                    </td>
                    <td className="py-3 pr-4">
                      <div>{log.method}</div>
                      <Text className="mt-1 text-xs text-ui-fg-subtle">
                        {log.route}
                      </Text>
                    </td>
                    <td className="py-3 pr-4">
                      <pre className="max-w-[420px] overflow-x-auto whitespace-pre-wrap rounded-xl bg-ui-bg-subtle p-3 text-xs leading-5 text-ui-fg-subtle">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
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
  label: "Activity Logs",
})

export default ActivityLogsPage
