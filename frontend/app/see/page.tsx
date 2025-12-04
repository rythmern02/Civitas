// "use client";

// import React, { useState } from "react";
// import Papa from "papaparse";
// import { Upload, ShieldCheck, FileJson, Loader2, CheckCircle, Zap } from "lucide-react";
// // Import the crypto helpers from the previous answer
// import { 
//   generateAESKey, 
//   exportKeyToBase64, 
//   encryptRow, 
//   generateCommitment, 
//   generateCredentialNonce, 
//   generateEmployeeTag 
// } from "../../lib/crypto";

// export default function EmployerOnboarding() {
//   const [file, setFile] = useState<File | null>(null);
//   const [status, setStatus] = useState<string>("idle");
//   const [logs, setLogs] = useState<string[]>([]);
//   const [manifest, setManifest] = useState<any | null>(null);
  
//   // NEW: State for subscription handling
//   const [subscribing, setSubscribing] = useState(false);
//   const [subMsg, setSubMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

//   const addLog = (msg: string) => setLogs((prev) => [...prev, `> ${msg}`]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
//   };

//   // NEW: Handler for the Subscribe Button
//   const handleSubscribe = async () => {
//     setSubscribing(true);
//     setSubMsg(null);
//     try {
//       // Calls the debug route we created in step 2
//       const res = await fetch("/api/subscribe"); 
//       const data = await res.json();
      
//       if (data.success) {
//         setSubMsg({ type: 'success', text: "✅ Wallet is subscribed & ready!" });
//       } else {
//         // Show the address if funding is needed
//         setSubMsg({ 
//           type: 'error', 
//           text: data.instruction || data.error 
//         });
//       }
//     } catch (e) {
//       setSubMsg({ type: 'error', text: "❌ Connection failed. Check console." });
//     }
//     setSubscribing(false);
//   };

//   const processPayroll = async () => {
//     if (!file) return;
//     setStatus("processing");
//     setLogs([]);
//     addLog("Starting Local Encryption Pipeline...");

//     try {
//       // 1. Parse CSV
//       const text = await file.text();
//       const result = Papa.parse(text, { header: true, skipEmptyLines: true });
//       const rows = result.data as any[];
//       addLog(`Parsed ${rows.length} employee records.`);

//       const encryptedRows = [];
//       const commitments = [];
//       const credentials = []; 
//       const runId = crypto.randomUUID().split("-")[0];
//       const orgId = "ORG_DEMO_123";

//       // 2. Client-Side Encryption Loop
//       for (const row of rows) {
//         // A. Generate Keys & Encrypt
//         const aesKey = await generateAESKey();
//         const aesKeyBase64 = await exportKeyToBase64(aesKey);
//         const { ciphertext, iv } = await encryptRow(row, aesKey);

//         // B. Generate ZK Identity
//         const credentialNonce = await generateCredentialNonce();
//         const employeeTag = await generateEmployeeTag(credentialNonce);

//         // C. Prepare Data for API (Nillion Storage)
//         encryptedRows.push({
//           keyBase64: aesKeyBase64, 
//           ciphertext: ciphertext,
//           iv: iv,
//           employeeTag: employeeTag,
//           orgId: orgId
//         });

//         // D. Generate Commitment for Manifest
//         const commitment = await generateCommitment(ciphertext);
//         commitments.push(commitment);

//         // E. Save Credential (User Download)
//         credentials.push({
//           org_id: orgId,
//           role: row.role,
//           nonce: credentialNonce,
//           tag: employeeTag
//         });
//       }
//       addLog("Encryption Complete. Sending to API...");

//       // 3. Send to Next.js API (Server-Side Nillion Upload)
//       const response = await fetch("/api/create", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           runId,
//           orgId,
//           encryptedRows
//         })
//       });

//       const apiResult = await response.json();

//       if (!apiResult.success) {
//         throw new Error(apiResult.error || "API Upload Failed");
//       }

//       addLog(`Data Stored in Nillion! Collection ID: ${apiResult.data.collection_id}`);

//       // 4. Build Final Manifest
//       const finalManifest = {
//         run_id: runId,
//         org_id: orgId,
//         collection_id: apiResult.data.collection_id,
//         commitments: commitments, 
//         timestamp: Date.now(),
//         note: "Input for NilCC Orchestrator"
//       };

//       setManifest(finalManifest);
//       setStatus("completed");

//     } catch (error: any) {
//       console.error(error);
//       addLog(`❌ Error: ${error.message}`);
//       setStatus("error");
//     }
//   };

//   const downloadManifest = () => {
//     if (!manifest) return;
//     const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `manifest_${manifest.run_id}.json`;
//     a.click();
//   };

//   return (
//     <div className="max-w-xl mx-auto p-6 bg-white border rounded-lg mt-10 shadow-sm">
//       <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
//         <ShieldCheck className="text-indigo-600" /> Secure Payroll Upload
//       </h2>

//       {status === "idle" && (
//         <div className="space-y-4">
//           <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
          
//           <button onClick={processPayroll} disabled={!file} className="w-full py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 disabled:opacity-50">
//             Encrypt & Upload
//           </button>

//           {/* NEW: Subscription Section */}
//           <div className="pt-4 mt-4 border-t border-gray-100">
//             <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Admin Setup</h3>
//             <div className="flex flex-col gap-2">
//               <button 
//                 onClick={handleSubscribe} 
//                 disabled={subscribing}
//                 className="flex items-center justify-center gap-2 w-full py-2 border border-amber-500 text-amber-700 rounded hover:bg-amber-50 text-sm font-medium transition"
//               >
//                 {subscribing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4" />}
//                 {subscribing ? "Checking..." : "Initialize / Subscribe Wallet"}
//               </button>
              
//               {subMsg && (
//                 <div className={`text-xs p-2 rounded border ${subMsg.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
//                   {subMsg.text}
//                 </div>
//               )}
//             </div>
//           </div>

//         </div>
//       )}

//       {status === "processing" && (
//         <div className="space-y-2">
//            <Loader2 className="animate-spin text-indigo-600 mx-auto w-8 h-8" />
//            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
//              {logs.map((l, i) => <div key={i}>{l}</div>)}
//            </div>
//         </div>
//       )}

//       {status === "completed" && (
//         <div className="text-center space-y-4">
//           <div className="text-green-600 font-medium flex items-center justify-center gap-2">
//             <CheckCircle /> Payroll Run Initiated
//           </div>
//           <button onClick={downloadManifest} className="w-full py-2 bg-gray-800 text-white rounded flex items-center justify-center gap-2">
//             <FileJson className="w-4 h-4" /> Download Manifest
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }