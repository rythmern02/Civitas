"use client"

import Link from "next/link"
import { useMockStore } from "@/lib/mock-store"
import { useAuth } from "@/lib/auth-context"
import { KPICard } from "@/components/ui/kpi-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Inbox, Wallet, CreditCard, Clock, ArrowRight, Lock, Eye } from "lucide-react"

export function EmployeeDashboard() {
  const { user } = useAuth()
  const { notes, payrollRuns } = useMockStore()

  // For demo, employee@demo maps to emp_001 (Priya Sharma)
  const employeeId = "emp_001"
  const myNotes = notes.filter((n) => n.recipientId === employeeId)
  const unopenedNotes = myNotes.filter((n) => n.status === "Unopened")
  const openedNotes = myNotes.filter((n) => n.status === "Opened")

  const totalReceived = openedNotes.reduce((sum, note) => {
    if (note.decryptedAmount) {
      return sum + Number.parseFloat(note.decryptedAmount)
    }
    return sum
  }, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground">Your private payroll dashboard</p>
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Unopened Notes"
          value={unopenedNotes.length}
          icon={Inbox}
          trend={unopenedNotes.length > 0 ? { value: "New payments", positive: true } : undefined}
        />
        <KPICard
          title="Total Received"
          value={totalReceived > 0 ? `${totalReceived.toFixed(2)} ZEC` : "*** ZEC"}
          icon={Wallet}
          subtitle="From opened notes"
        />
        <KPICard title="Payroll Notes" value={myNotes.length} icon={CreditCard} subtitle="All time" />
        <KPICard
          title="Latest Run"
          value={payrollRuns[0]?.runId.slice(-8) || "N/A"}
          icon={Clock}
          subtitle={payrollRuns[0] ? new Date(payrollRuns[0].createdAt).toLocaleDateString() : ""}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/employee/inbox"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Inbox className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">View Inbox</h3>
            <p className="text-sm text-muted-foreground">
              {unopenedNotes.length > 0
                ? `${unopenedNotes.length} unopened note${unopenedNotes.length > 1 ? "s" : ""}`
                : "All notes opened"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/employee/claims"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
            <CreditCard className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Claim Funds</h3>
            <p className="text-sm text-muted-foreground">Bridge to your preferred chain</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Recent Notes */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Recent Payroll Notes</h2>
          <Link href="/employee/inbox">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-border">
          {myNotes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No payroll notes yet</p>
            </div>
          ) : (
            myNotes.slice(0, 5).map((note) => {
              const run = payrollRuns.find((r) => r.runId === note.runId)
              return (
                <Link
                  key={note.noteId}
                  href={`/employee/inbox/${note.noteId}`}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      note.status === "Unopened" ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    {note.status === "Unopened" ? (
                      <Lock className="h-5 w-5 text-primary" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      Payroll - {run ? new Date(run.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {note.status === "Opened" && note.decryptedAmount
                        ? `${note.decryptedAmount} ZEC`
                        : note.maskedAmount}
                    </p>
                  </div>
                  <StatusBadge status={note.status} />
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
