"use client"

import { useState } from "react"
import { useMockStore } from "@/lib/mock-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { CreditCard, CheckCircle2, ExternalLink, Wallet } from "lucide-react"

const CHAINS = [
  { id: "ethereum", name: "Ethereum", icon: "ETH" },
  { id: "polygon", name: "Polygon", icon: "MATIC" },
  { id: "arbitrum", name: "Arbitrum", icon: "ARB" },
  { id: "near", name: "NEAR", icon: "NEAR" },
]

export function EmployeeClaims() {
  const { notes } = useMockStore()
  const [selectedChain, setSelectedChain] = useState("ethereum")
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimComplete, setClaimComplete] = useState(false)

  const employeeId = "emp_001"
  const openedNotes = notes.filter((n) => n.recipientId === employeeId && n.status === "Opened" && n.decryptedAmount)

  const totalClaimable = openedNotes.reduce((sum, n) => sum + Number.parseFloat(n.decryptedAmount || "0"), 0)

  const handleClaim = async () => {
    setIsClaiming(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsClaiming(false)
    setClaimComplete(true)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Claim Funds</h1>
        <p className="text-muted-foreground">Bridge your payroll to your preferred chain</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Claim Form */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Bridge to Chain</h2>
          </div>
          <div className="p-6 space-y-6">
            {claimComplete ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <CheckCircle2 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Claim Submitted!</h3>
                <p className="mt-2 text-muted-foreground">
                  Your funds are being bridged to {CHAINS.find((c) => c.id === selectedChain)?.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">(Simulated - no real transaction)</p>
                <Button variant="outline" className="mt-6 bg-transparent" onClick={() => setClaimComplete(false)}>
                  Make Another Claim
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Claimable Amount</Label>
                    <span className="text-sm text-muted-foreground">
                      {openedNotes.length} note{openedNotes.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{totalClaimable.toFixed(2)} ZEC</p>
                    <p className="text-sm text-muted-foreground">From opened notes</p>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Destination Chain</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CHAINS.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => setSelectedChain(chain.id)}
                        className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                          selectedChain === chain.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-bold">
                          {chain.icon}
                        </div>
                        <span className="text-sm font-medium text-foreground">{chain.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleClaim}
                  disabled={isClaiming || totalClaimable === 0}
                >
                  {isClaiming ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Claim {totalClaimable.toFixed(2)} ZEC
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">Bridging via Axelar (simulated)</p>
              </>
            )}
          </div>
        </div>

        {/* Claimable Notes */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Claimable Notes</h2>
          </div>
          {openedNotes.length === 0 ? (
            <div className="p-6 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No claimable notes</p>
              <p className="text-sm text-muted-foreground">Open notes in your inbox first</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {openedNotes.map((note) => (
                <div key={note.noteId} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <CreditCard className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{note.decryptedAmount} ZEC</p>
                    <p className="text-sm text-muted-foreground">{new Date(note.deliveredAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status="Opened" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
        <div className="flex gap-4">
          <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-medium text-foreground">Cross-Chain Settlement</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Civitas uses Axelar GMP to bridge your wrapped ZEC to any supported chain. The bridging process is
              trustless and verifiable via the Axelar network.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
