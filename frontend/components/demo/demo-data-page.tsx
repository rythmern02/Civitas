"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw, Users, Wallet, ClipboardCheck, CheckCircle2, AlertTriangle } from "lucide-react"

export function DemoDataPage() {
  const [resetting, setResetting] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Clear localStorage
    localStorage.removeItem("civitas_employees")
    localStorage.removeItem("civitas_payroll_runs")
    localStorage.removeItem("civitas_notes")
    localStorage.removeItem("civitas_auditors")

    setResetting(false)
    setResetComplete(true)

    // Reload after short delay
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Demo Data</h1>
        <p className="text-muted-foreground">Manage the simulated data in this prototype</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Data Overview */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Current Demo Data</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Employees</p>
                <p className="text-sm text-muted-foreground">3 demo employees</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Payroll Runs</p>
                <p className="text-sm text-muted-foreground">2 historical runs</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Auditors</p>
                <p className="text-sm text-muted-foreground">1 registered auditor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-6 py-4">
            <RefreshCw className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Reset Data</h2>
          </div>
          <div className="p-6 space-y-4">
            {resetComplete ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <p className="font-medium text-foreground">Data Reset Complete</p>
                <p className="text-sm text-muted-foreground">Reloading...</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Warning</p>
                      <p className="text-sm text-muted-foreground">
                        This will reset all data to the initial demo state. Any payroll runs you've created will be
                        lost.
                      </p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full bg-transparent" onClick={handleReset} disabled={resetting}>
                  {resetting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Default Data
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Demo Accounts */}
      <div className="mt-6 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">Demo Accounts</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 text-foreground">Employer</td>
                  <td className="py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">employer@demo</code>
                  </td>
                  <td className="py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">demo123</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-foreground">Employee</td>
                  <td className="py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">employee@demo</code>
                  </td>
                  <td className="py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">demo123</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-foreground">Auditor</td>
                  <td className="py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">auditor@demo</code>
                  </td>
                  <td className="py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">demo123</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
