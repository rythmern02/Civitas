"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw } from "lucide-react"

interface Voucher {
  voucher_id: string
  amount: number
  currency: string
  status: "issued" | "redeemed" | "settled"
  memo?: string
  issued_at: string
  settlement_txid?: string
}

interface CredentialBundle {
  ciphertext: string
  iv: string
  signature: string
}

export function EmployeePortal({ employeeId }: { employeeId: string }) {
  const { user } = useAuth()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [credentialStatus, setCredentialStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle")
  const [credentialError, setCredentialError] = useState("")
  const [credentialFileName, setCredentialFileName] = useState("")
  const [credentialPayload, setCredentialPayload] = useState<CredentialBundle | null>(null)
  const credentialInputRef = useRef<HTMLInputElement | null>(null)

  const loadVouchers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/employees/vouchers", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load vouchers")
      const data = await res.json()
      setVouchers(data.vouchers || [])
    } catch (err: any) {
      setError(err.message || "Unable to fetch vouchers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadVouchers()
  }, [])

  const handleCredentialUpload = async (file: File) => {
    setCredentialError("")
    setCredentialStatus("verifying")
    setCredentialFileName(file.name)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const payload: CredentialBundle | undefined = parsed?.credential ?? parsed
      if (!payload?.ciphertext || !payload?.iv || !payload?.signature) {
        throw new Error("File must include a credential payload")
      }
      const res = await fetch("/api/employees/credential/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: payload }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Verification failed")
      }
      setCredentialStatus("verified")
      setCredentialPayload(payload)
    } catch (err: any) {
      setCredentialStatus("error")
      setCredentialPayload(null)
      setCredentialError(err.message || "Unable to verify credential")
    } finally {
      if (credentialInputRef.current) {
        credentialInputRef.current.value = ""
      }
    }
  }

  const redeemVoucher = async (voucherId: string) => {
    setError("")
    setSuccess("")
    if (!address) {
      setError("Enter a shielded address")
      return
    }
    if (credentialStatus !== "verified" || !credentialPayload) {
      setError("Upload and verify your credential bundle before redeeming.")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/employees/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voucher_id: voucherId,
          recipient_shielded_address: address,
          credential: credentialPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Redemption failed")
      setSuccess(`Settlement broadcast. txid=${data.txid}`)
      await loadVouchers()
    } catch (err: any) {
      setError(err.message || "Unable to redeem voucher")
    } finally {
      setIsLoading(false)
    }
  }

  if (user && user.id !== employeeId) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">You do not have access to this employee workspace.</p>
      </div>
    )
  }

  const canViewAmounts = credentialStatus === "verified"
  const canRedeem = credentialStatus === "verified" && !!credentialPayload

  return (
    <div className="space-y-6">
      <input
        ref={credentialInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleCredentialUpload(file)
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Employee portal</p>
          <h1 className="text-3xl font-bold text-foreground">Voucher locker</h1>
        </div>
        <Button variant="secondary" size="sm" className="gap-2" onClick={loadVouchers} disabled={isLoading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipient shielded address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="ztestsapling1..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Funds settle via Zcash testnet shielded transactions. Provide a Sapling receiver.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zero-knowledge credential</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload the voucher file you downloaded from your employer. We only unlock balances after it is verified.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" size="sm" onClick={() => credentialInputRef.current?.click()}>
              Select credential file
            </Button>
            <span className="text-xs text-muted-foreground sm:ml-3">
              {credentialFileName || "No file selected"}
            </span>
            <Badge
              variant={
                credentialStatus === "verified"
                  ? "default"
                  : credentialStatus === "error"
                    ? "outline"
                    : "secondary"
              }
            >
              {credentialStatus === "idle" && "Not verified"}
              {credentialStatus === "verifying" && "Verifying…"}
              {credentialStatus === "verified" && "Verified"}
              {credentialStatus === "error" && "Invalid"}
            </Badge>
          </div>
          {credentialError && <p className="text-xs text-destructive">{credentialError}</p>}
          {!canViewAmounts && (
            <p className="text-xs text-muted-foreground">
              Amounts stay hidden until the credential proves you own them.
            </p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-500">{success}</p>}

      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing vouchers...
          </div>
        )}
        {vouchers.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">No vouchers issued yet.</p>
        )}
        {vouchers.map((voucher) => (
          <Card key={voucher.voucher_id}>
            <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{new Date(voucher.issued_at).toLocaleString()}</p>
                <p className="text-xl font-semibold">
                  {canViewAmounts ? `${voucher.amount} ${voucher.currency}` : "Locked amount"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {canViewAmounts ? voucher.memo || "Payroll voucher" : "Upload credential to view details"}
                </p>
                <Badge
                  variant={voucher.status === "issued" ? "default" : "secondary"}
                  className="mt-2 w-fit capitalize"
                >
                  {voucher.status}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {voucher.settlement_txid && (
                  <a
                    href={`https://explorer.testnet.zcash.com/transactions/${voucher.settlement_txid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                  >
                    View txid
                  </a>
                )}
                <Button
                  onClick={() => redeemVoucher(voucher.voucher_id)}
                  disabled={voucher.status !== "issued" || isLoading || !canRedeem}
                >
                  {canRedeem ? "Redeem" : "Unlock to redeem"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
