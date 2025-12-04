import { NextRequest, NextResponse } from "next/server";
import { verifyPayrollProof } from "@/lib/server/zk-payroll";
import { commitPayrollOnNear } from "@/lib/server/near";
import verificationKey from "@/zk/verification_key.json";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const {
      run_id,
      total_amount,
      payroll_root,
      proof,
      public_signals,
    } = await req.json();

    if (!run_id || !total_amount || !proof || !public_signals) {
      return NextResponse.json(
        { error: "run_id, total_amount, proof, public_signals required" },
        { status: 400 }
      );
    }

    console.log("[PayrollCommit] Received request", { run_id, total_amount });

    const isValid = await verifyPayrollProof(verificationKey, public_signals, proof);
    if (!isValid) {
      console.warn("[PayrollCommit] Proof verification failed", run_id);
      return NextResponse.json(
        { error: "Invalid payroll proof" },
        { status: 422 }
      );
    }

    const root = payroll_root || (public_signals[1] ? public_signals[1].toString() : "");
    console.log("[PayrollCommit] Root", root);
    if (!root) {
      console.error("[PayrollCommit] Root missing", { run_id, public_signals });
      return NextResponse.json(
        { error: "payroll_root missing and public_signals[1] not provided" },
        { status: 400 }
      );
    }

    console.log("[PayrollCommit] Proof verified. Committing run", run_id);
    const commitResult = await commitPayrollOnNear({
      runId: run_id,
      payrollRoot: root,
      totalAmount: total_amount.toString(),
      proof,
      publicSignals: public_signals,
    });
    console.log("[PayrollCommit] NEAR tx hash", commitResult.txHash);

    return NextResponse.json({
      success: true,
      txHash: commitResult.txHash,
      explorer: commitResult.explorer,
      receipts: commitResult.raw.receipts,
    });
  } catch (error: any) {
    console.error("NEAR commit failed:", error);
    return NextResponse.json(
      { error: error.message || "Commit failed" },
      { status: 500 }
    );
  }
}

