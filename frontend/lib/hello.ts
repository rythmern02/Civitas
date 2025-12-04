// test-bootnode.ts
import { SecretVaultBuilderClient } from '@nillion/secretvaults';
import { Keypair } from '@nillion/nuc';

async function testBootnode() {
  try {
    const userKeyHex = process.env.NILLION_USER_KEY!; // Your wallet private key
    if (!userKeyHex) throw new Error('Set NILLION_USER_KEY in .env');

    const keypair:any = Keypair.from(userKeyHex);

    const client:any = await SecretVaultBuilderClient.from({
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