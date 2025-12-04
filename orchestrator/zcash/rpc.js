// orchestrator/zcash/rpc.js
const fetch = require("node-fetch");

const RPC_URL = process.env.ZCASH_RPC_URL || "http://127.0.0.1:18232";
const RPC_USER = process.env.ZCASH_RPC_USER || "";
const RPC_PASS = process.env.ZCASH_RPC_PASS || "";

// utility: send RPC
async function rpcCall(method, params = []) {
  const body = { jsonrpc: "1.0", id: "curl", method, params };
  const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString("base64");
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`
    },
    body: JSON.stringify(body),
    timeout: 30000
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${JSON.stringify(json.error)}`);
  return json.result;
}

async function sendRawTransaction(hex) {
  // zcashd method: sendrawtransaction
  return rpcCall("sendrawtransaction", [hex]);
}

async function getNewAddress(label = "", address_type = "sprout") {
  // on testnet, use getnewaddress or z_getnewaddress depending on shielded
  // for shielded, z_getnewaddress "sprout" or "sapling" may be available
  try {
    return await rpcCall("z_getnewaddress", [address_type]);
  } catch (e) {
    return rpcCall("getnewaddress", [label]);
  }
}

async function getBalance(address) {
  // simplistic: if address is transparent, use getaddressbalance / getreceivedbyaddress
  return rpcCall("getbalance", []);
}

module.exports = { rpcCall, sendRawTransaction, getNewAddress, getBalance };
