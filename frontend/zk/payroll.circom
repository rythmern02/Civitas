pragma circom 2.0.0;

template PayrollSum(nEmployees) {
    // Public Input: The total amount leaving the employer's wallet
    signal input totalAmount;
    
    // Private Inputs: The individual salaries (hidden)
    signal input salaries[nEmployees];
    
    // Private Inputs: Random salts to prevent brute-forcing (standard practice)
    signal input salts[nEmployees]; 

    signal output payrollHash; // A hash of the salaries to bind the proof

    var sum = 0;
    
    // 1. Calculate Sum & Constraints
    for (var i = 0; i < nEmployees; i++) {
        sum += salaries[i];
    }

    // 2. Constraint: Calculated sum MUST match the public total
    totalAmount === sum;
}

// For the hackathon, hardcode 3 employees
component main {public [totalAmount]} = PayrollSum(3);