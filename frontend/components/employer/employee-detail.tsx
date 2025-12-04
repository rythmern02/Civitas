"use client"

import { useState } from "react"
import { useMockStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Shield, Calendar, Mail, Briefcase, Copy } from "lucide-react"
import Link from "next/link"

export function EmployeeDetail({ employeeId }: { employeeId: string }) {
  const { employees } = useMockStore()
  const employee:any = employees.find((e) => e.id === employeeId)
  const [voucherStatus, setVoucherStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [voucherLink, setVoucherLink] = useState<string | null>(null)
  const [voucherError, setVoucherError] = useState("")

  const handleCreateVoucher = async () => {
    setVoucherStatus("loading")
    setVoucherError("")
    setVoucherLink(null)
    try {
      const res = await fetch(`/api/employer/employees/${employeeId}/voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: {
            employee_id: employee.id,
            username: employee.email?.split("@")[0] ?? employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            basePay: employee.basePay,
            salaryCurrency: employee.salaryCurrency,
            org_id: employee.employmentCredential?.issuedBy || "demo_org",
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Unable to create voucher")
      }
      setVoucherLink(data.download_url)
      setVoucherStatus("success")
    } catch (err: any) {
      setVoucherStatus("error")
      setVoucherError(err.message || "Failed to create voucher")
    }
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Employee not found</p>
        <Link href="/employer/employees" className="mt-4">
          <Button variant="outline">Back to Employees</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        href="/employer/employees"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center text-center">
            <AvatarInitials name={employee.name} color={employee.avatarColor} size="lg" />
            <h1 className="mt-4 text-xl font-bold text-foreground">{employee.name}</h1>
            <p className="text-muted-foreground">{employee.role}</p>
            <StatusBadge status={employee.status} className="mt-2" />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{employee.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{employee.role}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Started {new Date(employee.startDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Employment Credential */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Employment Credential</h2>
                <p className="text-sm text-muted-foreground">Verifiable on-chain credential</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credential ID</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="text-sm text-foreground">{employee.employmentCredential.credId}</code>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-4">
                  <span className="text-sm text-muted-foreground">Issued By</span>
                  <p className="text-sm font-medium text-foreground">{employee.employmentCredential.issuedBy}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <span className="text-sm text-muted-foreground">Issued At</span>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(employee.employmentCredential.issuedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Credential Hash</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="break-all text-sm text-foreground">{employee.employmentCredential.hash}</code>
              </div>

            <div className="rounded-lg border border-dashed border-primary/40 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Issue credential voucher</p>
                    <p className="text-xs text-muted-foreground">
                      Generate a single-use download link and share it securely with the employee. Once redeemed, the link
                      expires automatically.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateVoucher}
                      disabled={voucherStatus === "loading"}
                    >
                      {voucherStatus === "loading" ? "Generating…" : "Generate voucher"}
                    </Button>
                    {voucherLink && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => navigator.clipboard?.writeText(voucherLink)}
                      >
                        Copy link
                      </Button>
                    )}
                  </div>
                  {voucherError && <p className="text-xs text-destructive">{voucherError}</p>}
                  {voucherLink && (
                    <div className="rounded bg-muted/70 p-2">
                      <p className="text-xs text-muted-foreground">Share this link with the employee:</p>
                      <code className="text-xs break-all text-foreground">{voucherLink}</code>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Salary History (Mock) */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-foreground">Salary History</h2>
            <div className="space-y-3">
              {[
                { month: "November 2025", amount: employee.basePay, status: "Pending" },
                { month: "October 2025", amount: employee.basePay, status: "Paid" },
                { month: "September 2025", amount: employee.basePay, status: "Paid" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm text-foreground">{item.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">*** ZEC</span>
                    <StatusBadge status={item.status === "Paid" ? "Settled" : "Draft"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
