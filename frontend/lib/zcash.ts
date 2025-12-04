// lib/zcash.ts  ← UPDATED VERSION
const RPC_URL = process.env.ZCASH_RPC_URL!;
const RPC_USER = process.env.ZCASH_RPC_USER!;
const RPC_PASS = process.env.ZCASH_RPC_PASSWORD!;

async function rpcCall(method: string, params: any[] = []) {
  const auth = Buffer.from(`${RPC_USER}:${RPC_PASS}`).toString('base64');
  const body = JSON.stringify({ jsonrpc: '1.0', id: 'settle', method, params });

  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body,
  });

  const json = await res.json();
  console.log(`→ ${method}`, params);
  console.log(`← ${method} response:`, json);

  if (json.error) {
    throw new Error(`zcashd RPC error: ${json.error.message} (code ${json.error.code})`);
  }
  return json.result;
}

export const zcashRpc = {
  async sendShielded(
    from: string,
    to: string,
    amount: number,
    memo: string = '',
    opReturn: string = ''
  ): Promise<string> {
    const outputs: any[] = [
      { address: to, amount: amount },
    ];

    if (opReturn) {
      outputs.push({ opreturn: Buffer.from(opReturn, 'utf8').toString('hex') });
    }

    console.log('z_sendmany from:', from, 'to:', to, 'amount:', amount);

    const opid = await rpcCall('z_sendmany', [
      from,
      outputs,
      1,
      0.00001,
      memo ? [memo] : undefined
    ]);

    console.log('Operation ID:', opid);

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 4000));
      const status = await rpcCall('z_getoperationstatus', [[opid]]);

      if (status[0]?.status === 'success') {
        return status[0].result.txid;
      }
      if (status[0]?.status === 'failed') {
        throw new Error(`z_sendmany failed: ${JSON.stringify(status[0].error)}`);
      }
      if (status[0]?.status === 'executing') {
        console.log('Still executing...');
      }
    }

    throw new Error('z_sendmany timed out after 160 seconds');
  },
};