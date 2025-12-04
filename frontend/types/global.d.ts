import { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

// Re-export types from @bitgo/utxo-lib module for convenience
export type UtxoLib = typeof import('@bitgo/utxo-lib');

declare module "snarkjs";

export {};