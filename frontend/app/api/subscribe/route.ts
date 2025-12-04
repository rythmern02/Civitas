import { NextResponse } from 'next/server';
import { Keypair } from '@nillion/nuc';
import { SecretVaultBuilderClient } from '@nillion/secretvaults';

// Ideally, move this to process.env.NILLION_API_KEY
const NILLION_API_KEY = "271d5a99afc22d3337a7b9034d81729b145c768c4f26c4d6d96495ca99109e3f"; //kelpr
export async function GET() {
  try {
    if (!NILLION_API_KEY) {
      return NextResponse.json({ error: "Server missing API Key" }, { status: 500 });
    }

    // 1. Initialize Keypair
    const keypair = Keypair.from(NILLION_API_KEY);
    
    // 2. Get Address for Funding (From DID)
    // The address is the last part of the DID string usually, or you can use the DID itself for some explorers
    const did = keypair.toDidString();
    console.log("---------------------------------------------------");
    console.log("🔑 WALLET IDENTITY", keypair);
    console.log("DID:", did);
    
    // Nillion addresses (nillion1...) can often be extracted or used from the DID
    // If you need to fund it, use the Nillion Faucet with this DID/Address.
    console.log("---------------------------------------------------");

    // 3. Init Client
    const builder = await SecretVaultBuilderClient.from({
      keypair,
      urls: {
        chain: 'http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz',
        auth: 'https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz',
        dbs: [
          'https://nildb-stg-n1.nillion.network',
          'https://nildb-stg-n2.nillion.network',
          'https://nildb-stg-n3.nillion.network',
        ],
      },
      blindfold: { operation: 'store' },
    });

    // 4. SUBSCRIBE (The Fix)
    // This performs the on-chain transaction to register the user
    console.log("📝 Checking subscription status...");
    
    try {
      // Attempt to subscribe. This costs gas/tokens.
      // If already subscribed, this might throw or return indicating so.
      const txHash = await builder.subscriptionStatus();
      console.log("✅ Subscription transaction sent! Hash:", txHash);
    } catch (subError: any) {
      // Handle case where already subscribed to avoid breaking the flow
      if (subError.message && subError.message.includes("already")) {
        console.log("ℹ️ Wallet is already subscribed.");
      } else {
        console.error("⚠️ Subscription attempt failed:", subError.message);
        // We don't return here immediately, we try to see if we can proceed, 
        // but usually, this means "Insufficient Funds" or actual network error.
        throw new Error(`Failed to subscribe: ${subError.message} (Ensure wallet is funded)`);
      }
    }

    // 5. Refresh Token
    console.log("🔄 Attempting to refresh root token...");
    await builder.refreshRootToken();
    console.log("✅ Root token refreshed successfully!");

    return NextResponse.json({
      success: true,
      did: did,
      message: "Wallet is subscribed and ready!"
    });

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      instruction: "Ensure your wallet is funded using the DID printed in logs."
    }, { status: 500 });
  }
}