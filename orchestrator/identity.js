const fs = require("fs");
const path = require("path");

function resolveDbPath() {
  if (process.env.CIVITAS_EMPLOYEE_DB) {
    return process.env.CIVITAS_EMPLOYEE_DB;
  }

  const candidateDirs = [
    path.resolve(process.cwd(), "..", "orchestrator", "db"),
    path.resolve(process.cwd(), "orchestrator", "db"),
    path.resolve(__dirname, "db"),
    path.resolve(process.cwd(), ".data", "orchestrator"),
    path.resolve(process.env.TMPDIR || "/tmp", "civitas"),
  ];

  for (const dir of candidateDirs) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, "employees.json");
    } catch (err) {
      // try next directory
    }
  }

  throw new Error(
    "Unable to create employee DB directory. Set CIVITAS_EMPLOYEE_DB to a writable path."
  );
}

const DB_PATH = resolveDbPath();

function ensureStore() {
  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH);
    fs.mkdirSync(dir, { recursive: true });
    const seed = { version: 1, employers: [], employees: [], auditors: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf8");
    return seed;
  }
  return null;
}

function readStore() {
  const seeded = ensureStore();
  if (seeded) return seeded;

  const raw = fs.readFileSync(DB_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.employees) parsed.employees = [];
    if (!parsed.employers) parsed.employers = [];
    if (!parsed.auditors) parsed.auditors = [];
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse employee db: ${err.message}`);
  }
}

function writeStore(store) {
  store.version = store.version || 1;
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf8");
}

function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

function listEmployees() {
  const store = readStore();
  return store.employees;
}

function getEmployeeById(employeeId) {
  const store = readStore();
  return store.employees.find((emp) => emp.employee_id === employeeId) || null;
}

function getEmployeeByUsername(username) {
  const store = readStore();
  return (
    store.employees.find(
      (emp) => emp.username_normalized === normalizeUsername(username)
    ) || null
  );
}

function getEmployeeByTag(employeeTag) {
  const store = readStore();
  return (
    store.employees.find((emp) => emp.employee_tag === employeeTag) || null
  );
}

function upsertEmployees(records) {
  if (!Array.isArray(records) || !records.length) {
    return [];
  }

  const store = readStore();
  const now = new Date().toISOString();
  const persisted = [];

  for (const record of records) {
    if (!record.employee_id) {
      throw new Error("employee_id is required");
    }
    if (!record.username) {
      throw new Error("username is required");
    }
    const normalized = normalizeUsername(record.username);
    const baseRecord = {
      vouchers: [],
      role: "employee",
      created_at: now,
      updated_at: now,
      ...record,
      username_normalized: normalized,
    };

    const existingIdx = store.employees.findIndex(
      (emp) => emp.employee_id === record.employee_id
    );

    if (existingIdx >= 0) {
      store.employees[existingIdx] = {
        ...store.employees[existingIdx],
        ...baseRecord,
        updated_at: now,
      };
      persisted.push(store.employees[existingIdx]);
    } else {
      store.employees.push(baseRecord);
      persisted.push(baseRecord);
    }
  }

  writeStore(store);
  return persisted;
}

function appendVouchers(employeeId, vouchers) {
  if (!Array.isArray(vouchers) || vouchers.length === 0) return [];

  const store = readStore();
  const employee = store.employees.find(
    (emp) => emp.employee_id === employeeId
  );
  if (!employee) throw new Error("Employee not found");

  employee.vouchers = employee.vouchers || [];
  for (const voucher of vouchers) {
    const existing = employee.vouchers.find(
      (item) => item.voucher_id === voucher.voucher_id
    );
    if (existing) continue;
    employee.vouchers.push({
      status: "issued",
      issued_at: new Date().toISOString(),
      ...voucher,
    });
  }

  employee.updated_at = new Date().toISOString();
  writeStore(store);
  return employee.vouchers;
}

function updateVoucher(employeeId, voucherId, updates) {
  const store = readStore();
  const employee = store.employees.find(
    (emp) => emp.employee_id === employeeId
  );
  if (!employee) throw new Error("Employee not found");

  employee.vouchers = employee.vouchers || [];
  const voucher = employee.vouchers.find(
    (item) => item.voucher_id === voucherId
  );
  if (!voucher) throw new Error("Voucher not found");

  Object.assign(voucher, updates, { updated_at: new Date().toISOString() });
  employee.updated_at = new Date().toISOString();
  writeStore(store);
  return voucher;
}

module.exports = {
  DB_PATH,
  readStore,
  writeStore,
  listEmployees,
  getEmployeeById,
  getEmployeeByUsername,
  getEmployeeByTag,
  upsertEmployees,
  appendVouchers,
  updateVoucher,
};

