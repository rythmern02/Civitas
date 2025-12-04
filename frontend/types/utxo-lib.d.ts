declare module "@bitgo/utxo-lib" {
  export interface ECPair {
    fromWIF(wif: string, network?: Network): ECPair;
    publicKey: Buffer;
    privateKey?: Buffer;
    sign(hash: Buffer): Buffer;
  }

  export interface Network {
    messagePrefix?: string;
    bech32?: string;
    bip32?: {
      public: number;
      private: number;
    };
    pubKeyHash?: number;
    scriptHash?: number;
    wif?: number;
  }

  export interface Payment {
    address?: string;
    output?: Buffer;
    data?: Buffer[];
  }

  export interface Payments {
    p2pkh: (options: { pubkey: Buffer; network?: Network }) => Payment;
    p2sh: (options: { redeem?: Payment; network?: Network }) => Payment;
    p2wpkh: (options: { pubkey: Buffer; network?: Network }) => Payment;
    p2wsh: (options: { redeem?: Payment; network?: Network }) => Payment;
  }

  export class Transaction {
    toHex(): string;
    getId(): string;
    static SIGHASH_ALL: number;
    static SIGHASH_NONE: number;
    static SIGHASH_SINGLE: number;
  }

  export class TransactionBuilder {
    constructor(network?: Network);
    setVersion(version: number): TransactionBuilder;
    addInput(txHash: string, vout: number, sequence?: number, prevOutScript?: Buffer): number;
    addOutput(scriptPubKey: string | Buffer, value: number): number;
    sign(vin: number, keyPair: ECPair, redeemScript?: Buffer, hashType?: number, witnessValue?: number, witnessScript?: Buffer): void;
    build(): Transaction;
  }

  export const payments: Payments;
  export const networks: {
    [key: string]: Network;
    zcash?: Network;
    zcashTest?: Network;
    bitcoin?: Network;
    testnet?: Network;
  };
  export const ECPair: {
    fromWIF(wif: string, network?: Network): ECPair;
    makeRandom(options?: { network?: Network }): ECPair;
    fromPrivateKey(privateKey: Buffer, options?: { network?: Network }): ECPair;
  };
  export { TransactionBuilder };
  export { Transaction };
}

