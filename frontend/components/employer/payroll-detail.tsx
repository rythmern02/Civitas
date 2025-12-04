"use client"

import { useState } from "react"
import { useMockStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Copy, Download, RefreshCw, UserPlus, CheckCircle2, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"

type ProofBundle = {
  proof: Record<string, unknown>
  publicSignals: string[]
}

export function PayrollDetail({ runId }: { runId: string }) {
  const { payrollRuns, employees, notes } = useMockStore()
  const run = payrollRuns.find((r) => r.runId === runId)

  const [proofBundle, setProofBundle] = useState<ProofBundle | null>(null)
  const [commitStatus, setCommitStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [commitError, setCommitError] = useState("")
  const [commitTx, setCommitTx] = useState<string | null>(null)
  const [settleAddress, setSettleAddress] = useState<Record<string, string>>({})
  const [settleStatus, setSettleStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({})
  const [settleMessage, setSettleMessage] = useState<Record<string, string>>({})

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">Payroll run not found</p>
        <Link href="/employer/payrolls" className="mt-4">
          <Button variant="outline">Back to Payrolls</Button>
        </Link>
      </div>
    )
  }

  const runNotes = notes.filter((n) => n.runId === runId)

  const handleProofUpload = async (file: File) => {
    setCommitError("")
    setCommitStatus("idle")
    setCommitTx(null)
    try {
      const contents = JSON.parse(await file.text())
      if (!contents.proof || !contents.publicSignals) {
        throw new Error("Missing proof/publicSignals fields")
      }
      setProofBundle({
        proof: contents.proof,
        publicSignals: contents.publicSignals.map((signal: string | number) => signal.toString()),
      })
    } catch (err: any) {
      setProofBundle(null)
      setCommitError(err.message || "Unable to parse proof bundle")
    }
  }

  const handleCommit = async () => {
    if (!proofBundle) {
      setCommitError("Upload a proof bundle first")
      return
    }
    setCommitStatus("loading")
    setCommitError("")
    setCommitTx(null)
    console.log("[PayrollDetail] Committing payroll", run.runId)
    try {
      const totalAmount = run.declaredTotal?.replace(/[^\d.]/g, "") || "0"
      const res = await fetch("/api/payroll/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: run.runId,
          total_amount: totalAmount,
          payroll_root: run.payrollRoot,
          proof: proofBundle.proof,
          public_signals: proofBundle.publicSignals,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Commit failed")
      }
      setCommitTx(data.txHash)
      setCommitStatus("success")
      console.log("[PayrollDetail] Commit success", data.txHash)
    } catch (err: any) {
      setCommitStatus("error")
      setCommitError(err.message || "Commit failed")
      console.error("[PayrollDetail] Commit failed:", err)
    }
  }

  const decodeNoteAmount = (ciphertext: string) => {
    try {
      const decoded = JSON.parse(atob(ciphertext))
      return Number(decoded.amount) || null
    } catch {
      return null
    }
  }

  const handleSettlement = async (noteId: string, employeeId: string, amount: number) => {
    const address = settleAddress[noteId]?.trim()
    if (!address) {
      setSettleStatus((prev) => ({ ...prev, [noteId]: "error" }))
      setSettleMessage((prev) => ({ ...prev, [noteId]: "Enter shielded address" }))
      return
    }
    setSettleStatus((prev) => ({ ...prev, [noteId]: "loading" }))
    setSettleMessage((prev) => ({ ...prev, [noteId]: "" }))
    try {
      const res = await fetch("/api/payroll/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          voucher_id: noteId,
          recipient_shielded_address: address,
          amount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Settlement failed")
      setSettleStatus((prev) => ({ ...prev, [noteId]: "success" }))
      setSettleMessage((prev) => ({ ...prev, [noteId]: `tx: ${data.txid.slice(0, 8)}…` }))
    } catch (err: any) {
      setSettleStatus((prev) => ({ ...prev, [noteId]: "error" }))
      setSettleMessage((prev) => ({ ...prev, [noteId]: err.message || "Settlement failed" }))
    }
  }

  return (
    <div>
      <Link
        href="/employer/payrolls"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Payrolls
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{run.runId}</h1>
            <StatusBadge status={run.status} />
          </div>
          <p className="mt-1 text-muted-foreground">
            Created on {new Date(run.createdAt).toLocaleDateString()} by {run.createdBy}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Re-run
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Auditor
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-foreground">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="font-medium text-foreground">{run.employeeCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Declared Total</span>
                <span className="font-medium text-foreground">*** {run.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Currency</span>
                <span className="font-medium text-foreground">{run.currency}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-foreground">Proof Data</h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Payroll Root</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="break-all text-xs text-foreground">{run.payrollRoot}</code>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Proof Hash</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <code className="break-all text-xs text-foreground">{run.proofHash}</code>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Commit to NEAR</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">zk payroll circuits</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload the `proof.json` generated by `payroll_circuits` and broadcast the payroll root to the NEAR contract.
            </p>
            <input
              type="file"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleProofUpload(file)
              }}
              className="text-sm"
            />
            {proofBundle && (
              <p className="text-xs text-emerald-500">
                Proof loaded with {proofBundle.publicSignals.length} public signals
              </p>
            )}
            {commitError && <p className="text-sm text-destructive">{commitError}</p>}
            {commitTx && (
              <a
                href={`https://explorer.testnet.near.org/transactions/${commitTx}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline"
              >
                View transaction: {commitTx}
              </a>
            )}
            <Button onClick={handleCommit} disabled={!proofBundle || commitStatus === "loading"}>
              {commitStatus === "loading" ? "Submitting..." : "Commit payroll to NEAR"}
            </Button>
            {commitStatus === "loading" && (
              <p className="text-xs text-muted-foreground">Submitting transaction to NEAR…</p>
            )}
            {commitStatus === "success" && commitTx && (
              <p className="text-xs text-emerald-600">NEAR transaction broadcast successfully.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Zcash Settlement</h2>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">voucher payouts</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Redeem vouchers directly with a Sapling address. Each redemption broadcasts a testnet ZEC transfer.
            </p>
            {runNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vouchers available.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-4 py-2 text-left">Employee</th>
                      <th className="px-4 py-2 text-left">Voucher</th>
                      <th className="px-4 py-2 text-left">Amount (ZEC)</th>
                      <th className="px-4 py-2 text-left">Shielded Address</th>
                      <th className="px-4 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runNotes.map((note) => {
                      const emp = employees.find((e) => e.id === note.recipientId)
                      const amount = decodeNoteAmount(note.ciphertext) || 0.01
                      return (
                        <tr key={note.noteId} className="border-t border-border">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <AvatarInitials name={emp?.name || "Employee"} color={emp?.avatarColor} size="sm" />
                              <span>{emp?.name || "Employee"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{note.noteId}</td>
                          <td className="px-4 py-3">{amount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Input
                              placeholder="ztestsapling..."
                              value={settleAddress[note.noteId] || ""}
                              onChange={(e) =>
                                setSettleAddress((prev) => ({ ...prev, [note.noteId]: e.target.value }))
                              }
                            />
                            {settleMessage[note.noteId] && (
                              <p
                                className={`mt-1 text-xs ${
                                  settleStatus[note.noteId] === "success" ? "text-emerald-600" : "text-destructive"
                                }`}
                              >
                                {settleMessage[note.noteId]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={settleStatus[note.noteId] === "loading"}
                              onClick={() => handleSettlement(note.noteId, note.recipientId, amount)}
                            >
                              {settleStatus[note.noteId] === "loading" ? "Settling..." : "Settle"}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Employee Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold text-foreground">Employee Notes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Net Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Settlement Tx
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {runNotes.map((note) => {
                    const emp = employees.find((e) => e.id === note.recipientId)
                    return (
                      <tr key={note.noteId} className="hover:bg-muted/50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <AvatarInitials name={emp?.name || "Unknown"} color={emp?.avatarColor} size="sm" />
                            <span className="text-sm font-medium text-foreground">{emp?.name || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                          {note.maskedAmount}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={note.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <a href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                            0xtx_sim_...
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold text-foreground">Timeline</h2>
            <div className="space-y-4">
              {run.events.map((event, i) => (
                <div key={i} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        i === run.events.length - 1 ? "bg-accent/20" : "bg-primary/20"
                      }`}
                    >
                      {i === run.events.length - 1 ? (
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                      ) : (
                        <Clock className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {i < run.events.length - 1 && <div className="h-full w-px bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-foreground">{event.text}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.ts).toLocaleString()}</p>
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
