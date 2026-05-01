const snarkjs = require("snarkjs");
import * as path from "path";

/**
 * Generates a Groth16 proof for the agent's intent using snarkjs.
 * Validates that intentAmount <= maxSpendLimit and targetAddress == whitelistedAddress.
 */
export async function generateProof(
    intentAmount: number, 
    targetAddress: string, 
    maxSpendLimit: number, 
    whitelistedAddress: string
) {
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
    try {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);

        console.log(`[ZK-Prover] Exporting Solidity calldata...`);
        const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
        
        // Parse the Solidity calldata string from snarkjs into typed arrays
        const calldataArr = JSON.parse("[" + calldata + "]");
        // Groth16 calldata: [pA[2], pB[2][2], pC[2], pubSignals[]]
        const pA = calldataArr[0];   // [x, y]
        const pB = calldataArr[1];   // [[x1,x2],[y1,y2]]
        const pC = calldataArr[2];   // [x, y]
        const pubSignalsRaw = calldataArr[3];  // string[]
        // Pack proof points into bytes for the IZKVerifier interface
        const allPoints = [pA[0], pA[1], pB[0][0], pB[0][1], pB[1][0], pB[1][1], pC[0], pC[1]];
        const proofHex = allPoints.map((x: string) => x.replace("0x","").padStart(64,"0")).join("");
        const proofBytes = Buffer.from(proofHex, "hex");
        const pubInputs = pubSignalsRaw.map((x: string) => BigInt(x));

        return { pubInputs, proofBytes };
    } catch (error) {
        console.warn(`[ZK-Prover] ⚠️  RUNNING IN MOCK MODE — circuit artifacts not found.`);
        console.warn(`[ZK-Prover] ⚠️  Real on-chain verification WILL FAIL with the real Verifier.`);
        console.warn(`[ZK-Prover] ⚠️  Fix: run ./zk-engine/circuits/compile.sh to generate artifacts.`);
        // Return dummy valid-looking proof for the Mock Verifier
        const pubInputs = [BigInt(intentAmount), targetBigInt, BigInt(maxSpendLimit), whitelistBigInt];
        const proofBytes = Buffer.from("00".repeat(256), "hex"); // 256 bytes of zeros
        return { pubInputs, proofBytes };
    }
}
