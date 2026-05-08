/**
 * Sovereign Agent Verifier — snarkjs Groth16
 * -------------------------------------------
 * Standalone verification utility.
 * Reads a proof from build/latest_proof.json and verifies it against the verification key.
 *
 * Usage:
 *   npm run verify
 */

import * as snarkjs from "snarkjs";
import * as path from "path";
import * as fs from "fs";
import { ProofPackage, bigIntToAddress } from "./types";

const BUILD_DIR = path.join(__dirname, "..", "build");
const VKEY_PATH = path.join(BUILD_DIR, "verification_key.json");
const PROOF_PATH = path.join(BUILD_DIR, "latest_proof.json");

async function main() {
    console.log("==================================================");
    console.log("🔍 SOVEREIGN AGENT ZK VERIFIER — snarkjs Groth16");
    console.log("==================================================\n");

    // Load verification key
    if (!fs.existsSync(VKEY_PATH)) {
        console.error("❌ Verification key not found. Run `npm run setup` first.");
        process.exit(1);
    }
    const vkey = JSON.parse(fs.readFileSync(VKEY_PATH, "utf-8"));

    // Load proof
    if (!fs.existsSync(PROOF_PATH)) {
        console.error("❌ No proof file found. Run `npm run prove` first.");
        process.exit(1);
    }
    const proofPkg: ProofPackage = JSON.parse(fs.readFileSync(PROOF_PATH, "utf-8"));

    console.log("📋 Public signals from proof:");
    console.log(`   intentAmount   = ${proofPkg.publicSignals[0]}`);
    console.log(`   targetAddress  = ${bigIntToAddress(BigInt(proofPkg.publicSignals[1]))}`);
    console.log(`   assetId        = ${proofPkg.publicSignals[2]}`);
    console.log(`   valid          = ${proofPkg.publicSignals[3]}\n`);

    // Verify
    console.log("⏳ Verifying Groth16 proof...\n");
    const isValid = await snarkjs.groth16.verify(
        vkey,
        proofPkg.publicSignals,
        proofPkg.proof
    );

    if (isValid) {
        console.log("✅ Proof is VALID — Agent intent complies with Constitution.");
    } else {
        console.error("❌ Proof is INVALID — Agent violated Constitution constraints.");
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
