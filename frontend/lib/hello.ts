// test-bootnode.ts
import { SecretVaultBuilderClient } from '@nillion/secretvaults';
import { Keypair } from '@nillion/nuc';

async function testBootnode() {
  try {
    const userKeyHex = process.env.NILLION_USER_KEY!; // Your wallet private key
    if (!userKeyHex) throw new Error('Set NILLION_USER_KEY in .env');

    const keypair = Keypair.fromSecretKey(userKeyHex);

    const client = await SecretVaultBuilderClient.create({
      clusterId: process.env.NEXT_PUBLIC_NILLION_CLUSTER_ID || 'testnet', // e.g., 'testnet'
      bootnodes: ['wss://testnet-bootnode.nillion.network'], // Your URL
      keypair,
    });

    console.log('✅ Bootnode LIVE: Client initialized successfully!');
    console.log('Network status:', await client.getNetworkStatus ? 'Connected' : 'Basic connect OK'); // Optional: Check if method exists

    // Clean up
    await client.close();
  } catch (error: any) {
    console.error('❌ Bootnode DOWN:', error.message);
    if (error.message.includes('WebSocket')) {
      console.log('💡 Tip: Check firewall/VPN or try mainnet bootnode: wss://bootnode.nillion.network');
    }
  }
}

testBootnode();