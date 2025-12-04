// workload/run_compute.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const nacl = require("tweetnacl");
const { poseidon } = require("poseidon-lite");
const { rpcCall } = require("../orchestrator/zcash/rpc"); // optional if needed

const INPUT_DIR = process.env.INPUT_DIR || "/inputs";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/outputs";
const CIRCUITS_DIR = path.join(__dirname, "circuits");
const UNWRAP_PRIV_BASE64 = "271d5a99afc22d3337a7b9034d81729b145c768c4f26c4d6d96495ca99109e3f";

function base64ToUint8(s) {
  const bin = Buffer.from(s, "base64");
  return new Uint8Array(bin);
}
function uint8ToHex(u8) {
  return Buffer.from(u8).toString("hex");
}

async function main() {
  console.log("Workload starting. Reading inputs from", INPUT_DIR);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // read manifest file if provided
  let manifestPath = path.join(INPUT_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.warn("No manifest.json in inputs. Attempting to read individual files.");
  } else {
    console.log("Found manifest:", manifestPath);
  }

  // For demo: iterate over files in INPUT_DIR matching *.cipher and *.wrapped
  const files = fs.existsSync(INPUT_DIR) ? fs.readdirSync(INPUT_DIR) : [];
  const cipherFiles = files.filter(f => f.endsWith(".cipher"));
  const results = [];

  // convert private unwrap key to Uint8Array
  const privU8 = UNWRAP_PRIV_BASE64 ? base64ToUint8(UNWRAP_PRIV_BASE64) : null;

  for (const cipherName of cipherFiles) {
    try {
      const base = cipherName.replace(".cipher", "");
      const wrappedName = base + ".wrapped";
      if (!files.includes(wrappedName)) {
        console.warn("No wrapped key for", cipherName);
        continue;
      }
      const ciphertext = fs.readFileSync(path.join(INPUT_DIR, cipherName));
      const wrapped = fs.readFileSync(path.join(INPUT_DIR, wrappedName));

      // unwrap using nacl.box.open (we expect envelope: ephPub(32)|nonce(24)|box)
      const payload = new Uint8Array(wrapped);
      const ephPub = payload.slice(0, 32);
      const nonce = payload.slice(32, 32 + nacl.box.nonceLength);
      const box = payload.slice(32 + nacl.box.nonceLength);
      if (!privU8) throw new Error("UNWRAP_PRIV not provided in env for local runtime");
      const rawKey = nacl.box.open(box, nonce, ephPub, privU8);
      if (!rawKey) throw new Error("unwrapping failed");

      // decrypt AES-GCM: we'll use node's crypto to mimic browser AES-GCM unwrap
      const crypto = require("crypto");
      const iv = ciphertext.slice(0, 12); // if you used that layout; adjust accordingly
      const cipherBody = ciphertext.slice(12);
      const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(rawKey), iv);
      let decrypted = decipher.update(cipherBody);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      // note: for AES-GCM you must handle auth tag — for demo assuming it's included; adjust as needed

      const employeeJson = JSON.parse(decrypted.toString("utf8"));

      // compute commitment: Poseidon of (sha256(ciphertext), salt)
      const sha = crypto.createHash("sha256").update(Buffer.from(ciphertext)).digest();
      const shaBig = BigInt("0x" + sha.toString("hex"));
      // salt: try to read file base+".salt" else use 0
      let salt = BigInt(0);
      const saltPath = path.join(INPUT_DIR, base + ".salt");
      if (fs.existsSync(saltPath)) {
        const s = fs.readFileSync(saltPath);
        salt = BigInt("0x" + s.toString("hex"));
      }

      const commit = poseidon([shaBig, salt]).toString();
      // generate credential nonce
      const credentialNonce = crypto.randomBytes(32);
      // employee_tag = poseidon(credentialNonce)
      const credBig = BigInt("0x" + credentialNonce.toString("hex"));
      const employeeTag = poseidon([credBig]).toString();

      // produce credential blob encrypted for employee; for demo we'll write plaintext into blob.enc
      const credentialBlob = {
        employee_id: employeeJson.employee_id,
        run_id: process.env.RUN_ID || "local",
        credential_nonce: credentialNonce.toString("hex")
      };
      const blobPath = path.join(OUTPUT_DIR, `${employeeJson.employee_id}.credential.json`);
      fs.writeFileSync(blobPath, JSON.stringify(credentialBlob, null, 2), "utf8");

      results.push({
        employee_id: employeeJson.employee_id,
        commitment: commit,
        employee_tag: employeeTag,
        credential_blob: blobPath
      });
    } catch (e) {
      console.error("error processing", cipherName, e);
    }
  }

  // If circuits & zkey & wasm exist, optionally run snarkjs
  try {
    const wasm = path.join(CIRCUITS_DIR, "passport.wasm");
    const zkey = path.join(CIRCUITS_DIR, "passport.zkey");
    if (fs.existsSync(wasm) && fs.existsSync(zkey)) {
      // for demo, create a witness input file with placeholder public inputs
      const witnessInput = path.join(OUTPUT_DIR, "witness_input.json");
      fs.writeFileSync(witnessInput, JSON.stringify({ /* your witness inputs derived from results */ }), "utf8");
      const witnessWtns = path.join(OUTPUT_DIR, "witness.wtns");
      console.log("Generating witness & proof (snarkjs) — this may take time.");
      execSync(`snarkjs wtns calculate ${wasm} ${witnessInput} ${witnessWtns}`, { stdio: "inherit" });
      const proofJson = path.join(OUTPUT_DIR, "proof.json");
      const pubSignals = path.join(OUTPUT_DIR, "publicSignals.json");
      execSync(`snarkjs groth16 prove ${zkey} ${witnessWtns} ${proofJson} ${pubSignals}`, { stdio: "inherit" });
      console.log("proof generated");
    } else {
      console.log("No wasm/zkey in circuits dir — skipping snarkjs");
    }
  } catch (e) {
    console.error("snarkjs step failed:", e);
  }

  // write results summary
  fs.writeFileSync(path.join(OUTPUT_DIR, "results.json"), JSON.stringify(results, null, 2), "utf8");
  // create attestation.json (in real nilCC you will get TEE attestation; here we simulate with signature)
  const attestation = {
    job: process.env.RUN_ID || "local",
    timestamp: new Date().toISOString(),
    proof_hash: "sha256:" + "placeholder",
    signer: { type: "ed25519", key: process.env.ED25519_PUB || "local" }
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "attestation.json"), JSON.stringify(attestation, null, 2), "utf8");
  console.log("Workload finished; outputs at", OUTPUT_DIR);
}

main().catch(err => { console.error(err); process.exit(2); });
