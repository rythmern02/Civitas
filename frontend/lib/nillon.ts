// utils/nillion.ts
import { SecretVaultBuilderClient } from "@nillion/secretvaults";
import { Keypair } from "@nillion/nuc";

// Your .env key
const PRIVATE_KEY = process.env.NEXT_PUBLIC_NILLION_ORG_SECRET_KEY as string;

// Define the Schema for our Payroll Vault
// We store the encrypted AES key and the Encrypted Data.
// Note: We use "text" for ciphertext to avoid schema complexity, 
// but we mark 'decryption_key' as a secret to leverage Nillion's MPC splitting.
const PAYROLL_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ZK Payroll Row",
  type: "array",
  items: {
    type: "object",
    properties: {
      _id: { type: "string", format: "uuid" },
      // The AES key used to encrypt the local data. 
      // We store this as a SECRET share in Nillion.
      decryption_key: {
        type: "object",
        properties: { "%share": { type: "string" } }, // Secret Shared
      },
      // The actual encrypted payroll data (AES ciphertext)
      // Stored as regular text in the vault (since it's already encrypted)
      encrypted_payload: { type: "string" },
      iv: { type: "string" },
      // Public reference tags
      employee_tag: { type: "string" },
      org_id: { type: "string" },
    },
    required: ["_id", "decryption_key", "encrypted_payload", "iv", "employee_tag"],
  },
};

export async function initializeNillionClient() {
  if (!PRIVATE_KEY) throw new Error("Missing Nillion Private Key");
  
  const keypair = Keypair.from(PRIVATE_KEY);
  
  // Initialize the client (connects to Testnet by default)
  const client = await SecretVaultBuilderClient.from({
    keypair,
    // Default config uses Nillion Testnet/Sandbox urls
  });

  return client;
}

export async function createPayrollCollection(client: SecretVaultBuilderClient, runId: string) {
  // 1. Create a new collection for this specific payroll run
  const collectionName = `zkPayroll_Run_${runId}`;
  
  const newCollection = await client.createCollection({
    name: collectionName,
    schema: PAYROLL_SCHEMA,
    type: "owned", // Builder-owned, but we will grant access to NilCC later
  });

  return newCollection.id; // The Collection ID
}

export async function uploadEncryptedRow(
  client: SecretVaultBuilderClient,
  collectionId: string,
  payload: {
    keyBase64: string;
    ciphertext: string;
    iv: string;
    employeeTag: string;
    orgId: string;
  }
) {
  // Write to the vault
  // Nillion automatically splits the fields marked with %share (decryption_key)
  const result = await client.writeToCollection({
    collectionId,
    data: [
      {
        decryption_key: { "%share": payload.keyBase64 }, // This gets secret shared!
        encrypted_payload: payload.ciphertext,
        iv: payload.iv,
        employee_tag: payload.employeeTag,
        org_id: payload.orgId,
      },
    ],
  });

  return result.createdIds[0]; // Return the Document ID
}