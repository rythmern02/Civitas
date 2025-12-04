pragma circom 2.0.0;

include "./node_modules/circomlib/circuits/poseidon.circom";

template PayrollSum(nEmployees) {
    // Public Input: The total amount leaving the employer's wallet
    signal input totalAmount;

    // Private Inputs: The individual salaries (hidden)
    signal input salaries[nEmployees];

    // Private Inputs: Random salts to prevent brute-forcing
    signal input salts[nEmployees];

    signal output payrollHash; // Poseidon hash of (salaries || salts)

    // Running sum as a signal
    signal partial[ nEmployees + 1 ];
    partial[0] <== 0;

    for (var i = 0; i < nEmployees; i++) {
        partial[i+1] <== partial[i] + salaries[i];
    }

    signal sum;
    sum <== partial[nEmployees];

    // Enforce public total matches computed sum
    totalAmount === sum;

    // Build input array for Poseidon: interleave salary and salt
    signal poseidonInputs[2 * nEmployees];
    for (var i = 0; i < nEmployees; i++) {
        poseidonInputs[2*i] <== salaries[i];
        poseidonInputs[2*i + 1] <== salts[i];
    }

    component p = Poseidon(2 * nEmployees);
    for (var j = 0; j < 2 * nEmployees; j++) {
        p.inputs[j] <== poseidonInputs[j];
    }
    payrollHash <== p.out;
}

// Hardcode 3 employees for hackathon demo
component main { public [totalAmount]} = PayrollSum(3);
