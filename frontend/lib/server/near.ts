import { connect, keyStores, KeyPair, utils } from "near-api-js";

const {
  NEAR_NETWORK_ID = "testnet",
  NEAR_NODE_URL = "https://rpc.testnet.near.org",
  NEAR_ACCOUNT_ID,
  NEAR_PRIVATE_KEY,
  NEAR_CONTRACT_ID,
} = process.env;

if (!NEAR_ACCOUNT_ID || !NEAR_PRIVATE_KEY || !NEAR_CONTRACT_ID) {
  console.warn(
    "[NEAR] Missing NEAR_ACCOUNT_ID/NEAR_PRIVATE_KEY/NEAR_CONTRACT_ID env vars. Commit API will be disabled."
  );
}

const keyStore = new keyStores.InMemoryKeyStore();
let accountPromise: ReturnType<typeof initAccount> | null = null;

async function initAccount() {
  if (!NEAR_ACCOUNT_ID || !NEAR_PRIVATE_KEY) {
    throw new Error("NEAR credentials not configured");
  }
  await keyStore.setKey(
    NEAR_NETWORK_ID,
    NEAR_ACCOUNT_ID,
    KeyPair.fromString(NEAR_PRIVATE_KEY)
  );
  const near = await connect({
    networkId: NEAR_NETWORK_ID,
    nodeUrl: NEAR_NODE_URL,
    deps: { keyStore },
  });
  return near.account(NEAR_ACCOUNT_ID);
}

async function getAccount() {
  if (accountPromise) return accountPromise;
  accountPromise = initAccount();
  return accountPromise;
}

export interface CommitParams {
  runId: string;
  payrollRoot: string;
  totalAmount: string;
  proof?: any;
  publicSignals?: string[];
}

export async function commitPayrollOnNear({
  runId,
  payrollRoot,
  totalAmount,
  proof,
  publicSignals,
}: CommitParams) {
  if (!NEAR_CONTRACT_ID) {
    throw new Error("NEAR contract id not configured");
  }
  const account = await getAccount();
  const args: Record<string, unknown> = {
    run_id: runId,
    payroll_root: payrollRoot,
    total_amount: totalAmount,
  };
  if (proof) {
    args.proof = typeof proof === "string" ? proof : JSON.stringify(proof);
  }
  if (publicSignals) {
    args.public_signals = publicSignals.map((s) => s.toString());
  }

  const outcome = await account.functionCall({
    contractId: NEAR_CONTRACT_ID,
    methodName: "commit_payroll",
    args,
    gas: "150000000000000",
  });

  return {
    txHash: outcome.transaction.hash,
    explorer: `https://explorer.${NEAR_NETWORK_ID}.near.org/transactions/${outcome.transaction.hash}`,
    raw: {
      status: outcome.status,
      receipts: outcome.receipts_outcome.map((r) => ({
        id: r.id,
        logs: r.outcome.logs,
      })),
    },
  };
}

