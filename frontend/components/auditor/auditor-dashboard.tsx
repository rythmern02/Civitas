"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useMockStore } from "@/lib/mock-store"
import { KPICard } from "@/components/ui/kpi-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, FileText, Shield, Clock, ArrowRight, CheckCircle2 } from "lucide-react"

export function AuditorDashboard() {
  const { user } = useAuth()
  const { payrollRuns } = useMockStore()

  const committedRuns = payrollRuns.filter((r) => r.status === "Committed")
  const settledRuns = payrollRuns.filter((r) => r.status === "Settled")

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Auditor Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Pending Verification"
          value={committedRuns.length}
          icon={Clock}
          trend={committedRuns.length > 0 ? { value: "Needs review", positive: false } : undefined}
        />
        <KPICard title="Verified Runs" value={settledRuns.length} icon={CheckCircle2} subtitle="All time" />
        <KPICard title="Total Runs" value={payrollRuns.length} icon={FileText} subtitle="In system" />
        <KPICard title="Status" value="Active" icon={Shield} trend={{ value: "Registered", positive: true }} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/auditor/requests"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">View Requests</h3>
            <p className="text-sm text-muted-foreground">{committedRuns.length} pending verification</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/auditor/verifications"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
            <ClipboardCheck className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Verification History</h3>
            <p className="text-sm text-muted-foreground">{settledRuns.length} verified runs</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Recent Payroll Runs</h2>
          <Link href="/auditor/requests">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {payrollRuns.slice(0, 5).map((run) => (
            <div key={run.runId} className="flex items-center gap-4 px-6 py-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  run.status === "Committed" ? "bg-primary/10" : "bg-muted"
                }`}
              >
                {run.status === "Committed" ? (
                  <Clock className="h-5 w-5 text-primary" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{run.runId}</p>
                <p className="text-sm text-muted-foreground">
                  {run.employeeCount} employees • {new Date(run.createdAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={run.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
