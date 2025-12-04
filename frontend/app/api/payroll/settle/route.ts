import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  updateEmployeeVoucher,
} from "@/lib/server/employee-store";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session";
import { zcashRpc } from "@/lib/zcash";

export const runtime = "nodejs";

const sender = process.env.ZCASH_SENDER_SHIELDED!;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session || (session.role !== "employer" && session.role !== "auditor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      employee_id,
      voucher_id,
      recipient_shielded_address,
      amount,
      memo,
    } = await req.json();

    const address = recipient_shielded_address?.trim();
    const isShielded = address?.startsWith("zs") || address?.startsWith("ztestsapling");
    if (!employee_id || !voucher_id || !isShielded) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const sendAmount = Number(amount) || 0.01;
    const memoText = memo || `Voucher ${voucher_id}`;

    const txid = await zcashRpc.sendShielded(
      sender,
      recipient_shielded_address,
      sendAmount,
      memoText,
      `voucher:${voucher_id}`
    );

    updateEmployeeVoucher(employee_id, voucher_id, {
      status: "redeemed",
      settlement_txid: txid,
    });

    return NextResponse.json({
      success: true,
      txid,
      explorer: `https://explorer.testnet.zcash.com/transactions/${txid}`,
    });
  } catch (error: any) {
    console.error("Payroll settle failed:", error);
    return NextResponse.json(
      { error: error.message || "Settlement failed" },
      { status: 500 }
    );
  }
}

