"use client"

import Link from "next/link"
import { useMockStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Plus, Eye, RefreshCw } from "lucide-react"

export function PayrollsList() {
  const { payrollRuns } = useMockStore()

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payroll Runs</h1>
          <p className="text-muted-foreground">View and manage all payroll runs</p>
        </div>
        <Link href="/employer/payrolls/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Payroll Run
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Run ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  # Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payrollRuns.map((run) => (
                <tr key={run.runId} className="hover:bg-muted/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <code className="text-sm font-medium text-foreground">{run.runId}</code>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{run.employeeCount}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">*** {run.currency}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" title="Re-run simulation">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Link href={`/employer/payrolls/${run.runId}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
