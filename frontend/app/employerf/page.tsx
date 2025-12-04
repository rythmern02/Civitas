// frontend/app/employer/page.tsx
"use client";
import React, { useState } from "react";
import Papa from "papaparse";
import {
  generateRunId,
  generateAesKey,
  exportAesKeyRaw,
  aesGcmEncrypt,
  wrapKeyWithX25519,
  uint8ToBase64,
  sha256Hex,
  poseidonHashHex
} from "../../lib/encryption";

type Row = { employee_id: string; role: string; base_salary: string; bonuses?: string };

export default function EmployerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [manifestUrl, setManifestUrl] = useState<string | null>(null);
  const orchestratorPub = process.env.NEXT_PUBLIC_ORCHESTRATOR_PUB_X25519 || "";

  async function handleUploadCSV() {
    if (!file) return alert("Select CSV first");
    setProgress("Parsing CSV...");
    const text = await file.text();
    const parsed = Papa.parse<Row>(text, { header: true });
    const rows = parsed.data.filter(r => r.employee_id && r.base_salary);
    if (!rows.length) return alert("No rows parsed");

    const runId = generateRunId();
    const inputs: any[] = [];
    let idx = 0;

    for (const r of rows) {
      setProgress(`Encrypting row ${++idx}/${rows.length}`);
      const aesKey = await generateAesKey();
      const rawKey = await exportAesKeyRaw(aesKey);
      const payload = JSON.stringify(r);
      const { ciphertext, iv } = await aesGcmEncrypt(aesKey, payload);
      const proofHash = await sha256Hex(ciphertext);
      // compute simple poseidon commitment over [sha256(ciphertext) as bigint, random salt]
      const salt = crypto.getRandomValues(new Uint8Array(16));
      // convert sha hex to bigint
      const shaBig = BigInt("0x" + proofHash);
      const employeeTag = poseidonHashHex([shaBig, BigInt(Array.from(salt).map(b => b).join(""))]); // simplistic
      // wrap symmetric key with orchestrator pubkey
      const wrapped = wrapKeyWithX25519(rawKey, orchestratorPub);

      // upload artifacts via presigned URL (call /api/upload/presign)
      const fileNameBase = `${runId}/${r.employee_id}`;
      // request presigned URLs
      const presignReq = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          files: [
            { name: `${fileNameBase}.cipher`, contentType: "application/octet-stream" },
            { name: `${fileNameBase}.wrapped`, contentType: "application/octet-stream" }
          ]
        })
      });
      if (!presignReq.ok) throw new Error("Presign failed");
      const presignBody = await presignReq.json();
      const putCipher = await fetch(presignBody.urls[0], { method: "PUT", body: ciphertext });
      if (!putCipher.ok) throw new Error("Upload cipher failed");
      const putWrapped = await fetch(presignBody.urls[1], { method: "PUT", body: wrapped });
      if (!putWrapped.ok) throw new Error("Upload wrapped failed");

      inputs.push({
        employee_id: r.employee_id,
        ciphertext_s3: presignBody.keys[0],
        wrapped_key_s3: presignBody.keys[1],
        iv: uint8ToBase64(iv),
        salt: uint8ToBase64(salt),
        employee_tag: employeeTag
      });
    }

    setProgress("Posting manifest to orchestrator...");
    const manifest = {
      employer_id: "acme_inc",
      run_id: runId,
      created_at: new Date().toISOString(),
      inputs,
      orchestrator_pub: orchestratorPub
    };

    const res = await fetch("/api/employer/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(manifest)
    });
    const body = await res.json();
    if (!res.ok) {
      setProgress(null);
      return alert("Manifest submit failed: " + (body.error || JSON.stringify(body)));
    }
    setProgress(null);
    setManifestUrl(`/jobs/${body.job_id}`); // UI route to view job
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Employer Onboard — Upload CSV</h1>
      <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <br />
      <button onClick={handleUploadCSV} style={{ marginTop: 12 }}>
        Submit CSV
      </button>

      {progress && <p>Progress: {progress}</p>}
      {manifestUrl && (
        <p>
          Job created: <a href={manifestUrl}>{manifestUrl}</a>
        </p>
      )}
    </div>
  );
}
