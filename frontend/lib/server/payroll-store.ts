import fs from "fs";
import path from "path";

const DB_PATH =
  process.env.CIVITAS_PAYROLL_DB ||
  path.resolve(process.cwd(), "..", "orchestrator", "db", "payroll_runs.json");

type RunRecord = {
  run_id: string;
  created_at: string;
  declared_total: string;
  payroll_root: string;
  proof: Record<string, unknown>;
  public_signals: string[];
  employees: Array<{
    employee_id: string;
    net_pay: number;
  }>;
  status: "generated" | "committed";
  tx_hash?: string;
};

type StoreShape = {
  version: number;
  runs: RunRecord[];
};

function ensureStore(): StoreShape {
  if (!fs.existsSync(DB_PATH)) {
    const seed: StoreShape = { version: 1, runs: [] };
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (!data.runs) data.runs = [];
  return data;
}

function writeStore(store: StoreShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function appendRun(run: RunRecord) {
  const store = ensureStore();
  store.runs.push(run);
  writeStore(store);
}

export function updateRun(runId: string, updates: Partial<RunRecord>) {
  const store = ensureStore();
  const idx = store.runs.findIndex((r) => r.run_id === runId);
  if (idx === -1) return null;
  store.runs[idx] = { ...store.runs[idx], ...updates };
  writeStore(store);
  return store.runs[idx];
}

export function listRuns() {
  const store = ensureStore();
  return store.runs;
}

export function getRun(runId: string) {
  const store = ensureStore();
  return store.runs.find((r) => r.run_id === runId) || null;
}

