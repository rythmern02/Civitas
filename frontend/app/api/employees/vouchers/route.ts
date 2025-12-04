import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listEmployeeVouchers } from "@/lib/server/employee-store";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const vouchers = listEmployeeVouchers(session.sub);
  return NextResponse.json({ vouchers });
}

