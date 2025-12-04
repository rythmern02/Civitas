"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/lib/auth-context"
import { MockStoreProvider } from "@/lib/mock-store"
// Wallet setups
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMeteorWalletApp } from "@near-wallet-selector/meteor-wallet-app";
import { setupHotWallet } from "@near-wallet-selector/hot-wallet";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
// Types
import type { WalletModuleFactory } from "@near-wallet-selector/core";
import { NetworkId } from "@/lib/config"

const walletSelectorConfig = {
  network: NetworkId,
  modules: [
    setupMeteorWallet(),
    // setupMeteorWalletApp({ contractId: HelloNearContract }),
    setupHotWallet(),
    setupNearMobileWallet(),
  ] as WalletModuleFactory[]
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <WalletSelectorProvider config={walletSelectorConfig}>
      <MockStoreProvider>
        <AuthProvider>{children}</AuthProvider>
      </MockStoreProvider>
      </WalletSelectorProvider>
    </ThemeProvider>
  )
}
