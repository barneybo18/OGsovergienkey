pragma circom 2.1.6;

include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * ConstitutionVerifier
 * --------------------
 * Proves that an AI agent's intent complies with its Constitution rules
 * WITHOUT revealing the private constitution parameters.
 *
 * Private inputs (hidden inside proof):
 *   - maxSpendLimit      : The agent's maximum allowed spend (u64 range)
 *   - whitelistedAddress : The only address the agent may interact with (160-bit)
 *
 * Public inputs (visible on-chain / in the proof journal):
 *   - intentAmount       : How much the agent wants to spend
 *   - targetAddress      : Where the agent wants to send funds
 *   - assetId            : Which asset the agent is operating on
 *
 * Constraints enforced:
 *   1. intentAmount <= maxSpendLimit
 *   2. targetAddress === whitelistedAddress
 */
template ConstitutionVerifier() {

    // === Public signals (exposed in the proof) ===
    signal input intentAmount;
    signal input targetAddress;
    signal input assetId;

    // === Private signals (hidden by zero-knowledge) ===
    signal input maxSpendLimit;
    signal input whitelistedAddress;

    // === Output (1 = valid, circuit will fail if constraints don't hold) ===
    signal output valid;

    // --------------------------------------------------
    // Constraint 1: intentAmount <= maxSpendLimit
    // We use LessEqThan(64) because our amounts are u64 (max 2^64 - 1)
    // --------------------------------------------------
    component spendCheck = LessEqThan(64);
    spendCheck.in[0] <== intentAmount;
    spendCheck.in[1] <== maxSpendLimit;

    // Force the comparator output to be 1 (true)
    spendCheck.out === 1;

    // --------------------------------------------------
    // Constraint 2: targetAddress === whitelistedAddress
    // Direct equality — the address is a single field element (160-bit fits in BN128)
    // --------------------------------------------------
    component addrCheck = IsEqual();
    addrCheck.in[0] <== targetAddress;
    addrCheck.in[1] <== whitelistedAddress;

    // Force the equality output to be 1 (true)
    addrCheck.out === 1;

    // --------------------------------------------------
    // Output: proof is valid
    // This is a convenience output; the real security comes from
    // the constraints above — if they fail, no valid proof exists.
    // --------------------------------------------------
    valid <== spendCheck.out * addrCheck.out;
}

component main {public [intentAmount, targetAddress, assetId]} = ConstitutionVerifier();
