"use client"

import { useState } from "react"
import Link from "next/link"
import { useMockStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/ui/kpi-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Wallet, Users, ClipboardCheck, TrendingUp, Plus, UserPlus, Eye, Calendar, ArrowRight } from "lucide-react"

const TABS = ["Overview", "Payrolls", "Employees", "Auditors", "Reports", "Activity"]

export function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState("Overview")
  const { employees, payrollRuns, auditors } = useMockStore()

  const activeEmployees = employees.filter((e) => e.status === "active")
  const totalPayrollSpent = payrollRuns.reduce((sum, run) => sum + Number.parseFloat(run.declaredTotal), 0)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your organization's payroll</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employer/payrolls/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Run Payroll
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Payrolls This Year"
              value={payrollRuns.length}
              icon={Wallet}
              trend={{ value: "2 this month", positive: true }}
            />
            <KPICard
              title="Total Spent"
              value={`${totalPayrollSpent.toLocaleString()} ZEC`}
              icon={TrendingUp}
              subtitle="All time"
            />
            <KPICard
              title="Active Employees"
              value={activeEmployees.length}
              icon={Users}
              trend={{ value: "All active", positive: true }}
            />
            <KPICard
              title="Registered Auditors"
              value={auditors.length}
              icon={ClipboardCheck}
              subtitle="Can verify runs"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/employer/payrolls/create"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Run Payroll</h3>
              <p className="text-sm text-muted-foreground">Start a new private payroll run</p>
            </Link>
            <Link
              href="/employer/employees"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                <UserPlus className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Add Employee</h3>
              <p className="text-sm text-muted-foreground">Register a new team member</p>
            </Link>
            <Link
              href="/employer/auditors"
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <ClipboardCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Invite Auditor</h3>
              <p className="text-sm text-muted-foreground">Grant verification access</p>
            </Link>
          </div>

          {/* Recent Payroll Runs */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">Recent Payroll Runs</h2>
              <Link href="/employer/payrolls">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {payrollRuns.slice(0, 3).map((run) => (
                <Link
                  key={run.runId}
                  href={`/employer/payrolls/${run.runId}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{run.runId}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(run.createdAt).toLocaleDateString()} • {run.employeeCount} employees
                    </p>
                  </div>
                  <StatusBadge status={run.status} />
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Payrolls" && (
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
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payrollRuns.map((run) => (
                  <tr key={run.runId} className="hover:bg-muted/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{run.runId}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {new Date(run.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{run.employeeCount}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">*** {run.currency}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link href={`/employer/payrolls/${run.runId}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Employees" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">All Employees</h2>
            <Link href="/employer/employees">
              <Button size="sm" className="gap-1">
                <UserPlus className="h-4 w-4" /> Add Employee
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {employees.map((emp) => (
              <Link
                key={emp.id}
                href={`/employer/employees/${emp.id}`}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
              >
                <AvatarInitials name={emp.name} color={emp.avatarColor} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{emp.name}</p>
                  <p className="text-sm text-muted-foreground">{emp.role}</p>
                </div>
                <StatusBadge status={emp.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Auditors" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Registered Auditors</h2>
            <Link href="/employer/auditors">
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Invite Auditor
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {auditors.map((auditor) => (
              <div key={auditor.auditorId} className="flex items-center gap-4 px-6 py-4">
                <AvatarInitials name={auditor.name} color="#0EA5A4" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{auditor.name}</p>
                  <p className="text-sm text-muted-foreground">{auditor.email}</p>
                </div>
                <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {auditor.pubkeyFingerprint}
                </code>
                <StatusBadge status={auditor.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Reports" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold text-foreground">Payroll Spend by Month</h3>
            <div className="flex h-48 items-end gap-2">
              {[2800, 3200, 3000, 3600, 3800].map((value, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                    style={{ height: `${(value / 4000) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{["Jul", "Aug", "Sep", "Oct", "Nov"][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold text-foreground">Headcount Trend</h3>
            <div className="flex h-48 items-end gap-2">
              {[2, 2, 3, 3, 3].map((value, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t bg-accent transition-all hover:bg-accent/80"
                    style={{ height: `${(value / 4) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{["Jul", "Aug", "Sep", "Oct", "Nov"][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Activity Timeline</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {payrollRuns.flatMap((run) =>
                run.events.map((event, i) => (
                  <div key={`${run.runId}-${i}`} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      {i < run.events.length - 1 && <div className="h-full w-px bg-border" />}
                    </div>
                    <div className="pb-6">
                      <p className="text-sm font-medium text-foreground">{event.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.ts).toLocaleString()} • {run.runId}
                      </p>
                    </div>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
