import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { Keypair } from '@nillion/nuc';
import { SecretVaultBuilderClient } from '@nillion/secretvaults';

const NILLION_API_KEY = "271d5a99afc22d3337a7b9034d81729b145c768c4f26c4d6d96495ca99109e3f";

export async function POST(request: Request) {
  try {
    // We only extract runId/orgId as we are only creating the collection now
    const { runId, orgId } = await request.json();

    if (!runId || !orgId) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: runId and orgId are required" },
        { status: 400 }
      );
    }

    // 1. Initialize Builder Client
    const builder:any = await SecretVaultBuilderClient.from({
      keypair: Keypair.from(NILLION_API_KEY),
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

    // 2. Subscription Check (Maintains wallet access)
    console.log("Checking subscription...");
    try {
        await builder.subscribe();
    } catch (e: any) {
        // Ignore "already subscribed" errors
        if (!e?.message?.includes("already")) {
             console.log("⚠️ Subscription check:", e?.message);
        }
    }

    // 3. Refresh token
    await builder.refreshRootToken();

    // 4. Register builder profile (idempotent — safe to run every time)
    // This is required for 'standard' collections
    try {
      await builder.readProfile();
    } catch {
      const did: any = Keypair.from(NILLION_API_KEY).toDid().toString();
      await builder.register({
        did,
        name: "zkPayroll Builder",
      });
      console.log("Builder profile registered");
    }

    // 5. Create Collection with FIXED SCHEMA
    const collectionId = randomUUID();
    const collectionName = `zkPayroll_Run_${runId}`;

    console.log(`Creating collection: ${collectionName}`);

    await builder.createCollection({
      _id: collectionId,
      type: 'standard',  // Builder-controlled private data
      name: collectionName,
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            decryption_key: {              // ← FIXED: Primitive field with %allot marker
              type: "string",               // Nillion encrypts this automatically
            },
            encrypted_payload: { type: "string" },
            iv: { type: "string" },
            employee_tag: { type: "string" },
            org_id: { type: "string" },
          },
          required: ["_id", "decryption_key", "encrypted_payload", "iv", "employee_tag", "org_id"],
        },
      },
    });

    console.log("Collection created:", collectionId);

    // 6. Return Success (No Data Upload)
    return NextResponse.json({
      success: true,
      data: {
        run_id: runId,
        collection_id: collectionId,
        name: collectionName
      },
    });

  } catch (error: any) {
    console.error("Collection creation failed:", error);

    if (Array.isArray(error)) {
      error.forEach((e: any, i: number) => {
        const nodeId = e.node;
        const msg = e.error?.message || e;
        const body = e.error?.body;
        console.error(`Node ${i} (${nodeId}): ${msg}`);
        if (body) {
          console.error('Body details:', JSON.stringify(body, null, 2));
        }
      });
    } else {
      console.error('Single error:', error.message);
    }

    return NextResponse.json(
      { success: false, error: error.message || "Collection creation failed" },
      { status: 500 }
    );
  }
}