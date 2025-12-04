"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMockStore, type PayrollRun, type Note } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AvatarInitials } from "@/components/ui/avatar-initials"
import { Check, Users, FileSpreadsheet, Settings, Eye, Cpu, Send, AlertCircle, CheckCircle2 } from "lucide-react"

const STEPS = [
  { id: 1, title: "Select Employees", icon: Users },
  { id: 2, title: "Input Data", icon: FileSpreadsheet },
  { id: 3, title: "Policy", icon: Settings },
  { id: 4, title: "Review", icon: Eye },
  { id: 5, title: "Generate", icon: Cpu },
  { id: 6, title: "Commit", icon: Send },
]

interface PayrollInput {
  employeeId: string
  hours: number
  bonus: number
  taxCode: string
}

export function CreatePayrollWizard() {
  const router = useRouter()
  const { employees, addPayrollRun, addNote } = useMockStore()
  const [step, setStep] = useState(1)
  const initialActive = employees.filter((e) => e.status === "active").map((e) => e.id)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(initialActive)
  const [payrollInputs, setPayrollInputs] = useState<PayrollInput[]>(
    employees.map((e) => ({
      employeeId: e.id,
      hours: 160,
      bonus: 0,
      taxCode: "STANDARD",
    })),
  )
  const [taxPreset, setTaxPreset] = useState("standard")
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedRun, setGeneratedRun] = useState<PayrollRun | null>(null)
  const [proofBundle, setProofBundle] = useState<{ proof: Record<string, unknown>; publicSignals: string[] } | null>(null)
  const [generateError, setGenerateError] = useState("")
  const [commitError, setCommitError] = useState("")
  const [commitTx, setCommitTx] = useState<string | null>(null)
  const [manualProofError, setManualProofError] = useState("")
  const [settleAddress, setSettleAddress] = useState<Record<string, string>>({})
  const [settleStatus, setSettleStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({})
  const [settleMessage, setSettleMessage] = useState<Record<string, string>>({})
  const proofFileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingProofFile, setPendingProofFile] = useState<File | null>(null)

  const activeEmployees = employees.filter((e) => e.status === "active")

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  const selectAll = () => {
    setSelectedEmployees(activeEmployees.map((e) => e.id))
  }

  const deselectAll = () => {
    setSelectedEmployees([])
  }

  const updateInput = (employeeId: string, field: keyof PayrollInput, value: number | string) => {
    setPayrollInputs((prev) =>
      prev.map((input) => (input.employeeId === employeeId ? { ...input, [field]: value } : input)),
    )
  }

  const computeNetPay = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId)
    const input = payrollInputs.find((i) => i.employeeId === employeeId)
    if (!emp || !input) return 0

    const basePay = emp.basePay
    const bonus = input.bonus
    const taxRate = taxPreset === "high" ? 0.3 : taxPreset === "low" ? 0.1 : 0.2
    return Math.round((basePay + bonus) * (1 - taxRate) * 100) / 100
  }

  const totalPayroll = selectedEmployees.reduce((sum, id) => sum + computeNetPay(id), 0)

  const buildRunScaffold = (payrollRoot: string, runId?: string, createdAt?: string): PayrollRun => {
    const now = createdAt || new Date().toISOString()
    const noteIds = selectedEmployees.map((_, i) => `note_${Date.now()}_${i}`)
    return {
      runId: runId || `run_manual_${Date.now().toString(36)}`,
      orgId: "demo_org",
      createdBy: "employer@demo",
      createdAt: now,
      status: "Draft",
      employeeCount: selectedEmployees.length,
      declaredTotal: totalPayroll.toFixed(2),
      currency: "ZEC",
      payrollRoot,
      proofHash: "0xproof",
      notes: noteIds,
      events: [{ ts: now, text: "Manual proof uploaded" }],
    }
  }

  const handleGenerate = async () => {
    setGenerateError("")
    setCommitError("")
    setIsProcessing(true)
    setStep(5)
    console.log("[PayrollWizard] Generating payroll for employees:", selectedEmployees)
    try {
      const payload = {
        employees: selectedEmployees.map((empId) => ({
          employee_id: empId,
          net_pay: computeNetPay(empId),
        })),
      }
      const res = await fetch("/api/payroll/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[PayrollWizard] Generate failed:", data)
        throw new Error(data.error || "Generation failed")
      }

      const now = new Date().toISOString()
      const noteIds = selectedEmployees.map((_, i) => `note_${Date.now()}_${i}`)

      const newRun: PayrollRun = {
        runId: data.run_id,
        orgId: "demo_org",
        createdBy: "employer@demo",
        createdAt: now,
        status: "Draft",
        employeeCount: selectedEmployees.length,
        declaredTotal: Number(data.total_amount).toFixed(2),
        currency: "ZEC",
        payrollRoot: data.payroll_root,
        proofHash: data.public_signals?.[0] || "0xproof",
        notes: noteIds,
        events: [{ ts: now, text: "ZK proof generated" }],
      }

      setGeneratedRun(newRun)
      setProofBundle({ proof: data.proof, publicSignals: data.public_signals })
      console.log("[PayrollWizard] Generation success:", newRun)
    } catch (err: any) {
      console.error("[PayrollWizard] Error generating payroll:", err)
      setGenerateError(err.message || "Failed to generate payroll")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCommit = async () => {
    if (!generatedRun || !proofBundle) return
    setCommitError("")
    setIsProcessing(true)
    setCommitTx(null)
    setStep(6)
    console.log("[PayrollWizard] Committing payroll", generatedRun.runId)

    try {
      const res = await fetch("/api/payroll/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: generatedRun.runId,
          total_amount: generatedRun.declaredTotal,
          payroll_root: generatedRun.payrollRoot,
          proof: proofBundle.proof,
          public_signals: proofBundle.publicSignals,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[PayrollWizard] Commit failed:", data)
        throw new Error(data.error || "Commit failed")
      }

      const now = new Date().toISOString()
      selectedEmployees.forEach((empId, i) => {
        const netPay = computeNetPay(empId)
        const newNote: Note = {
          noteId: generatedRun.notes[i],
          runId: generatedRun.runId,
          recipientId: empId,
          ciphertext: btoa(
            JSON.stringify({
              amount: netPay,
              memo: "Payroll payment",
              nullifier: `null_${Date.now()}_${i}`,
            }),
          ),
          maskedAmount: "*** ZEC",
          status: "Unopened",
          deliveredAt: now,
        }
        addNote(newNote)
      })

      const committedRun: PayrollRun = {
        ...generatedRun,
        status: "Committed",
        events: [
          ...generatedRun.events,
          { ts: now, text: "Proof validated" },
          { ts: now, text: "Committed on NEAR" },
        ],
      }

      addPayrollRun(committedRun)
      setCommitTx(data.txHash)
      console.log("[PayrollWizard] Commit success. Tx:", data.txHash)
    } catch (err: any) {
      console.error("[PayrollWizard] Error committing payroll:", err)
      setCommitError(err.message || "Commit failed")
      setStep(5)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProofBundleUpload = async (file: File) => {
    setManualProofError("")
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!parsed?.proof || !parsed?.publicSignals) throw new Error("Bundle must include proof and publicSignals")
      const publicSignals = parsed.publicSignals.map((sig: string | number) => sig.toString())
      const payrollRoot = publicSignals[1]
      if (!payrollRoot) throw new Error("publicSignals[1] missing payroll root")

      const scaffold = generatedRun ?? buildRunScaffold(payrollRoot)
      scaffold.payrollRoot = payrollRoot
      scaffold.proofHash = publicSignals[0] || scaffold.proofHash
      scaffold.declaredTotal = totalPayroll.toFixed(2)

      setGeneratedRun(scaffold)
      setProofBundle({ proof: parsed.proof, publicSignals })
      if (step < 5) setStep(5)
      console.log("[PayrollWizard] Manual proof bundle loaded")
      setPendingProofFile(null)
      if (proofFileInputRef.current) proofFileInputRef.current.value = ""
    } catch (err: any) {
      console.error("[PayrollWizard] Manual proof upload failed:", err)
      setManualProofError(err.message || "Invalid proof bundle")
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
      <input
        ref={proofFileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] || null
          setPendingProofFile(file)
          setManualProofError("")
        }}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create Payroll Run</h1>
        <p className="text-muted-foreground">Run private payroll end-to-end</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between overflow-x-auto pb-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  step > s.id
                    ? "bg-accent text-accent-foreground"
                    : step === s.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span
                className={`mt-2 hidden text-xs sm:block ${step >= s.id ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-px w-8 sm:w-16 ${step > s.id ? "bg-accent" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {step === 1 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Select Employees</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {activeEmployees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedEmployees.includes(emp.id)}
                    onCheckedChange={() => toggleEmployee(emp.id)}
                  />
                  <AvatarInitials name={emp.name} color={emp.avatarColor} size="sm" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">{emp.role}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Base: {emp.basePay} {emp.salaryCurrency}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Payroll Inputs</h2>
            <div className="space-y-4">
              {selectedEmployees.map((empId) => {
                const emp = employees.find((e) => e.id === empId)
                const input = payrollInputs.find((i) => i.employeeId === empId)
                if (!emp || !input) return null
                return (
                  <div key={empId} className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-4">
                    <div className="flex items-center gap-3">
                      <AvatarInitials name={emp.name} color={emp.avatarColor} size="sm" />
                      <span className="font-medium text-foreground">{emp.name}</span>
                    </div>
                    <div>
                      <Label className="text-xs">Hours</Label>
                      <Input
                        type="number"
                        value={input.hours}
                        onChange={(e) => updateInput(empId, "hours", Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bonus</Label>
                      <Input
                        type="number"
                        value={input.bonus}
                        onChange={(e) => updateInput(empId, "bonus", Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tax Code</Label>
                      <Input value={input.taxCode} onChange={(e) => updateInput(empId, "taxCode", e.target.value)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Tax Policy</h2>
            <div className="space-y-3">
              {[
                { id: "low", label: "Low (10%)", desc: "Minimal withholding" },
                { id: "standard", label: "Standard (20%)", desc: "Recommended for most" },
                { id: "high", label: "High (30%)", desc: "Maximum withholding" },
              ].map((preset) => (
                <label
                  key={preset.id}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                    taxPreset === preset.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="taxPreset"
                    value={preset.id}
                    checked={taxPreset === preset.id}
                    onChange={() => setTaxPreset(preset.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="font-medium text-foreground">{preset.label}</p>
                    <p className="text-sm text-muted-foreground">{preset.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Review Payroll</h2>
            <div className="mb-6 rounded-lg border border-border">
              <div className="border-b border-border bg-muted/50 px-4 py-3">
                <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground">
                  <span>Employee</span>
                  <span className="text-center">Base + Bonus</span>
                  <span className="text-right">Net Pay (simulated)</span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {selectedEmployees.map((empId) => {
                  const emp = employees.find((e) => e.id === empId)
                  const input = payrollInputs.find((i) => i.employeeId === empId)
                  if (!emp || !input) return null
                  return (
                    <div key={empId} className="grid grid-cols-3 items-center px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AvatarInitials name={emp.name} color={emp.avatarColor} size="sm" />
                        <span className="text-sm font-medium text-foreground">{emp.name}</span>
                      </div>
                      <span className="text-center text-sm text-muted-foreground">
                        {emp.basePay} + {input.bonus} ZEC
                      </span>
                      <span className="text-right text-sm font-medium text-foreground">
                        {computeNetPay(empId).toFixed(2)} ZEC
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-border bg-muted/50 px-4 py-3">
                <div className="grid grid-cols-3 text-sm font-semibold">
                  <span className="text-foreground">Total</span>
                  <span></span>
                  <span className="text-right text-primary">{totalPayroll.toFixed(2)} ZEC</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Bring your own proof</p>
                  <p className="text-sm text-muted-foreground">
                    Already ran the circuit elsewhere? Upload the bundle containing {"{ proof, publicSignals }"} to skip on-device proving.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => proofFileInputRef.current?.click()}
                    >
                      Select file
                    </Button>
                    <div className="text-xs text-muted-foreground sm:ml-3">
                      {pendingProofFile ? pendingProofFile.name : "No file selected"}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!pendingProofFile}
                      onClick={() => {
                        if (pendingProofFile) void handleProofBundleUpload(pendingProofFile)
                      }}
                    >
                      Upload bundle
                    </Button>
                  </div>
                  {manualProofError && <p className="text-xs text-destructive mt-2">{manualProofError}</p>}
                  {proofBundle && (
                    <p className="text-xs text-emerald-500 mt-1">
                      Loaded bundle with {proofBundle.publicSignals.length} public signals
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

            {step === 5 && (
          <div className="text-center py-8">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-lg font-medium text-foreground">Generating ZK proofs...</p>
                <p className="text-sm text-muted-foreground">Computing encrypted payslips and Merkle tree</p>
              </div>
            ) : generatedRun ? (
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">Payroll Generated</p>
                  <p className="text-sm text-muted-foreground">Proof ready for NEAR commit</p>
                </div>
                <div className="mx-auto max-w-md rounded-lg border border-border bg-muted/50 p-4 text-left">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Run ID:</span>
                      <code className="text-foreground">{generatedRun.runId}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payroll Root:</span>
                      <code className="text-foreground">{generatedRun.payrollRoot.slice(0, 12)}...</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <code className="text-foreground">{generatedRun.declaredTotal} ZEC</code>
                    </div>
                  </div>
                </div>
                {generateError && <p className="text-sm text-destructive">{generateError}</p>}
                <div className="rounded-lg border border-dashed border-primary/40 bg-card p-4 text-left space-y-3">
                  <p className="text-sm font-medium text-foreground">Replace proof bundle</p>
                  <p className="text-xs text-muted-foreground">
                    Need to swap in a different `proof_bundle.json` before committing? Select a file and upload it here.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => proofFileInputRef.current?.click()}
                    >
                      Select file
                    </Button>
                    <div className="text-xs text-muted-foreground sm:ml-2">
                      {pendingProofFile ? pendingProofFile.name : "No file selected"}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!pendingProofFile}
                      onClick={() => {
                        if (pendingProofFile) void handleProofBundleUpload(pendingProofFile)
                      }}
                    >
                      Upload bundle
                    </Button>
                  </div>
                  {manualProofError && <p className="text-xs text-destructive">{manualProofError}</p>}
                  {proofBundle && (
                    <p className="text-xs text-emerald-500">Loaded bundle with {proofBundle.publicSignals.length} signals</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {step === 6 && (
          <div className="text-center py-8">
            {isProcessing ? (
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-lg font-medium text-foreground">Committing to NEAR...</p>
                <p className="text-sm text-muted-foreground">Broadcasting transaction</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">Payroll Committed!</p>
                  <p className="text-sm text-muted-foreground">Notes have been delivered to employees</p>
                  {commitTx && (
                    <a
                      href={`https://explorer.testnet.near.org/transactions/${commitTx}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline"
                    >
                      View NEAR tx: {commitTx}
                    </a>
                  )}
                </div>
                {commitError && <p className="text-sm text-destructive">{commitError}</p>}
                <Button onClick={() => router.push("/employer/payrolls")}>View All Payrolls</Button>
                {generatedRun && (
                  <div className="text-left">
                    <h3 className="mt-10 mb-4 text-lg font-semibold text-foreground">Zcash Settlement</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enter the employee’s Sapling address to settle each voucher via testnet ZEC.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="px-4 py-2 text-left">Employee</th>
                            <th className="px-4 py-2 text-left">Voucher ID</th>
                            <th className="px-4 py-2 text-left">Amount (ZEC)</th>
                            <th className="px-4 py-2 text-left">Shielded Address</th>
                            <th className="px-4 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedRun.notes.map((noteId, idx) => {
                            const employeeId = selectedEmployees[idx]
                            const employee = employees.find((e) => e.id === employeeId)
                            const amount = computeNetPay(employeeId)
                            return (
                              <tr key={noteId} className="border-t border-border">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <AvatarInitials name={employee?.name || "Employee"} color={employee?.avatarColor} size="sm" />
                                    <span>{employee?.name || "Employee"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{noteId}</td>
                                <td className="px-4 py-3">{amount.toFixed(2)}</td>
                                <td className="px-4 py-3">
                                  <Input
                                    placeholder="ztestsapling..."
                                    value={settleAddress[noteId] || ""}
                                    onChange={(e) =>
                                      setSettleAddress((prev) => ({ ...prev, [noteId]: e.target.value }))
                                    }
                                  />
                                  {settleMessage[noteId] && (
                                    <p
                                      className={`mt-1 text-xs ${
                                        settleStatus[noteId] === "success" ? "text-emerald-600" : "text-destructive"
                                      }`}
                                    >
                                      {settleMessage[noteId]}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={!employeeId || settleStatus[noteId] === "loading"}
                                    onClick={() => handleSettlement(noteId, employeeId, amount)}
                                  >
                                    {settleStatus[noteId] === "loading" ? "Settling..." : "Settle"}
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || step === 6 || isProcessing}
        >
          Back
        </Button>
        <div className="flex gap-2">
          {step < 4 && (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && selectedEmployees.length === 0}>
              Continue
            </Button>
          )}
          {step === 4 && (
              <Button onClick={handleGenerate} disabled={isProcessing}>
                {isProcessing ? "Generating..." : "Generate Payroll"}
              </Button>
          )}
          {step === 5 && !isProcessing && proofBundle && (
            <Button onClick={handleCommit}>Commit to NEAR</Button>
          )}
        </div>
      </div>
    </div>
  )
}
