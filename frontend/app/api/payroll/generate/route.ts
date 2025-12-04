import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { appendRun } from "@/lib/server/payroll-store";

export const runtime = "nodejs";

const wasmPath = path.resolve(process.cwd(), "public", "zk", "payroll_js", "payroll.wasm");
const zkeyPath = path.resolve(process.cwd(), "public", "zk", "payroll_final.zkey");

type EmployeeInput = {
  employee_id: string;
  net_pay: number;
};

export async function POST(req: NextRequest) {
  try {
    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
      return NextResponse.json(
        { error: "zk artifacts missing. Copy payroll_js/payroll.wasm and payroll_final.zkey into public/zk." },
        { status: 500 },
      )
    }

    const { groth16 } = await import("snarkjs")
    const { employees }: { employees: EmployeeInput[] } = await req.json();
    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: "employees array required" }, { status: 400 });
    }

    const limited = employees.slice(0, 3);
    const padded = [...limited];
    while (padded.length < 3) {
      padded.push({ employee_id: `placeholder_${padded.length}`, net_pay: 0 });
    }

    const totalAmount = padded.reduce((sum, emp) => sum + Number(emp.net_pay || 0), 0);
    const salaries = padded.map((emp) => Math.round(Number(emp.net_pay || 0)));
    const salts = padded.map(() => Number(BigInt("0x" + crypto.randomBytes(4).toString("hex"))));

    const inputs = {
      totalAmount: totalAmount.toString(),
      salaries: salaries.map((s) => s.toString()),
      salts: salts.map((s) => s.toString()),
    };

    const proofResult = await groth16.fullProve(inputs, wasmPath, zkeyPath);
    const publicSignals = proofResult.publicSignals.map((signal: string | number) => signal.toString());
    const payrollRoot = publicSignals[1] || "";

    const runId = `run_${Date.now().toString(36)}`;
    const createdAt = new Date().toISOString();

    appendRun({
      run_id: runId,
      created_at: createdAt,
      declared_total: totalAmount.toFixed(2),
      payroll_root: payrollRoot,
      proof: proofResult.proof,
      public_signals: publicSignals,
      employees: padded,
      status: "generated",
    });

    return NextResponse.json({
      run_id: runId,
      created_at: createdAt,
      total_amount: totalAmount.toFixed(2),
      payroll_root: payrollRoot,
      proof: proofResult.proof,
      public_signals: publicSignals,
      employees: padded,
    });
  } catch (error: any) {
    console.error("Payroll generate failed:", error);
    return NextResponse.json({ error: error.message || "Generate failed" }, { status: 500 });
  }
}

