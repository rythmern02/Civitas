import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { zcashRpc } from "@/lib/zcash";
import {
  listEmployeeVouchers,
  updateEmployeeVoucher,
  verifyCredentialBlob,
} from "@/lib/server/employee-store";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session";

export const runtime = "nodejs";

const sender = process.env.ZCASH_SENDER_SHIELDED!;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const {
      voucher_id,
      recipient_shielded_address,
      memo,
      credential,
    } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: "credential bundle required" }, { status: 400 })
    }

    const record = await verifyCredentialBlob(session.employee_tag, credential)
    if (!record || record.employee_id !== session.sub) {
      return NextResponse.json({ error: "invalid credential bundle" }, { status: 403 })
    }

    const vouchers = listEmployeeVouchers(session.sub);
    const voucher = vouchers.find((v) => v.voucher_id === voucher_id);

    if (!voucher) {
      return NextResponse.json({ error: "voucher not found" }, { status: 404 });
    }
    if (voucher.status !== "issued") {
      return NextResponse.json({ error: `voucher already ${voucher.status}` }, { status: 400 });
    }

    const address = recipient_shielded_address?.trim();
    const isShielded = address?.startsWith("zs") || address?.startsWith("ztestsapling");
    if (!isShielded) {
      return NextResponse.json({ error: "invalid shielded address" }, { status: 400 });
    }

    const amount = voucher.amount || 0.01;
    const memoText = memo || `Voucher ${voucher.voucher_id}`;
    const txid = await zcashRpc.sendShielded(
      sender,
      recipient_shielded_address,
      amount,
      memoText,
      `voucher:${voucher.voucher_id}`
    );

    updateEmployeeVoucher(session.sub, voucher.voucher_id, {
      status: "redeemed",
      settlement_txid: txid,
    });

    return NextResponse.json({
      success: true,
      txid,
      explorer: `https://explorer.testnet.zcash.com/transactions/${txid}`,
    });
  } catch (error: any) {
    console.error("redeem error:", error);
    return NextResponse.json(
      { error: error.message || "Settlement failed" },
      { status: 500 }
    );
  }
}

