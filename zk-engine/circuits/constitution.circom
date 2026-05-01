pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template Constitution() {
    // Private inputs
    signal input intent_amount;
    signal input target_address;

    // Public inputs
    signal input max_spend_limit;
    signal input whitelisted_address;

    // Outputs
    signal output committed_amount;
    signal output committed_address;

    // 1. Constraint: target_address === whitelisted_address
    target_address === whitelisted_address;

    // 2. Constraint: intent_amount <= max_spend_limit
    // Using LessEqThan from circomlib (standard way to do <=)
    // We use 64 bits to safely cover standard amount ranges
    component leq = LessEqThan(64);
    leq.in[0] <== intent_amount;
    leq.in[1] <== max_spend_limit;
    leq.out === 1;

    // Assign outputs
    committed_amount <== intent_amount;
    committed_address <== target_address;
}

component main { public [max_spend_limit, whitelisted_address] } = Constitution();
