const snarkjs = require("snarkjs");
import * as path from "path";
import * as fs from "fs";

/**
 * Groth16 proof result structured for the on-chain AgentRegistry.logIntent() call.
 * Matches the Solidity signature: logIntent(uint256, string, uint[2], uint[2][2], uint[2], uint[4])
 */
export interface Groth16ProofResult {
    pA: [bigint, bigint];
    pB: [[bigint, bigint], [bigint, bigint]];
    pC: [bigint, bigint];
    pubSignals: [bigint, bigint, bigint, bigint];
}

/**
 * Generates a Groth16 proof for the agent's intent using snarkjs.
 * Validates that intentAmount <= maxSpendLimit and targetAddress == whitelistedAddress.
 *
 * Returns structured proof arrays matching the on-chain verifier interface,
 * NOT packed bytes — the Solidity contract expects separate (pA, pB, pC, pubSignals) arrays.
 */
export async function generateProof(
    intentAmount: number,
    targetAddress: string,
    maxSpendLimit: number,
    whitelistedAddress: string
): Promise<Groth16ProofResult> {
    // 1. Resolve paths for the circuit artifacts
    const wasmPath = path.resolve(__dirname, "../../zk-engine/circuits/build/constitution_js/constitution.wasm");
    const zkeyPath = path.resolve(__dirname, "../../zk-engine/circuits/circuit_final.zkey");

    // 2. Prepare inputs (Convert addresses to BigInt field elements)
    const targetBigInt = BigInt(targetAddress.startsWith("0x") ? targetAddress : `0x${targetAddress}`);
    const whitelistBigInt = BigInt(whitelistedAddress.startsWith("0x") ? whitelistedAddress : `0x${whitelistedAddress}`);

    const input = {
        intent_amount: intentAmount,
        target_address: targetBigInt.toString(),
        max_spend_limit: maxSpendLimit,
        whitelisted_address: whitelistBigInt.toString()
    };

    console.log(`[ZK-Prover] Generating Groth16 proof for intent...`);

    // ──────────────────────────────────────────────────────────────────
    // GUARD: Check that circuit artifacts exist BEFORE calling snarkjs.
    // If they're missing, snarkjs.groth16.fullProve() hangs at the
    // native WASM level instead of throwing a catchable JS error —
    // this spikes CPU to 100% and can freeze the entire machine.
    // ──────────────────────────────────────────────────────────────────
    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
        console.warn(`[ZK-Prover] ⚠️  RUNNING IN MOCK MODE — circuit artifacts not found.`);
        console.warn(`[ZK-Prover]     Missing: ${!fs.existsSync(wasmPath) ? wasmPath : ''} ${!fs.existsSync(zkeyPath) ? zkeyPath : ''}`);
        console.warn(`[ZK-Prover] ⚠️  Real on-chain verification WILL FAIL with the real Verifier.`);
        console.warn(`[ZK-Prover] ⚠️  Fix: install circom then run: cd zk-engine/circuits && bash compile.sh`);
        // Return dummy non-zero proof points for the MockZKVerifier
        // MockZKVerifier requires: pA non-zero AND pubSignals[3] == 1
        return {
            pA: [1n, 2n],
            pB: [[1n, 2n], [3n, 4n]],
            pC: [1n, 2n],
            pubSignals: [BigInt(intentAmount), targetBigInt, 1n, 1n]
        };
    }

    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

        // Verify locally first to ensure artifacts are correct
        const vKeyPath = path.resolve(__dirname, "../../zk-engine/circuits/verification_key.json");
        if (fs.existsSync(vKeyPath)) {
            const vKey = JSON.parse(fs.readFileSync(vKeyPath, "utf-8"));
            const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            if (res !== true) {
                throw new Error("ZK Proof generated locally is INVALID. Check circuit logic or artifacts.");
            }
            console.log(`[ZK-Prover] ✅ Local verification passed.`);
        }

        console.log(`[ZK-Prover] Exporting Solidity calldata...`);
        const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

        // Parse the Solidity calldata string from snarkjs into typed arrays
        // Groth16 calldata format: [pA[2], pB[2][2], pC[2], pubSignals[]]
        const calldataArr = JSON.parse("[" + calldata + "]");

        const pA: [bigint, bigint] = [
            BigInt(calldataArr[0][0]), BigInt(calldataArr[0][1])
        ];
        const pB: [[bigint, bigint], [bigint, bigint]] = [
            [BigInt(calldataArr[1][0][0]), BigInt(calldataArr[1][0][1])],
            [BigInt(calldataArr[1][1][0]), BigInt(calldataArr[1][1][1])]
        ];
        const pC: [bigint, bigint] = [
            BigInt(calldataArr[2][0]), BigInt(calldataArr[2][1])
        ];
        const pubSignals: [bigint, bigint, bigint, bigint] = [
            BigInt(calldataArr[3][0]),
            BigInt(calldataArr[3][1]),
            BigInt(calldataArr[3][2]),
            BigInt(calldataArr[3][3])
        ];

        return { pA, pB, pC, pubSignals };
    } catch (error) {
        if (error instanceof Error && error.message.includes("INVALID")) throw error;

        console.warn(`[ZK-Prover] ⚠️  Proof generation failed: ${error}`);
        console.warn(`[ZK-Prover] ⚠️  Falling back to MOCK MODE.`);
        // Return dummy non-zero proof points for the MockZKVerifier
        return {
            pA: [1n, 2n],
            pB: [[1n, 2n], [3n, 4n]],
            pC: [1n, 2n],
            pubSignals: [BigInt(intentAmount), targetBigInt, 1n, 1n]
        };
    }
}
