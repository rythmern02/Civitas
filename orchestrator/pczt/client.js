// orchestrator/pczt/client.js
const fetch = require("node-fetch");
const { rpcCall, sendRawTransaction } = require("../zcash/rpc");

const PCZT_API_URL = process.env.PCZT_API_URL || "";

async function buildWithPCZT(voucher) {
  if (!PCZT_API_URL) throw new Error("PCZT_API_URL not configured");
  // voucher: { voucher_id, amount, recipient_shielded_address, ... }
  const res = await fetch(`${PCZT_API_URL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(voucher),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error("PCZT build failed: " + body);
  }
  const json = await res.json();
  // json can contain { pczt_blob, signed_tx_hex, status }
  return json;
}

async function submitSettlement(voucher) {
  // try PCZT first
  if (PCZT_API_URL) {
    try {
      const pcztResp = await buildWithPCZT(voucher);
      if (pcztResp.signed_tx_hex) {
        const txid = await sendRawTransaction(pcztResp.signed_tx_hex);
        return { txid, mode: "pczt_signed" };
      } else if (pcztResp.pczt_blob) {
        // return blob to wallet for finalization
        return { pczt_blob: pcztResp.pczt_blob, mode: "pczt_blob" };
      }
    } catch (e) {
      console.warn("PCZT build failed, falling back to zcashd:", e.message);
    }
  }

  // fallback: attempt direct zcashd flow (z_sendmany or sendrawtransaction)
  // This example uses z_sendmany if available (sapling/orchard)
  try {
    const txid = await rpcCall("z_sendmany", [
      "", // from address (empty for default)
      [{ address: voucher.recipient, amount: voucher.amount, memo: voucher.voucher_id }],
    ]);
    return { txid, mode: "zcashd_z_sendmany" };
  } catch (e) {
    // As fallback, return object asking client to finalize tx
    return { error: "zcashd fallback failed: " + e.message };
  }
}

module.exports = { buildWithPCZT, submitSettlement };
