import nacl from "tweetnacl";
import { poseidon1 as poseidon, poseidon1 } from "poseidon-lite";
import { v4 as uuidv4 } from "uuid";

const enc = new TextEncoder();
const dec = new TextDecoder();

export function generateRunId() {
  return `${uuidv4()}-${Date.now()}`;
}

export async function generateAesKey() {
  // AES-256-GCM key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}

export async function exportAesKeyRaw(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return new Uint8Array(raw);
}

export async function importAesKeyRaw(raw: Uint8Array) {
  return crypto.subtle.importKey("raw", raw.buffer as ArrayBuffer, "AES-GCM", true, ["encrypt", "decrypt"]);
}

export async function aesGcmEncrypt(key: CryptoKey, plaintext: string, iv?: Uint8Array) {
  const data = enc.encode(plaintext);
  const usedIv = iv ?? crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: usedIv as any },
    key,
    data
  );
  return { ciphertext: new Uint8Array(cipher), iv: usedIv };
}

export async function aesGcmDecrypt(key: CryptoKey, ciphertext: Uint8Array, iv: Uint8Array) {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as any }, key, ciphertext as any);
  return dec.decode(plain);
}

export function sha256(bytes: any) {
  return crypto.subtle.digest("SHA-256", bytes);
}

export async function sha256Hex(bytes: Uint8Array) {
  const d = await sha256(bytes);
  return bufferToHex(new Uint8Array(d));
}

function bufferToHex(buf: Uint8Array) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function poseidonHashHex(inputs: (bigint | number)[]) {
  // poseidon-lite returns BigInt-like number; convert to hex string
  const out = poseidon1(inputs);
  return out.toString(16);
}

// --- Key wrapping using nacl.box (X25519 + XSalsa20-Poly1305)
// For demo we expect orchestrator public key to be provided as base64 32 bytes (nacl.box.keyPair().publicKey)
export function wrapKeyWithX25519(symKeyRaw: Uint8Array, orchestratorPubBase64: string) {
  const orchestratorPub = base64ToUint8(orchestratorPubBase64);
  // ephemeral keypair
  const eph = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const boxed = nacl.box(symKeyRaw, nonce, orchestratorPub, eph.secretKey);
  // return sealed envelope: eph.publicKey + nonce + boxed (base64)
  const payload = new Uint8Array(eph.publicKey.length + nonce.length + boxed.length);
  payload.set(eph.publicKey, 0);
  payload.set(nonce, eph.publicKey.length);
  payload.set(boxed, eph.publicKey.length + nonce.length);
  return uint8ToBase64(payload);
}

export function unwrapKeyWithX25519(envelopeBase64: string, orchestratorPrivBase64: string) {
  // For server/workload only — here for completeness
  const payload = base64ToUint8(envelopeBase64);
  const pub = payload.slice(0, 32);
  const nonce = payload.slice(32, 32 + nacl.box.nonceLength);
  const boxed = payload.slice(32 + nacl.box.nonceLength);
  const priv = base64ToUint8(orchestratorPrivBase64);
  const opened = nacl.box.open(boxed, nonce, pub, priv);
  if (!opened) throw new Error("unwrapping failed");
  return opened; // Uint8Array symmetric key raw
}

// helpers
export function uint8ToBase64(b: Uint8Array) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < b.length; i += chunk) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + chunk)));
  }
  return btoa(s);
}
export function base64ToUint8(s: string) {
  const bin = atob(s);
  const len = bin.length;
  const u = new Uint8Array(len);
  for (let i = 0; i < len; i++) u[i] = bin.charCodeAt(i);
  return u;
}
