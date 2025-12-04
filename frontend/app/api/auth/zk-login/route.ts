import { NextRequest, NextResponse } from "next/server";
import { poseidon1 } from "poseidon-lite";
import {
  getEmployeeByTag,
  sanitizeEmployee,
  verifyCredentialBlob,
  ensureDemoEmployees,
} from "@/lib/server/employee-store";
import { buildSessionCookie, signSession } from "@/lib/server/session";

export const runtime = "nodejs";

function deriveTagFromNonce(nonceHex: string) {
  return poseidon1([BigInt("0x" + nonceHex)]).toString(16);
}

export async function POST(req: NextRequest) {
  try {
    await ensureDemoEmployees();
    const body = await req.json();
    const method = body.method || "tag";
    let employee = null;

    if (method === "tag") {
      const { employee_tag, proof } = body;
      if (!employee_tag || !proof?.nonce) {
        return NextResponse.json({ error: "invalid proof payload" }, { status: 400 });
      }
      const candidate = getEmployeeByTag(employee_tag);
      if (!candidate) {
        return NextResponse.json({ error: "identity not found" }, { status: 404 });
      }

      const derived = deriveTagFromNonce(proof.nonce);
      if (derived !== candidate.employee_tag) {
        return NextResponse.json({ error: "proof mismatch" }, { status: 401 });
      }
      employee = candidate;
    } else if (method === "credential") {
      const { credential, employee_tag } = body;
      if (!credential || !employee_tag) {
        return NextResponse.json({ error: "credential payload missing" }, { status: 400 });
      }
      const verified = await verifyCredentialBlob(employee_tag, credential);
      if (!verified) {
        return NextResponse.json({ error: "credential verification failed" }, { status: 401 });
      }
      employee = verified;
    } else {
      return NextResponse.json({ error: "unsupported method" }, { status: 400 });
    }

    const token = await signSession({
      sub: employee.employee_id,
      username: employee.username,
      role: employee.role || "employee",
      employee_tag: employee.employee_tag,
    });
    const response = NextResponse.json({
      success: true,
      employee: sanitizeEmployee(employee),
    });
    const cookie = buildSessionCookie(token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;
  } catch (error: any) {
    console.error("zk-login error:", error);
    return NextResponse.json(
      { error: error.message || "zk login failed" },
      { status: 500 }
    );
  }
}

