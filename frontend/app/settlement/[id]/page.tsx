// app/settlement/[id]/page.tsx   ← or wherever you put it
'use client';

import { use, useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

type SettlementPageProps = {
  params: Promise<{ id: string }>;
};

const explorerBase = (process.env.NEXT_PUBLIC_ZCASH_EXPLORER || 'https://explorer.testnet.zcash.com').replace(
  /\/$/,
  ''
);

export default function SettlementPage({ params }: SettlementPageProps) {
  const resolvedParams = use(params);
  const employeeTag = decodeURIComponent(resolvedParams.id);

  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [txid, setTxid] = useState('');
  const [error, setError] = useState('');

  const voucher = {
    id: 'voucher_2025_001',
    amount: '0.01 tZEC',
  };

  const handleClaim = async () => {
    const normalizedAddress = address.trim();

    const isShieldedAddress =
      normalizedAddress.startsWith('ztestsapling') || normalizedAddress.startsWith('zs');

    if (!isShieldedAddress) {
      setStatus('error');
      setError('Please enter a valid shielded address (starts with ztestsapling)');
      return;
    }

    setStatus('loading');
    setError('');
    setTxid('');

    try {
      const res = await fetch('/api/employee/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucher_id: voucher.id,
          employee_tag: employeeTag,
          recipient_shielded_address: normalizedAddress,
          proof: 'local-test-proof-v1',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Settlement failed');

      setTxid(data.txid);
      setStatus('success');
    } catch (err: any) {
      console.error('Settlement claim failed', err);
      setError(err.message || 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10 text-gray-900">
      <div className="flex items-center gap-4 mb-10">
        <Shield className="w-12 h-12 text-green-600" />
        <h1 className="text-4xl font-bold">Zcash Voucher Redemption</h1>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border">
        <p className="text-lg">
          Employee Tag: <span className="font-mono font-bold text-green-700">{employeeTag}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-8 border">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-3xl font-bold text-green-600">{voucher.amount}</p>
              <p className="text-gray-600">Voucher ID: {voucher.id}</p>
            </div>

            {txid ? (
              <div className="text-green-600 flex items-center gap-3 text-xl">
                <CheckCircle className="w-8 h-8" />
                <span>Claimed</span>
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={status === 'loading'}
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
              >
                {status === 'loading' ? 'Broadcasting...' : 'Claim Now'}
              </button>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Shielded Zcash Testnet Address (zs1...)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ztestsapling1..."
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Use Zecwallet Lite, Nighthawk, or YWallet on testnet
            </p>
          </div>

          {status === 'loading' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">Sending transaction to Zcash testnet...</p>
            </div>
          )}

          {status === 'success' && txid && (
            <div className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 font-bold text-lg mb-2">Success!</p>
              <a
                href={`${explorerBase}/transactions/${txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                View transaction: {txid}
              </a>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 p-6 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}