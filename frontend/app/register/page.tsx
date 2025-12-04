"use client"

import { useMemo, useState } from "react"
import Papa from "papaparse"
import Link from "next/link"
import { Shield, Upload, Users, Copy, Download, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { encodeCredentialForDownload, type CredentialFile } from "@/lib/identity"

interface PendingEmployee {
  name: string
  email: string
  username: string
  salary: number
  currency: string
}

interface ProvisionedEmployee {
  employee_id: string
  username: string
  temporary_password: string
  employee_tag: string
  credential_secret: string
  credential_file: CredentialFile
}

export default function RegisterPage() {
  const [orgName, setOrgName] = useState("")
  const [pendingEmployee, setPendingEmployee] = useState<PendingEmployee>({
    name: "",
    email: "",
    username: "",
    salary: 0,
    currency: "ZEC",
  })
  const [roster, setRoster] = useState<PendingEmployee[]>([])
  const [provisioned, setProvisioned] = useState<ProvisionedEmployee[]>([])
  const [isProvisioning, setIsProvisioning] = useState(false)
  const [error, setError] = useState("")

  const orgId = useMemo(() => orgName.toLowerCase().replace(/[^a-z0-9]/g, "_") || "org_demo", [orgName])

  const addEmployee = () => {
    if (!pendingEmployee.name || !pendingEmployee.email) return
    setRoster((prev) => [...prev, pendingEmployee])
    setPendingEmployee({
      name: "",
      email: "",
      username: "",
      salary: 0,
      currency: "ZEC",
    })
  }

  const parseCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: ({ data }) => {
        const parsed = (data as Record<string, string>[]).map((row) => ({
          name: row.name || "",
          email: row.email || "",
          username: row.username || row.email?.split("@")[0] || "",
          salary: Number(row.salary) || 0,
          currency: row.currency || "ZEC",
        }))
        setRoster((prev) => [...prev, ...parsed.filter((emp) => emp.email)])
      },
    })
  }

  const handleProvision = async () => {
    setError("")
    if (roster.length === 0) {
      setError("Add at least one employee")
      return
    }
    setIsProvisioning(true)
    try {
      const res = await fetch("/api/employer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "onboard",
          org_id: orgId,
          employees: roster,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Provisioning failed")
      }
      setProvisioned(data.employees)
    } catch (err: any) {
      setError(err.message || "Unable to provision")
    } finally {
      setIsProvisioning(false)
    }
  }

  const downloadCredential = (employee: ProvisionedEmployee) => {
    const blob = new Blob([encodeCredentialForDownload(employee.credential_file)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${employee.username}_credential.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {})
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/3 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <span className="text-2xl font-semibold">Civitas</span>
        </Link>
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-foreground/70">zkPayroll onboarding</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight">
            Upload your roster and mint employee identities with one click.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Passwords, employee tags, and zkPassport bundles are generated automatically and shown exactly once.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Need help? hello@civitas.id</p>
      </div>

      <div className="flex w-full flex-col gap-8 px-4 py-10 sm:px-8 lg:w-2/3 lg:px-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provision employees</h1>
          <p className="text-muted-foreground">Load a CSV from payroll or add employees manually.</p>
        </div>

        <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="org_name">Organization name</Label>
            <Input
              id="org_name"
              placeholder="Acme Robotics"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-dashed border-border/80 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Import CSV</p>
                  <p className="text-sm text-muted-foreground">Headers: name,email,username,salary,currency</p>
                </div>
              </div>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) parseCsv(file)
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border/80 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Add employee</p>
                <p className="text-sm text-muted-foreground">Use for quick additions or edits post-import.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Full name"
                value={pendingEmployee.name}
                onChange={(e) => setPendingEmployee((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Email"
                value={pendingEmployee.email}
                onChange={(e) => setPendingEmployee((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Username"
                value={pendingEmployee.username}
                onChange={(e) => setPendingEmployee((prev) => ({ ...prev, username: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Salary"
                  value={pendingEmployee.salary || ""}
                  onChange={(e) => setPendingEmployee((prev) => ({ ...prev, salary: Number(e.target.value) }))}
                />
                <Input
                  placeholder="Currency"
                  value={pendingEmployee.currency}
                  onChange={(e) => setPendingEmployee((prev) => ({ ...prev, currency: e.target.value }))}
                />
              </div>
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-4 gap-2" onClick={addEmployee}>
              <Plus className="h-4 w-4" />
              Add to roster
            </Button>
          </div>

          {roster.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="bg-muted/40 px-4 py-2 text-sm font-medium">
                {roster.length} employees queued for provisioning
              </div>
              <Textarea
                readOnly
                className="h-32 rounded-none border-0 bg-background font-mono text-xs"
                value={roster.map((emp) => `${emp.username} • ${emp.email} • ${emp.currency} ${emp.salary}`).join("\n")}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={handleProvision} disabled={isProvisioning || roster.length === 0}>
              {isProvisioning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting identities...
                </>
              ) : (
                "Create identities"
              )}
            </Button>
          </div>
        </div>

        {provisioned.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Provisioned credentials</h3>
            <p className="text-sm text-muted-foreground">
              Store securely — passwords, employee tags, and credential secrets are only shown once.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">Password</th>
                    <th className="px-3 py-2">Employee Tag</th>
                    <th className="px-3 py-2">Credential Secret</th>
                    <th className="px-3 py-2">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {provisioned.map((emp) => (
                    <tr key={emp.employee_id} className="border-b border-border">
                      <td className="px-3 py-2 font-medium">{emp.username}</td>
                      <td className="px-3 py-2">
                        <button className="inline-flex items-center gap-1 text-primary" onClick={() => copyToClipboard(emp.temporary_password)}>
                          <Copy className="h-3 w-3" />
                          {emp.temporary_password}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button className="inline-flex items-center gap-1 text-primary" onClick={() => copyToClipboard(emp.employee_tag)}>
                          <Copy className="h-3 w-3" />
                          {emp.employee_tag.slice(0, 10)}…
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button className="inline-flex items-center gap-1 text-primary" onClick={() => copyToClipboard(emp.credential_secret)}>
                          <Copy className="h-3 w-3" />
                          {emp.credential_secret.slice(0, 10)}…
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={() => downloadCredential(emp)}>
                          <Download className="mr-1 h-4 w-4" />
                          JSON
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
