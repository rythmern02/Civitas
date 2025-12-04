"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"

interface VoucherSummary {
  employee_id: string
  username: string
  voucher_id: string
  amount: number
  currency: string
  status: string
  settlement_txid?: string
}

interface VerificationResult {
  run_id: string
  total_employees: number
  vouchers_found: number
  redeemed: number
  pending: number
  status: string
  vouchers: VoucherSummary[]
}

export default function AuditorsPage() {
  const [runId, setRunId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async () => {
    setError("")
    setResult(null)
    if (!runId) {
      setError("Enter a run ID")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/auditors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ run_id: runId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Verification failed")
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Unable to verify")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Auditor console</p>
          <h1 className="text-3xl font-bold">Verify zkPayroll runs</h1>
        </div>
        <ShieldCheck className="h-10 w-10 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="run_2025_11_01"
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleVerify} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify run"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Run summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              <p>
                <span className="text-muted-foreground">Run ID:</span> {result.run_id}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {result.status}
              </p>
              <p>
                <span className="text-muted-foreground">Employees:</span> {result.total_employees}
              </p>
              <p>
                <span className="text-muted-foreground">Vouchers:</span> {result.vouchers_found} ({result.redeemed} redeemed)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2">Employee</th>
                    <th className="px-3 py-2">Voucher</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {result.vouchers.map((voucher) => (
                    <tr key={voucher.voucher_id} className="border-b border-border">
                      <td className="px-3 py-2">{voucher.username}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{voucher.voucher_id}</td>
                      <td className="px-3 py-2 font-medium">
                        {voucher.amount} {voucher.currency}
                      </td>
                      <td className="px-3 py-2">{voucher.status}</td>
                      <td className="px-3 py-2">
                        {voucher.settlement_txid ? (
                          <a
                            className="text-xs text-primary underline"
                            href={`https://explorer.testnet.zcash.com/transactions/${voucher.settlement_txid}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {voucher.settlement_txid.slice(0, 10)}…
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

