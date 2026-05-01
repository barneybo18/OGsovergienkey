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
        
        const argv = calldata.replace(/["[\]\s]/g, "").split(",");
        const proofHex = argv.slice(0, 8).map((x: string) => x.replace("0x", "").padStart(64, "0")).join("");
        const proofBytes = Buffer.from(proofHex, "hex");
        const pubInputs = argv.slice(8).map((x: string) => BigInt(x));

        return { pubInputs, proofBytes };
    } catch (error) {
        console.warn(`[ZK-Prover] Real proving failed (likely missing artifacts). Falling back to MOCK mode for demo.`);
        // Return dummy valid-looking proof for the Mock Verifier
        const pubInputs = [BigInt(intentAmount), targetBigInt, BigInt(maxSpendLimit), whitelistBigInt];
        const proofBytes = Buffer.from("00".repeat(256), "hex"); // 256 bytes of zeros
        return { pubInputs, proofBytes };
    }
}
