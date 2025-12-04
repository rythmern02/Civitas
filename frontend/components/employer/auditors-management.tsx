"use client"

import type React from "react"

import { useState } from "react"
import { useMockStore, type Auditor } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, UserPlus, Shield, Mail, Key } from "lucide-react"

export function AuditorsManagement() {
  const { auditors, addAuditor } = useMockStore()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pubkeyFingerprint: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newAuditor: Auditor = {
      auditorId: `aud_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      pubkeyFingerprint: formData.pubkeyFingerprint || "XX:XX:XX:XX",
      status: "Pending",
    }
    addAuditor(newAuditor)
    setFormData({ name: "", email: "", pubkeyFingerprint: "" })
    setIsOpen(false)
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditors</h1>
          <p className="text-muted-foreground">Manage who can verify your payroll runs</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite Auditor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Auditor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="pubkey">Public Key Fingerprint</Label>
                <Input
                  id="pubkey"
                  value={formData.pubkeyFingerprint}
                  onChange={(e) => setFormData({ ...formData, pubkeyFingerprint: e.target.value })}
                  placeholder="AA:BB:CC:DD"
                />
              </div>
              <Button type="submit" className="w-full">
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {auditors.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No auditors yet</h3>
          <p className="mt-2 text-muted-foreground">Invite an auditor to verify your payroll runs</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {auditors.map((auditor) => (
            <div key={auditor.auditorId} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <AvatarInitials name={auditor.name} color="#0EA5A4" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{auditor.name}</h3>
                    <StatusBadge status={auditor.status} />
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {auditor.email}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Key className="h-3 w-3" />
                      <code className="text-xs">{auditor.pubkeyFingerprint}</code>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Can verify proofs but cannot see individual amounts</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
