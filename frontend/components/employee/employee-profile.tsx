"use client"

import { useMockStore } from "@/lib/mock-store"
import { useAuth } from "@/lib/auth-context"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Key, Copy, CheckCircle2, Calendar, Briefcase } from "lucide-react"
import { useState } from "react"

export function EmployeeProfile() {
  const { user } = useAuth()
  const { employees } = useMockStore()
  const [showCopied, setShowCopied] = useState<string | null>(null)

  // For demo, employee@demo maps to emp_001
  const employee = employees.find((e) => e.id === "emp_001")

  if (!employee) {
    return <div>Employee not found</div>
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setShowCopied(field)
    setTimeout(() => setShowCopied(null), 2000)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Your employment information and credentials</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center text-center">
            <AvatarInitials name={employee.name} color={employee.avatarColor} size="lg" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">{employee.name}</h2>
            <p className="text-muted-foreground">{employee.role}</p>
            <StatusBadge status={employee.status} className="mt-2" />
          </div>

          <div className="mt-6 space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground">{employee.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(employee.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">Contact Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={employee.email} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input value={employee.id} readOnly className="mt-1" />
              </div>
            </div>
          </div>

          {/* Employment Credential */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Employment Credential</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Verified Employment</p>
                    <p className="text-sm text-muted-foreground">
                      Issued by {employee.employmentCredential.issuedBy} on{" "}
                      {new Date(employee.employmentCredential.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Credential ID</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input value={employee.employmentCredential.credId} readOnly />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(employee.employmentCredential.credId, "credId")}
                  >
                    {showCopied === "credId" ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Credential Hash</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input value={employee.employmentCredential.hash} readOnly />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(employee.employmentCredential.hash, "hash")}
                  >
                    {showCopied === "hash" ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Keys */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Encryption Keys</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Your private key is stored securely in your wallet. Never share your private key with anyone.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong className="text-foreground">Public Key (Demo):</strong>{" "}
                  <code className="text-xs">pk_demo_001...abc</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
