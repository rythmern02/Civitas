"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Link2, CheckCircle2, Globe, Shield, Wallet, Settings } from "lucide-react"

const INTEGRATIONS = [
  {
    id: "axelar",
    name: "Axelar GMP",
    description: "Cross-chain messaging for payroll settlement",
    icon: Globe,
    status: "Connected",
    color: "#00D1FF",
  },
  {
    id: "zcash",
    name: "Zcash Shielded Pool",
    description: "Privacy-preserving payment source",
    icon: Shield,
    status: "Connected",
    color: "#F4B728",
  },
  {
    id: "near",
    name: "NEAR Protocol",
    description: "Target chain for bridged payments",
    icon: Wallet,
    status: "Pending",
    color: "#00C08B",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    description: "Alternative settlement chain",
    icon: Wallet,
    status: "Not Connected",
    color: "#627EEA",
  },
]

export function IntegrationsPage() {
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = async (id: string) => {
    setConnecting(id)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setConnecting(null)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-muted-foreground">Connect chains and services for payroll settlement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <div key={integration.id} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${integration.color}20` }}
              >
                <integration.icon className="h-6 w-6" style={{ color: integration.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{integration.name}</h3>
                  <StatusBadge
                    status={
                      integration.status === "Connected"
                        ? "active"
                        : integration.status === "Pending"
                          ? "Pending"
                          : "Draft"
                    }
                  />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {integration.status === "Connected" ? (
                <div className="flex items-center gap-2 text-sm text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(integration.id)}
                  disabled={connecting === integration.id}
                >
                  {connecting === integration.id ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-3 w-3" />
                      Connect
                    </>
                  )}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
        <div className="flex gap-4">
          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-medium text-foreground">Secure Multi-Chain Settlement</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Civitas uses Axelar's General Message Passing (GMP) to securely bridge payroll funds across chains. All
              cross-chain transactions are verified by Axelar's validator network.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
