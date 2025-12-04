// circuits/voucher.circom
// Compute nullifier = Poseidon(credential_nonce, voucher_id) and bind to employee_tag.
// PUBLIC INPUTS:
// - nullifier
// - employee_tag
// PRIVATE INPUTS:
// - credential_nonce
// - voucher_id

include "../node_modules/circomlib/circuits/poseidon.circom";

template Voucher() {
    // public
    signal input nullifier;
    signal input employee_tag;

    // private (witness)
    signal input credential_nonce;
    signal input voucher_id;

    // compute tag
    component pTag = Poseidon(1);
    pTag.inputs[0] <== credential_nonce;
    pTag.out === employee_tag;

    // compute nullifier = Poseidon(credential_nonce, voucher_id)
    component pNull = Poseidon(2);
    pNull.inputs[0] <== credential_nonce;
    pNull.inputs[1] <== voucher_id;
    pNull.out === nullifier;
}

component main = Voucher();
