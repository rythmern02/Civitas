<div align="center">

# 🔐 **CIVITAS** 
## *Privacy-First Decentralized Payroll Infrastructure*

**"Privacy is not a feature. It's a fundamental right."**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Circom](https://img.shields.io/badge/Built%20with-Circom%202.0.0-blue)](https://docs.circom.io/)
[![NEAR Protocol](https://img.shields.io/badge/NEAR-Protocol-black)](https://near.org)
[![Zcash Shielded](https://img.shields.io/badge/Zcash-Shielded-FFB923)](https://z.cash)

**Built for the Zypherpunk Hackathon**

---

</div>

## 🌟 **The Vision**

In a world where financial surveillance is the norm, **Civitas** reimagines payroll as a privacy-preserving, verifiable, and decentralized system. We don't just encrypt data—we prove correctness without revealing identities. We don't just hide transactions—we create cryptographic guarantees that payroll integrity is maintained while individual salaries remain completely private.

**Civitas** combines the scalability of NEAR Protocol with the ultimate privacy of Zcash, wrapped in Zero-Knowledge proofs that verify payroll correctness without exposing a single salary figure.

---

## 🎯 **Core Problem & Solution**

### **The Problem**
- **Surveillance Capitalism**: Traditional payroll systems expose employee salaries to employers, auditors, and intermediaries
- **Lack of Privacy**: Financial data becomes a surveillance vector
- **Trust Requirements**: Employees must trust employers and third parties with sensitive information
- **No Cryptographic Guarantees**: No way to verify payroll integrity without revealing individual amounts

### **The Civitas Solution**
- ✅ **ZK Payroll Proofs**: Prove total payroll correctness without revealing individual salaries
- ✅ **ZK Identity System**: Self-sovereign employee credentials with Poseidon hashing
- ✅ **Public Commitments**: NEAR Protocol stores verifiable payroll roots on-chain
- ✅ **Private Settlement**: Zcash shielded transactions ensure financial privacy
- ✅ **Voucher-Based Distribution**: Secure credential handoff without employer access to raw data

---

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                         EMPLOYER PORTAL                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Create     │  │   Generate   │  │   Commit to NEAR    │  │
│  │   Payroll    │→ │   ZK Proof   │→ │   (Public Root)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ZERO-KNOWLEDGE LAYER                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Groth16 SNARK Circuit (Circom)                          │  │
│  │  • Input: {salaries[], salts[], totalAmount}             │  │
│  │  • Output: payrollRoot (Poseidon hash)                  │  │
│  │  • Proof: Verifies sum(salaries) = totalAmount          │  │
│  │  • Privacy: Individual salaries never revealed          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   NEAR PROTOCOL          │  │   AUDITOR VERIFICATION   │
│   (ZK Consensus Layer)   │  │   (Independent Verify)  │
│                          │  │                          │
│  • Payroll root stored   │  │  • Verify proof validity │
│  • Proof verification    │  │  • Check voucher status │
│  • Immutable consensus   │  │  • Validate totals match │
│  • Public verifiability  │  │  • No salary visibility │
└──────────────────────────┘  └──────────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZCASH SETTLEMENT                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Shielded transactions                                 │  │
│  │  • Employee vouchers → Zcash addresses                   │  │
│  │  • Zero-knowledge amounts                                │  │
│  │  • Complete transaction privacy                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EMPLOYEE PORTAL                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   ZK Login   │  │   View       │  │   Redeem Voucher     │  │
│  │   (Credential│  │   Vouchers   │  │   → Zcash Settlement │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 **Key Features**

### **1. Zero-Knowledge Payroll Proofs**

Using **Circom** and **Groth16 SNARKs**, Civitas generates cryptographic proofs that verify:
- ✅ The sum of all salaries equals the declared total
- ✅ Each salary is properly included in the calculation
- ✅ **Without revealing any individual salary amount**

**Circuit Logic:**
```circom
template PayrollSum(nEmployees) {
    signal input totalAmount;        // Public: Total payroll amount
    signal input salaries[nEmployees]; // Private: Individual salaries
    signal input salts[nEmployees];   // Private: Random salts
    
    // Constraint: sum(salaries) === totalAmount
    // Output: Merkle root hash of payroll structure
}
```

### **2. ZK Identity & Passport System**

**Self-Sovereign Employee Credentials:**
- **Employee Tag**: Poseidon hash of credential nonce (cryptographic identifier)
- **Encrypted Credential**: AES-GCM encrypted identity blob
- **Voucher-Based Distribution**: Employers issue single-use credential vouchers
- **ZK Login**: Employees authenticate using credential proofs without revealing secrets

**Identity Flow:**
```
Employee Creation → Generate Nonce → Poseidon Hash → Employee Tag
                → Encrypt Credential → Issue Voucher → Employee Claims
```

### **3. Hybrid Blockchain Architecture**

**NEAR Protocol (Public Layer):**
- Stores payroll commitments (Merkle roots)
- Verifies ZK proofs on-chain
- Provides immutable audit trail
- Enables public verification without privacy loss

**Zcash (Private Layer):**
- Shielded transactions for settlement
- Complete financial privacy
- No transaction graph analysis possible
- Employee vouchers redeem to Zcash addresses

### **4. Privacy-Preserving Voucher System**

**Secure Credential Distribution:**
- Employers generate single-use voucher tokens
- Employees claim credentials via secure links
- Credentials encrypted with employee-specific nonces
- Employers cannot access raw credential data

**Voucher Redemption:**
- Employee uploads credential file
- System verifies credential blob matches stored hash
- Unlocks voucher amounts for viewing
- Enables Zcash settlement

### **5. Auditor Verification & ZK Consensus**

**Independent Verification:**
- Auditors verify payroll runs without seeing individual salaries
- Check proof validity against NEAR on-chain commitments
- Validate voucher settlement status
- Confirm total amounts match declared payroll

**ZK Consensus Mechanism:**
- **Public Commitment**: Payroll root stored on NEAR (immutable, verifiable)
- **Proof Verification**: Multiple parties (employer, auditors) verify same proof independently
- **Consensus Point**: NEAR contract serves as single source of truth
- **No Trust Required**: Cryptographic proof replaces trust in intermediaries

**Auditor Workflow:**
1. View committed payroll runs on NEAR
2. Verify ZK proof validity (off-chain or on-chain)
3. Check voucher redemption status
4. Confirm settlement completion
5. Mark run as verified (immutable audit trail)

**Consensus Properties:**
- ✅ **Verifiability**: Anyone can verify proof against public signals
- ✅ **Immutability**: Once committed to NEAR, payroll root cannot be altered
- ✅ **Transparency**: Public verification without privacy loss
- ✅ **Decentralization**: No single point of trust or failure

---

## 🛠️ **Technical Stack**

### **Frontend**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React, Tailwind CSS, Radix UI
- **State**: React Context, Local Storage

### **Zero-Knowledge**
- **Circuit Language**: Circom 2.0.0
- **Proof System**: Groth16 (via snarkjs)
- **Hashing**: Poseidon (poseidon-lite)
- **Artifacts**: WASM, zkey, verification keys

### **Blockchain**
- **NEAR Protocol**: Rust smart contracts (near-sdk)
- **Zcash**: RPC integration for shielded transactions
- **Wallet Integration**: NEAR Wallet Selector

### **Identity & Cryptography**
- **Password Hashing**: bcryptjs
- **Encryption**: AES-GCM (Web Crypto API)
- **Key Derivation**: X25519, SHA-256
- **Session Management**: JWT (jose)

### **Infrastructure**
- **Data Storage**: Nillion SecretVaults (encrypted)
- **Orchestration**: Node.js orchestrator service
- **Containerization**: Docker workloads
- **Database**: JSON-based persistence (employees, payroll runs)

---

## 📦 **Installation & Setup**

### **Prerequisites**

```bash
# Required tools
- Node.js 18+ 
- Rust & Cargo (for NEAR contracts)
- Circom 2.0.0
- snarkjs
- Docker (for workload execution)
- Zcash testnet node (for settlement)
```

### **Quick Start**

```bash
# 1. Clone the repository
git clone https://github.com/your-org/civitas.git
cd civitas

# 2. Install dependencies
npm install
cd frontend && npm install
cd ../orchestrator && npm install
cd ../near/contracts && cargo build --target wasm32-unknown-unknown --release

# 3. Compile ZK circuits
cd ../../payroll_circuits
npm install
./compile.sh  # Generates WASM, zkey, verification keys

# 4. Copy ZK artifacts to frontend
cp build/payroll_js/payroll.wasm ../../frontend/public/zk/payroll_js/
cp build/payroll_final.zkey ../../frontend/public/zk/

# 5. Set up environment variables
cd ../../frontend
cp .env.example .env.local

# Required environment variables:
# AUTH_JWT_SECRET=your-secret-key
# NEAR_NETWORK_ID=testnet
# NEAR_CONTRACT_ID=your-contract.testnet
# NEAR_ORCHESTRATOR_ACCOUNT=your-account.testnet
# NEAR_ORCHESTRATOR_KEY=your-private-key
# ZCASH_RPC_URL=http://localhost:8232
# ZCASH_RPC_USER=rpcuser
# ZCASH_RPC_PASSWORD=rpcpass
# ZCASH_SENDER_SHIELDED=ztestsapling1...

# 6. Start the development server
npm run dev
```

### **Build for Production**

```bash
# Frontend
cd frontend
npm run build
npm start

# NEAR Contract
cd near/contracts
./deploy.sh  # Deploys to NEAR testnet/mainnet
```

---

## 🔬 **Technical Deep Dive**

### **ZK Proof Generation Flow**

1. **Input Preparation**:
   ```typescript
   {
     totalAmount: "3800.00",  // Public
     salaries: [1200, 1500, 1100],  // Private
     salts: [random(), random(), random()]  // Private
   }
   ```

2. **Circuit Execution**:
   - Witness generation (WASM)
   - Constraint checking (R1CS)
   - Proof generation (Groth16)
   - Poseidon hash of (salaries || salts) → payrollRoot

3. **Output**:
   ```json
   {
     "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
     "publicSignals": ["proofHash", "payrollRoot", ...]
   }
   ```

4. **ZK Consensus Verification**:
   - **Employer**: Generates proof, commits to NEAR
   - **NEAR Contract**: Verifies proof on-chain (or trusted mode)
   - **Auditors**: Independently verify same proof off-chain
   - **Consensus**: All parties agree on payrollRoot validity
   - **Immutable**: Once on NEAR, root cannot be altered

### **Identity System Architecture**

**Employee Credential Structure:**
```typescript
{
  employee_id: "uuid",
  employee_tag: "poseidon_hash(nonce)",  // Public identifier
  credential_nonce: "random_32_bytes",    // Secret
  zkpass_credential: {
    ciphertext: "aes-gcm_encrypted_payload",
    iv: "initialization_vector",
    signature: "hmac_signature"
  }
}
```

**Authentication Methods:**
1. **Password Login**: bcrypt hash verification
2. **ZK Tag Login**: Poseidon hash proof
3. **Credential File Login**: Encrypted blob verification

### **NEAR Contract Integration & ZK Consensus**

**Smart Contract Functions:**
```rust
pub fn commit_payroll(
    run_id: String,
    payroll_root: String,
    total_amount: String,
    proof: Option<String>,
    public_signals: Option<Vec<String>>
) -> PromiseOrValue<String>
```

**ZK Consensus Flow:**
1. **Employer** generates ZK proof with private salaries
2. **Employer** commits proof + payrollRoot to NEAR contract
3. **NEAR Contract** verifies proof on-chain (or trusted mode)
4. **NEAR Contract** stores payrollRoot immutably (consensus point)
5. **Auditors** read payrollRoot from NEAR
6. **Auditors** independently verify proof using same public signals
7. **Consensus Achieved**: All parties agree on payrollRoot validity
8. **Immutable Record**: Payroll commitment cannot be altered

**Consensus Properties:**
- **Single Source of Truth**: NEAR contract stores canonical payrollRoot
- **Public Verifiability**: Anyone can verify proof against public signals
- **No Trust Required**: Cryptographic proof replaces trust
- **Decentralized**: No single party controls consensus

### **Zcash Settlement**

**Shielded Transaction Flow:**
1. Employee redeems voucher with credential
2. System verifies credential blob
3. Constructs Zcash shielded transaction
4. Calls `z_sendmany` RPC
5. Polls `z_getoperationstatus` until success
6. Returns transaction ID

**Privacy Guarantees:**
- Sender address hidden (shielded pool)
- Recipient address hidden (shielded pool)
- Amount hidden (encrypted note)
- Transaction graph broken

---

## 🚀 **Usage Examples**

### **Employer: Create Payroll**

```typescript
// 1. Select employees and input payroll data
const payrollData = {
  employees: [
    { employee_id: "emp_001", net_pay: 1200 },
    { employee_id: "emp_002", net_pay: 1500 },
    { employee_id: "emp_003", net_pay: 1100 }
  ]
};

// 2. Generate ZK proof
const proof = await fetch("/api/payroll/generate", {
  method: "POST",
  body: JSON.stringify(payrollData)
});

// 3. Commit to NEAR
const commit = await fetch("/api/payroll/commit", {
  method: "POST",
  body: JSON.stringify({
    run_id: proof.run_id,
    payroll_root: proof.payroll_root,
    proof: proof.proof,
    public_signals: proof.public_signals
  })
});
```

### **Employee: Claim Voucher**

```typescript
// 1. Upload credential file
const credentialFile = await file.text();
const parsed = JSON.parse(credentialFile);

// 2. Verify credential
const verify = await fetch("/api/employees/credential/verify", {
  method: "POST",
  body: JSON.stringify({
    credential: parsed.credential,
    employee_tag: parsed.employee_tag
  })
});

// 3. Redeem voucher to Zcash
const redeem = await fetch("/api/employees/redeem", {
  method: "POST",
  body: JSON.stringify({
    voucher_id: "voucher_123",
    recipient_shielded_address: "ztestsapling1...",
    credential: parsed.credential,
    employee_tag: parsed.employee_tag
  })
});
```

### **Auditor: Verify Payroll Run**

```typescript
// 1. Fetch committed payroll runs from NEAR
const runs = await fetch("/api/auditors/runs");

// 2. Verify specific payroll run
const verify = await fetch("/api/auditors/verify", {
  method: "POST",
  body: JSON.stringify({
    run_id: "run_2025_11_01_01"
  })
});

// Response includes:
// - Total vouchers issued
// - Vouchers redeemed vs pending
// - Settlement status
// - Proof validity confirmation
// - NO individual salary information
```

---

## 🎭 **Actor Roles & Workflows**

### **Employer**
- Create payroll runs with employee data
- Generate ZK proofs for payroll correctness
- Commit payroll roots to NEAR Protocol
- Issue credential vouchers to employees
- Monitor settlement status

### **Employee**
- Receive encrypted credential vouchers
- Authenticate using ZK identity (credential file)
- View personal vouchers (amounts unlock after credential verification)
- Redeem vouchers to Zcash shielded addresses
- Complete financial privacy

### **Auditor**
- Access committed payroll runs on NEAR
- Verify ZK proof validity independently
- Check voucher redemption status across all employees
- Validate that totals match declared amounts
- Provide immutable verification records
- **Never see individual salaries** - only verify correctness

---

## 🔒 **Security & Privacy Guarantees**

### **Cryptographic Assumptions**
- **Discrete Logarithm Problem**: Groth16 security
- **Poseidon Hash**: ZK-friendly hashing
- **AES-GCM**: Authenticated encryption
- **Zcash Sapling**: Zero-knowledge shielded transactions

### **Privacy Properties**
- ✅ **Salary Privacy**: Individual salaries never revealed
- ✅ **Identity Privacy**: Employee tags are pseudonymous
- ✅ **Transaction Privacy**: Zcash shielded pool breaks linkability
- ✅ **Audit Privacy**: Public verification without data exposure

### **Security Considerations**
- 🔐 Credentials encrypted at rest
- 🔐 Voucher tokens are single-use
- 🔐 Session management via HttpOnly cookies
- 🔐 Proof verification on-chain and off-chain

---


## 🤝 **Contributing**

We welcome contributions! ping @rythmern on TG!

**Areas of Interest:**
- Circuit optimization
- Privacy-preserving analytics
- Cross-chain integrations
- Mobile applications

---

## 📄 **License**

This project is licensed under the MIT License.

---

## 👥 **Team**

Built with ❤️ by the **Civitas** team for the **Zypherpunk Hackathon**.

**Core Values:**
- 🔐 Privacy is a fundamental right
- 🛡️ Cryptographic guarantees over trust
- 🌐 Decentralization over centralization
- 🔓 Open source over proprietary

---

## 🙏 **Acknowledgments**

- **Circom** team for the amazing ZK circuit language
- **NEAR Protocol** for scalable blockchain infrastructure
- **Zcash** for privacy-preserving transactions
- **Nillion** for encrypted data storage
- The **Cypherpunk** community for inspiration

---

<div align="center">

**"Privacy is not about hiding something. It's about being in control of what you reveal."**

**Built for a future where financial privacy is the default, not the exception.**

</div>

