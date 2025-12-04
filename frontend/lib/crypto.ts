// lib/crypto.ts
import * as utxolibProxy from '@bitgo/utxo-lib';

// --- SAFE IMPORT HELPER ---
// Next.js sometimes wraps CommonJS libs in a 'default' property.
// We unwrap it here to ensure we get the actual library methods.
const utxolib = (utxolibProxy as any).default || utxolibProxy;
// const data = {zcash-testnet-data % docker exec zcash-testnet zcash-cli z_listunifiedreceivers "utest19r6aq2378qhvy3ydrd4v3sfq7f6zyapqq42xycdt7kfnw3lks84hnggdf3ykzwhzgqw2vcwaggcdhtpcxxuz25msx32j7y6tu7ath6vg0fwjl0m6vx28yjk32e0xveep5czy6tq8un3dz7trkkc4aqurs7w5uzlpynvnw0xwgu4xnk56crfpp5m38xme6an5mt59fj5eyg632cc4ge8"
//   {
//     "orchard": "utest1zq3z78j2xez3nvfh24e5xelvl522y5r4ms3lxlqdudsktgwst7ay052v5dnl7xdt4755p35tc85ed8hju35nt8vlhsc9e7r5wc0yt2gx",
//     "sapling": "ztestsapling1lw0kjlwtuyz3433f5qqhal3tlslfcex9yypwckkd0npke9juphuquy6rhmflc64xe6r4gngwt7h",
//     "p2pkh": "tmWjdaHXg1Y8RRsbcPz3qrQ2ToTWefznWA2"
//   }
//   }
// Extract modules from the safe object
const { 
  payments, 
  networks, 
  ECPair, 
  TransactionBuilder, 
  Transaction 
} = utxolib;
// --------------------------

// 1. Define Zcash Testnet Network
// We fallback to manual definition to ensure compatibility if the lib's presets differ.
const ZCASH_TESTNET = {
  messagePrefix: '\x18Zcash Signed Message:\n',
  bech32: 'tm',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  pubKeyHash: 0x1d25, // Produces 'tm' addresses
  scriptHash: 0x1cba,
  wif: 0xef,          // Zcash Testnet WIF
};

export interface ZcashWallet {
  address: string;
  privateKeyWIF: string;
  keyPair: any;
}

// 1. Import from Private Key (WIF)
export function importWalletFromWIF(wif: string): ZcashWallet {
  const cleanWIF = wif.trim();

  try {
    // Debug: Prove the library is loaded
    if (!payments) {
      console.error("DEBUG: utxolib structure:", utxolib); // Log the object to see what's wrong
      throw new Error("Library Loading Error: 'payments' is missing. Check Console.");
    }

    // Import Key
    const keyPair = ECPair.fromWIF(cleanWIF, ZCASH_TESTNET);
    
    // Derive Address
    const { address } = payments.p2pkh({ 
      pubkey: keyPair.publicKey, 
      network: ZCASH_TESTNET 
    });

    if (!address) throw new Error("Could not derive address");

    console.log(`[Success] Imported: ${address}`);

    return {
      address,
      privateKeyWIF: cleanWIF,
      keyPair
    };

  } catch (e: any) {
    console.error("[Import Error]", e);
    if (e.message.includes('Non-base58')) {
      throw new Error("Invalid Key Format: Check for spaces or extra characters.");
    }
    if (e.message.includes('Invalid network')) {
      throw new Error(`Network Mismatch. Ensure key starts with 'c' or '9' (Testnet).`);
    }
    throw new Error(`Import Failed: ${e.message}`);
  }
}

// 2. Create Signed Raw Transaction
export function createRawTransaction(
  wallet: ZcashWallet,
  toAddress: string,
  amountSats: number,
  utxos: any[] 
): string {
  // Use TransactionBuilder
  const txb = new TransactionBuilder(ZCASH_TESTNET);
  
  // Zcash Sapling Version (4)
  txb.setVersion(4); 

  let totalInput = 0;
  
  // Add Inputs
  utxos.forEach((utxo) => {
    txb.addInput(utxo.txid, utxo.vout);
    totalInput += utxo.value; 
  });

  const fee = 10000; // 0.0001 ZEC
  const change = totalInput - amountSats - fee;

  if (change < 0) throw new Error(`Insufficient Funds. Have: ${totalInput}, Need: ${amountSats + fee}`);

  // Add Outputs
  txb.addOutput(toAddress, amountSats); 
  if (change > 546) { // Dust limit
    txb.addOutput(wallet.address, change); 
  }

  // Sign Inputs
  utxos.forEach((utxo, index) => {
    txb.sign(
      index, 
      wallet.keyPair, 
      undefined, 
      Transaction.SIGHASH_ALL, 
      utxo.value 
    );
  });

  return txb.build().toHex();
}