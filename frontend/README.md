# Civitas Frontend

Next.js app for the Civitas zero-knowledge payroll demo. The `app/settlement/[id]` route drives Zcash testnet payouts by calling `zcashd` through our Next.js API layer.

## Prerequisites

- Node.js 18+
- Docker (for `zcashd` testnet)
- A funded shielded testnet wallet (Zecwallet Lite, Nighthawk, YWallet, etc.)

Install dependencies once per clone:

```bash
cd frontend
npm install
```

## Environment configuration

Create `frontend/.env.local` with the Zcash RPC credentials exported by your local `zcashd` container plus the sender address that holds testnet ZEC:

```
ZCASH_RPC_URL=http://127.0.0.1:18232
ZCASH_RPC_USER=zcashrpc
ZCASH_RPC_PASSWORD=supersecret
ZCASH_SENDER_SHIELDED=zs1...
NEXT_PUBLIC_ZCASH_EXPLORER=https://explorer.testnet.zcash.com
```

All keys above are required by `/app/api/employee/redeem` and `lib/zcash.ts`. Never commit real secrets; keep them in `.env.local`.

## Running `zcashd` in Docker

```bash
docker run --rm -it \
  -v $HOME/.zcash-testnet:/home/zcash/.zcash \
  -p 18232:18232 -p 18233:18233 \
  electriccoinco/zcashd:latest \
  zcashd -testnet -rpcuser=zcashrpc -rpcpassword=supersecret -allowrpc=0.0.0.0/0
```

Wait for the node to finish syncing and fund `ZCASH_SENDER_SHIELDED` via the Zcash testnet faucet.

## Local development

```bash
npm run dev
```

Visit `http://localhost:3000/settlement/<employee_tag>` and enter a shielded testnet address. The page hits `/api/employee/redeem`, which relays the request to `zcashd` and returns the resulting transaction ID for verification on the configured explorer.
