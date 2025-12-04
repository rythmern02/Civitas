import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session";
import { verifyCredentialBlob } from "@/lib/server/employee-store";

interface CredentialPayload {
  ciphertext: string;
  iv: string;
  signature: string;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session: any= await verifySession(token);
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credential }: { credential?: CredentialPayload } = await req.json();
  if (!credential?.ciphertext || !credential?.iv || !credential?.signature) {
    return NextResponse.json({ error: "Invalid credential payload" }, { status: 400 });
  }

  const record = await verifyCredentialBlob(session.employee_tag, credential);
  if (!record || record.employee_id !== session.sub) {
    return NextResponse.json({ error: "Credential does not match account" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}

