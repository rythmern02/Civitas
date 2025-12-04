// orchestrator/index.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { execSync } = require("child_process");

const NILCC_API_BASE = process.env.NILCC_API_BASE || "https://api.nilcc.nillion.network";
const NILCC_API_KEY = process.env.NILCC_API_KEY || "271d5a99afc22d3337a7b9034d81729b145c768c4f26c4d6d96495ca99109e3f";
const IMAGE_REF = process.env.IMAGE_REF;

if (!NILCC_API_KEY) {
  console.warn("Warning: NILCC_API_KEY not set. Local dev only.");
}

async function submitJob(manifest) {
  // basic validation
  if (!manifest.run_id || !Array.isArray(manifest.inputs)) throw new Error("invalid manifest");
  const runId = manifest.run_id;
  const jobName = `zkpassport-${runId}`;

  // Build a dockerCompose string that nilCC quickstart expects.
  const dockerCompose = `
version: "3.8"
services:
  compute:
    image: ${IMAGE_REF}
    environment:
      - RUN_ID=${runId}
      - MANIFEST_S3_PREFIX=${manifest.s3_prefix || ""}
    command: ["node","/app/run_compute.js"]
`;

  if (!NILCC_API_KEY) {
    // fallback: run local docker for dev
    console.log("NILCC_API_KEY not found; running workload locally via docker run (DEV).");
    // Launch docker run with mounted artifact directories if any local fallback
    try {
      const tmpInputs = "/tmp/zk_inputs";
      const tmpOutputs = "/tmp/zk_outputs";
      fs.mkdirSync(tmpInputs, { recursive: true });
      fs.mkdirSync(tmpOutputs, { recursive: true });
      // For local dev we expect inputs to be downloaded by orchestrator to tmpInputs earlier.
      console.log("Running local docker image:", IMAGE_REF);
      execSync(
        `docker run --rm -e RUN_ID=${runId} -v ${tmpInputs}:/inputs -v ${tmpOutputs}:/outputs ${IMAGE_REF}`,
        { stdio: "inherit" }
      );
      const jobId = `local-${runId}`;
      return { job_id: jobId };
    } catch (err) {
      throw new Error("Local docker run failed: " + String(err));
    }
  }

  // Submit workload as "job" to nilCC — using quickstart pattern (first create a workload then submit a job)
  // 1) Create workload (idempotent if same name exists - handle errors)
  const workReq = {
    name: jobName,
    dockerCompose,
    serviceToExpose: "compute",
    servicePortToExpose: 8080,
    cpus: 1,
    memory: 2048,
    disk: 1024
  };

  // create workload
  const createUrl = `${NILCC_API_BASE}/api/v1/workloads/create`;
  const createResp = await fetch(createUrl, {
    method: "POST",
    headers: { "x-api-key": NILCC_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(workReq)
  });
  if (!createResp.ok) {
    const t = await createResp.text();
    throw new Error("Failed to create workload: " + t);
  }
  const workload = await createResp.json();
  // workload contains workload_id etc. Now submit a job to the workload if API supports "jobs/create".
  const submitUrl = `${NILCC_API_BASE}/api/v1/jobs/create`;
  const jobPayload = {
    workload_id: workload.workload_id || workload.id || workload.id,
    name: `job-${runId}`,
    // inputs: map S3 input references as job artifacts if nilCC supports artifact semantics in your account.
    // We'll pass manifest location (S3 path) as env var for the workload to fetch.
    env: {
      RUN_ID: runId,
      MANIFEST_S3: manifest.manifest_s3 || ""
    }
  };

  const jobResp = await fetch(submitUrl, {
    method: "POST",
    headers: { "x-api-key": NILCC_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(jobPayload)
  });
  if (!jobResp.ok) {
    const t = await jobResp.text();
    throw new Error("Failed to submit job: " + t);
  }
  const job = await jobResp.json();
  console.log("Job submitted", job);
  return { job_id: job.job_id || job.id || `${job.id || job.job_id}` };
}

// CLI
if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const cmd = argv[0];
    try {
      if (cmd === "submit") {
        const manifestPath = argv[1];
        if (!manifestPath) throw new Error("usage: node index.js submit <manifest.json>");
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        const resp = await submitJob(manifest);
        console.log(JSON.stringify(resp));
        process.exit(0);
      } else if (cmd === "poll") {
        const jobId = argv[1];
        console.log("poll is not implemented in CLI for nilCC quick demo. job:", jobId);
        process.exit(0);
      } else {
        console.log("commands: submit <manifest.json>");
        process.exit(0);
      }
    } catch (err) {
      console.error("error:", err);
      process.exit(2);
    }
  })();
}

module.exports = { submitJob };
