use near_sdk::collections::{UnorderedMap, Vector};
use near_sdk::json_types::U64;
use near_sdk::{
    env, ext_contract, log, near, require, serde_json, AccountId, BorshStorageKey, Gas,
    PanicOnDefault, PromiseError, PromiseOrValue,
};

// Gas constants
const GAS_FOR_VERIFY: Gas = Gas::from_tgas(20);
const GAS_FOR_RESOLVE: Gas = Gas::from_tgas(10);

// Define storage keys to avoid collisions
#[near(serializers = [borsh])]
#[derive(BorshStorageKey)]
enum StorageKey {
    Commitments,
    ProcessedRuns,
    RunHistory, // Helper to list runs in order
}

// ----------------------------------------------------------------------------
// INTERFACES
// ----------------------------------------------------------------------------

// External Verifier Contract Trait (e.g., Groth16 Verifier)
#[ext_contract(ext_verifier)]
pub trait Verifier {
    fn verify_proof(
        &mut self,
        proof: String,
        public_signals: Vec<String>,
    ) -> bool;
}

// Self Trait for Callback (to resolve the promise result)
#[ext_contract(ext_self)]
pub trait SelfContract {
    fn resolve_payroll(
        &mut self,
        run_id: String,
        payroll_root: String,
        total_amount: String,
    ) -> bool;
}

// ----------------------------------------------------------------------------
// CONTRACT STATE
// ----------------------------------------------------------------------------

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Contract {
    orchestrator: AccountId,
    verifier_contract: Option<AccountId>,
    
    // Core data
    commitments: UnorderedMap<String, String>, // run_id -> payroll_root
    processed_runs: UnorderedMap<String, bool>,
    
    // Helper for pagination (since UnorderedMap iter order is not insertion order)
    run_history: Vector<String>, 
}

// ----------------------------------------------------------------------------
// IMPLEMENTATION
// ----------------------------------------------------------------------------

#[near]
impl Contract {
    
    #[init]
    pub fn new(orchestrator_id: AccountId) -> Self {
        Self {
            orchestrator: orchestrator_id,
            verifier_contract: None,
            commitments: UnorderedMap::new(StorageKey::Commitments),
            processed_runs: UnorderedMap::new(StorageKey::ProcessedRuns),
            run_history: Vector::new(StorageKey::RunHistory),
        }
    }

    // --- Change Methods ---

    #[payable] // Required if attaching gas, though we don't need deposit here
    pub fn set_orchestrator(&mut self, new_orchestrator: AccountId) {
        self.assert_orchestrator();
        self.orchestrator = new_orchestrator;
    }

    pub fn set_verifier(&mut self, verifier: AccountId) {
        self.assert_orchestrator();
        self.verifier_contract = Some(verifier);
    }

    pub fn remove_verifier(&mut self) {
        self.assert_orchestrator();
        self.verifier_contract = None;
    }

    /// Primary logic. 
    /// If verifier is SET and proof PROVIDED: Returns a Promise (async).
    /// Otherwise: Executes immediately and returns a Value (sync).
    pub fn commit_payroll(
        &mut self,
        run_id: String,
        payroll_root: String,
        total_amount: String,
        proof: Option<String>,
        public_signals: Option<Vec<String>>,
        _attestation: Option<String>, // Reserved for future use
    ) -> PromiseOrValue<String> {
        self.assert_orchestrator();
        require!(
            self.processed_runs.get(&run_id).is_none(),
            "Run ID already processed"
        );

        // Path A: Verification Required
        if let (Some(verifier), Some(p), Some(signals)) = (self.verifier_contract.clone(), proof, public_signals) {
            log!("Initiating verification for run: {}", run_id);
            
            // 1. Call external verifier
            let verify_call = ext_verifier::ext(verifier)
                .with_static_gas(GAS_FOR_VERIFY)
                .verify_proof(p, signals);

            // 2. Schedule callback to self
            let callback = ext_self::ext(env::current_account_id())
                .with_static_gas(GAS_FOR_RESOLVE)
                .resolve_payroll(run_id, payroll_root, total_amount);

            return PromiseOrValue::Promise(verify_call.then(callback));
        }

        // Path B: No Verification / Trusted Mode
        self.internal_commit(run_id, payroll_root, total_amount);
        PromiseOrValue::Value("Committed (Trusted Mode)".to_string())
    }

    /// Internal callback. Only callable by self.
    #[private] 
    pub fn resolve_payroll(
        &mut self,
        run_id: String,
        payroll_root: String,
        total_amount: String,
        #[callback_result] call_result: Result<bool, PromiseError>,
    ) -> String {
        // Check if the external call failed or returned false
        match call_result {
            Ok(true) => {
                self.internal_commit(run_id, payroll_root, total_amount);
                "Committed (Verified)".to_string()
            }
            Ok(false) => env::panic_str("Proof verification returned false"),
            Err(_) => env::panic_str("Verifier contract call failed"),
        }
    }

    // --- View Methods ---

    pub fn get_run_root(&self, run_id: String) -> Option<String> {
        self.commitments.get(&run_id)
    }

    pub fn is_run_processed(&self, run_id: String) -> bool {
        self.processed_runs.get(&run_id).unwrap_or(false)
    }

    pub fn get_orchestrator(&self) -> AccountId {
        self.orchestrator.clone()
    }

    pub fn get_verifier(&self) -> Option<AccountId> {
        self.verifier_contract.clone()
    }

    pub fn list_runs(&self, from: Option<U64>, limit: Option<U64>) -> Vec<(String, String, U64)> {
        let start_index = from.map(|v| v.0).unwrap_or(0);
        let limit_val = limit.map(|v| v.0).unwrap_or(10);

        self.run_history
            .iter()
            .skip(start_index as usize)
            .take(limit_val as usize)
            .map(|run_id| {
                let root = self.commitments.get(&run_id).unwrap_or_default();
                // Note: We don't store timestamp per run to save storage, returning 0 or generic
                // If timestamp is critical, we should change the map value to a struct.
                // For this example, we return 0 as placeholder or fetch block time if stored.
                (run_id, root, U64(0)) 
            })
            .collect()
    }
}

// ----------------------------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------------------------

impl Contract {
    fn assert_orchestrator(&self) {
        require!(
            env::predecessor_account_id() == self.orchestrator,
            "Unauthorized: Only orchestrator"
        );
    }

    fn internal_commit(&mut self, run_id: String, root: String, total: String) {
        // Double check replay in case of async race conditions (though processed_runs handles it)
        if self.processed_runs.get(&run_id).is_some() {
            env::panic_str("Run ID already processed during commit");
        }

        // Update State
        self.commitments.insert(&run_id, &root);
        self.processed_runs.insert(&run_id, &true);
        self.run_history.push(&run_id);

        // Emit NEP-297 Event
        // We construct JSON manually to ensure strict format without heavy struct overhead
        let event_payload = serde_json::json!({
            "standard": "nep297",
            "version": "1.0.0",
            "event": "payroll_committed",
            "data": [
                {
                    "run_id": run_id,
                    "payroll_root": root,
                    "total_amount": total,
                    "timestamp": env::block_timestamp()
                }
            ]
        });

        log!("EVENT_JSON:{}", event_payload.to_string());
    }
}

// ----------------------------------------------------------------------------
// UNIT TESTS
// ----------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{get_logs, VMContextBuilder};
    use near_sdk::testing_env;

    const ORCHESTRATOR: &str = "orchestrator.testnet";
    const VERIFIER: &str = "verifier.testnet";

    fn get_context(predecessor: &str) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(predecessor.parse().unwrap());
        builder
    }

    #[test]
    fn test_init() {
        let context = get_context(ORCHESTRATOR);
        testing_env!(context.build());
        let contract = Contract::new(ORCHESTRATOR.parse().unwrap());
        assert_eq!(contract.get_orchestrator(), ORCHESTRATOR.parse::<AccountId>().unwrap());
    }

    #[test]
    fn test_commit_trusted_flow() {
        let mut context = get_context(ORCHESTRATOR);
        testing_env!(context.build());
        
        let mut contract = Contract::new(ORCHESTRATOR.parse().unwrap());

        contract.commit_payroll(
            "run_1".to_string(),
            "0xRoot123".to_string(),
            "1000".to_string(),
            None, None, None
        );

        assert!(contract.is_run_processed("run_1".to_string()));
        assert_eq!(contract.get_run_root("run_1".to_string()).unwrap(), "0xRoot123");
        
        // Check Event
        let logs = get_logs();
        assert!(logs[0].contains("EVENT_JSON"));
        assert!(logs[0].contains("payroll_committed"));
    }

    #[test]
    #[should_panic(expected = "Unauthorized")]
    fn test_unauthorized_commit() {
        let context = get_context("hacker.testnet");
        testing_env!(context.build());
        
        let mut contract = Contract::new(ORCHESTRATOR.parse().unwrap());
        contract.commit_payroll(
            "run_bad".to_string(), "root".to_string(), "0".to_string(), None, None, None
        );
    }

    #[test]
    #[should_panic(expected = "Run ID already processed")]
    fn test_replay_protection() {
        let context = get_context(ORCHESTRATOR);
        testing_env!(context.build());
        
        let mut contract = Contract::new(ORCHESTRATOR.parse().unwrap());
        
        // First commit
        contract.commit_payroll("run_1".to_string(), "root".to_string(), "0".to_string(), None, None, None);
        
        // Replay
        contract.commit_payroll("run_1".to_string(), "root".to_string(), "0".to_string(), None, None, None);
    }
}