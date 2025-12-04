"use client"

import { useEffect, useState } from "react"
import { useWalletSelector } from "@near-wallet-selector/react-hook"
import { LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

function truncateAccount(accountId: string) {
  if (accountId.length <= 18) return accountId
  return `${accountId.slice(0, 10)}…${accountId.slice(-5)}`
}

export function NearWalletButton() {
  const { selector, modal } = useWalletSelector()
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  useEffect(() => {
    if (!selector) return
    const subscription = selector.store.observable.subscribe((state) => {
      const active = state.accounts.find((account) => account.active)
      setAccountId(active?.accountId ?? null)
    })
    return () => subscription.unsubscribe()
  }, [selector])

  const connect = () => modal.show()

  const disconnect = async () => {
    if (!selector) return
    setIsDisconnecting(true)
    try {
      const wallet = await selector.wallet()
      await wallet.signOut()
      setAccountId(null)
    } finally {
      setIsDisconnecting(false)
    }
  }

  if (!selector || !modal) {
    return null
  }

  if (accountId) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={disconnect}
        disabled={isDisconnecting}
      >
        <LogOut className="h-4 w-4" />
        {isDisconnecting ? "Disconnecting…" : truncateAccount(accountId)}
      </Button>
    )
  }

  return (
    <Button variant="secondary" size="sm" className="gap-2" onClick={connect}>
      <LogIn className="h-4 w-4" />
      Connect NEAR Wallet
    </Button>
  )
}

