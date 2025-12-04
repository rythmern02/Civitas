import bcrypt from "bcryptjs";
import { poseidon1 } from "poseidon-lite";
import { randomBytes, webcrypto, createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";

const identityStore = require("../../../orchestrator/identity.js");

const subtle = webcrypto?.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface EmployeeSeed {
  employee_id?: string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  wallet_address?: string;
  salary?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  password?: string;
  credential_nonce?: string;
  employee_tag?: string;
}

export interface EmployeeRecord {
  employee_id: string;
  username: string;
  username_normalized: string;
  password_hash: string;
  employee_tag: string;
  credential_nonce: string;
  zkpass_credential: EncryptedCredential;
  org_id: string;
  vouchers: VoucherRecord[];
  role: string;
  credential_vouchers?: CredentialVoucher[];
  profile?: {
    name?: string;
    email?: string;
    role?: string;
    wallet_address?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface VoucherRecord {
  voucher_id: string;
  amount: number;
  currency: string;
  run_id?: string;
  status: "issued" | "redeemed" | "settled";
  memo?: string;
  issued_at: string;
  updated_at?: string;
  settlement_txid?: string;
}

export interface EncryptedCredential {
  ciphertext: string;
  iv: string;
  signature: string;
}

export interface ProvisionedEmployee {
  employee_id: string;
  username: string;
  temporary_password: string;
  employee_tag: string;
  credential_secret: string;
  credential_file: EncryptedCredential & { employee_id: string; employee_tag: string };
}

export interface CredentialVoucher {
  token_hash: string;
  created_at: string;
  expires_at: string;
  status: "active" | "consumed";
  downloaded_at?: string;
}

function hexFromBytes(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("hex");
}

function bytesFromHex(hex: string) {
  return Uint8Array.from(Buffer.from(hex, "hex"));
}

function base64FromBytes(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

async function deriveAesKeyFromNonce(nonceHex: string) {
  if (!subtle) {
    throw new Error("AES not available in this runtime");
  }
  const keyData = bytesFromHex(nonceHex.padStart(64, "0"));
  return subtle.importKey("raw", keyData, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptCredentialPayload(
  payload: Record<string, unknown>,
  nonceHex: string
): Promise<EncryptedCredential> {
  const key = await deriveAesKeyFromNonce(nonceHex);
  const iv = randomBytes(12);
  const plaintext = encoder.encode(JSON.stringify(payload));
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );
  const cipherBytes = new Uint8Array(ciphertext);
  const signature = base64FromBytes(
    encoder.encode(
      hexFromBytes(cipherBytes) + ":" + nonceHex.toLowerCase()
    )
  );
  return {
    ciphertext: base64FromBytes(cipherBytes),
    iv: base64FromBytes(iv),
    signature,
  };
}

export function randomPassword(length = 12) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!";
  const bytes = randomBytes(length);
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += alphabet[bytes[i] % alphabet.length];
  }
  return pwd;
}

function normalizeUsername(username?: string) {
  if (!username) return "";
  return username.trim().toLowerCase();
}

function deriveEmployeeTag(nonceHex: string) {
  const asBigInt = BigInt("0x" + nonceHex);
  return poseidon1([asBigInt]).toString(16);
}

function nowIso() {
  return new Date().toISOString();
}

export async function provisionEmployeesFromSeeds(
  seeds: EmployeeSeed[],
  orgId: string,
  runId?: string
): Promise<{ records: EmployeeRecord[]; provisioning: ProvisionedEmployee[] }> {
  if (!Array.isArray(seeds) || seeds.length === 0) {
    throw new Error("No employees supplied");
  }

  const records: EmployeeRecord[] = [];
  const provisioning: ProvisionedEmployee[] = [];

  for (const seed of seeds) {
    const employeeId = seed.employee_id || uuidv4();
    const username =
      seed.username ||
      (seed.email ? seed.email.split("@")[0] : `employee_${employeeId.slice(0, 8)}`);
    const normalized = normalizeUsername(username);
    const password = seed.password || randomPassword();
    const passwordHash = bcrypt.hashSync(password, 10);
    const credentialNonce =
      seed.credential_nonce || hexFromBytes(randomBytes(32));
    const employeeTag =
      seed.employee_tag || deriveEmployeeTag(credentialNonce);
    const createdAt = nowIso();

    const credentialPayload = {
      employee_id: employeeId,
      username,
      employee_tag: employeeTag,
      org_id: orgId,
      issued_at: createdAt,
    };
    const credentialBlob = await encryptCredentialPayload(
      credentialPayload,
      credentialNonce
    );

    const voucher: VoucherRecord = {
      voucher_id: `voucher_${uuidv4()}`,
      amount: seed.salary ?? 0,
      currency: seed.currency ?? "ZEC",
      run_id: runId,
      status: "issued",
      memo: `Payroll allocation for ${username}`,
      issued_at: createdAt,
    };

    records.push({
      employee_id: employeeId,
      username,
      username_normalized: normalized,
      password_hash: passwordHash,
      employee_tag: employeeTag,
      credential_nonce: credentialNonce,
      zkpass_credential: credentialBlob,
      org_id: orgId,
      vouchers: [voucher],
      credential_vouchers: [],
      role: seed.role || "employee",
      profile: {
        name: seed.name,
        email: seed.email,
        role: seed.role || "employee",
        wallet_address: seed.wallet_address,
      },
      created_at: createdAt,
      updated_at: createdAt,
    });

    provisioning.push({
      employee_id: employeeId,
      username,
      temporary_password: password,
      employee_tag: employeeTag,
      credential_secret: credentialNonce,
      credential_file: { ...credentialBlob, employee_id: employeeId, employee_tag: employeeTag },
    });
  }

  identityStore.upsertEmployees(records);
  return { records, provisioning };
}

export async function verifyPasswordLogin(
  username: string,
  password: string
) {
  const record = identityStore.getEmployeeByUsername(username);
  if (!record) return null;

  const ok = bcrypt.compareSync(password, record.password_hash);
  if (!ok) return null;
  return record;
}

export function getEmployeeByTag(tag: string) {
  if (!tag) return null;
  return identityStore.getEmployeeByTag(tag);
}

export function listEmployeeVouchers(employeeId: string): VoucherRecord[] {
  const record = identityStore.getEmployeeById(employeeId);
  return record?.vouchers ?? [];
}

export function updateEmployeeVoucher(
  employeeId: string,
  voucherId: string,
  updates: Partial<VoucherRecord>
) {
  return identityStore.updateVoucher(employeeId, voucherId, updates);
}

export function getEmployeeProfile(employeeId: string): EmployeeRecord | null {
  return identityStore.getEmployeeById(employeeId);
}

export function listAllEmployees(): EmployeeRecord[] {
  return identityStore.listEmployees();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createCredentialVoucher(employeeId: string, ttlMs = 7 * 24 * 60 * 60 * 1000) {
  const store = identityStore.readStore();
  const employee = store.employees.find((emp: EmployeeRecord) => emp.employee_id === employeeId);
  if (!employee) throw new Error("Employee not found");

  const token = randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);
  const now = new Date();

  const voucher: CredentialVoucher = {
    token_hash: tokenHash,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    status: "active",
  };

  employee.credential_vouchers = employee.credential_vouchers || [];
  employee.credential_vouchers.push(voucher);
  employee.updated_at = nowIso();

  identityStore.writeStore(store);
  return { token, expires_at: voucher.expires_at };
}

export function redeemCredentialVoucher(token: string) {
  const tokenHash = hashToken(token);
  const store = identityStore.readStore();

  for (const employee of store.employees as EmployeeRecord[]) {
    const vouchers = employee.credential_vouchers || [];
    const target = vouchers.find(
      (v) =>
        v.token_hash === tokenHash &&
        v.status === "active" &&
        new Date(v.expires_at).getTime() > Date.now()
    );
    if (target) {
      target.status = "consumed";
      target.downloaded_at = nowIso();
      employee.updated_at = target.downloaded_at;
      identityStore.writeStore(store);
      return {
        employee,
        credential: employee.zkpass_credential,
        voucher: target,
      };
    }
  }
  return null;
}

export async function verifyCredentialBlob(
  employeeTag: string,
  blob: EncryptedCredential
) {
  const employee = identityStore.getEmployeeByTag(employeeTag);
  if (!employee) return null;

  const stored = employee.zkpass_credential;
  if (
    stored.ciphertext !== blob.ciphertext ||
    stored.iv !== blob.iv ||
    stored.signature !== blob.signature
  ) {
    return null;
  }
  return employee;
}

export function sanitizeEmployee(record: EmployeeRecord) {
  if (!record) return null;
  const { password_hash, credential_nonce, zkpass_credential, ...rest } = record;
  return rest;
}

const DEMO_SEEDS: EmployeeSeed[] = [
  {
    username: "employer_demo",
    name: "Demo Employer",
    email: "employer@demo.civ",
    role: "employer",
    salary: 0,
    currency: "ZEC",
    password: "demo123!",
  },
  {
    username: "employee_priya",
    name: "Priya Sharma",
    email: "employee@demo.civ",
    role: "employee",
    salary: 1200,
    currency: "ZEC",
    password: "demo123!",
  },
  {
    username: "auditor_karthik",
    name: "Karthik Rao",
    email: "auditor@demo.civ",
    role: "auditor",
    salary: 0,
    currency: "ZEC",
    password: "demo123!",
  },
];

let demoSeedPromise: Promise<void> | null = null;

export function ensureDemoEmployees() {
  if (process.env.ENABLE_DEMO_EMPLOYEES === "false") {
    return Promise.resolve();
  }
  if (demoSeedPromise) return demoSeedPromise;
  demoSeedPromise = (async () => {
    const existing = identityStore.listEmployees();
    if (existing.length > 0) return;
    await provisionEmployeesFromSeeds(DEMO_SEEDS, "demo_org", "demo_run");
  })();
  return demoSeedPromise;
}

