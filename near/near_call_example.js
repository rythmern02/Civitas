// near/near_call_example.js
const { connect, keyStores, WalletConnection } = require("near-api-js");

async function example() {
  const nearConfig = {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    deps: { keyStore: new keyStores.UnencryptedFileSystemKeyStore("./near-keys") }
  };
  const near = await connect(nearConfig);
  const account = await near.account("orchestrator.testnet");
  const res = await account.functionCall({
    contractId: "zkpayroll.testnet",
    methodName: "commit_payroll",
    args: { run_id: "test-run-1", payroll_root: "0xabc", total_amount: "4500" },
    gas: "300000000000000",
  });
  console.log(res.transaction.hash);
}

example();
