/**
 * Trusted Setup Script for the Constitution Circuit
 * --------------------------------------------------
 * Automates the full Groth16 trusted setup:
 *
 * 1. Download/generate Powers of Tau (ptau) — universal setup
 * 2. Generate circuit-specific zkey (Phase 2)
 * 3. Contribute entropy to the ceremony
 * 4. Export the final verification key (JSON)
 * 5. Export the Solidity verifier contract
 *
 * Usage:
 *   node scripts/setup.js
 *
 * Prerequisites:
 *   - Run `npm run build:circuit` first to compile the circom circuit
 *   - snarkjs must be installed (it's a project dependency)
 */

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

const BUILD_DIR = path.join(__dirname, "..", "build");
const R1CS_PATH = path.join(BUILD_DIR, "constitution.r1cs");
const PTAU_PATH = path.join(BUILD_DIR, "pot14_final.ptau");
const ZKEY_INIT_PATH = path.join(BUILD_DIR, "constitution_0000.zkey");
const ZKEY_FINAL_PATH = path.join(BUILD_DIR, "constitution_final.zkey");
const VKEY_PATH = path.join(BUILD_DIR, "verification_key.json");
const VERIFIER_SOL_PATH = path.join(
    __dirname, "..", "..", "contracts", "contracts", "Groth16Verifier.sol"
);

async function main() {
    console.log("==================================================");
    console.log("🔧 TRUSTED SETUP — Groth16 for Constitution Circuit");
    console.log("==================================================\n");

    // Verify R1CS exists
    if (!fs.existsSync(R1CS_PATH)) {
        console.error("❌ R1CS file not found at:", R1CS_PATH);
        console.error("   Run `npm run build:circuit` first.");
        process.exit(1);
    }

    // --------------------------------------------------
    // Step 1: Powers of Tau (Phase 1 — universal ceremony)
    // Using pot14 (supports circuits up to 2^14 = 16384 constraints)
    // Our constitution circuit is tiny, so this is more than enough.
    // --------------------------------------------------
    console.log("📦 Step 1: Generating Powers of Tau (2^14)...");
    if (!fs.existsSync(PTAU_PATH)) {
        // Start a new ceremony
        await snarkjs.powersOfTau.newAccumulator(
            snarkjs.bn128,      // BN128 curve
            14,                 // 2^14 constraints max
            path.join(BUILD_DIR, "pot14_0000.ptau")
        );

        // Contribute randomness
        await snarkjs.powersOfTau.contribute(
            path.join(BUILD_DIR, "pot14_0000.ptau"),
            path.join(BUILD_DIR, "pot14_0001.ptau"),
            "SovereignAgentKeys_Contribution_1",
            "sovereign-agent-random-entropy-" + Date.now()
        );

        // Apply beacon (deterministic finalization for reproducibility)
        await snarkjs.powersOfTau.beacon(
            path.join(BUILD_DIR, "pot14_0001.ptau"),
            path.join(BUILD_DIR, "pot14_beacon.ptau"),
            "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
            10,                 // numIterationsExp
            "Final Beacon"
        );

        // Prepare Phase 2
        await snarkjs.powersOfTau.preparePhase2(
            path.join(BUILD_DIR, "pot14_beacon.ptau"),
            PTAU_PATH
        );

        // Cleanup intermediate files
        for (const f of ["pot14_0000.ptau", "pot14_0001.ptau", "pot14_beacon.ptau"]) {
            const fp = path.join(BUILD_DIR, f);
            if (fs.existsSync(fp)) fs.unlinkSync(fp);
        }

        console.log("   ✅ Powers of Tau generated and finalized.\n");
    } else {
        console.log("   ✅ Powers of Tau already exists, skipping.\n");
    }

    // --------------------------------------------------
    // Step 2: Circuit-specific setup (Phase 2 — Groth16 zkey)
    // --------------------------------------------------
    console.log("🔑 Step 2: Generating circuit-specific proving key (zkey)...");

    await snarkjs.zKey.newZKey(R1CS_PATH, PTAU_PATH, ZKEY_INIT_PATH);

    // Contribute to Phase 2
    await snarkjs.zKey.contribute(
        ZKEY_INIT_PATH,
        ZKEY_FINAL_PATH,
        "SovereignAgent_Phase2",
        "sovereign-agent-phase2-entropy-" + Date.now()
    );

    // Cleanup initial zkey
    if (fs.existsSync(ZKEY_INIT_PATH)) fs.unlinkSync(ZKEY_INIT_PATH);

    console.log("   ✅ Proving key (zkey) generated.\n");

    // --------------------------------------------------
    // Step 3: Export verification key (JSON)
    // --------------------------------------------------
    console.log("📤 Step 3: Exporting verification key...");
    const vkey = await snarkjs.zKey.exportVerificationKey(ZKEY_FINAL_PATH);
    fs.writeFileSync(VKEY_PATH, JSON.stringify(vkey, null, 2));
    console.log("   ✅ Verification key saved to:", VKEY_PATH, "\n");

    // --------------------------------------------------
    // Step 4: Export Solidity verifier contract
    // --------------------------------------------------
    console.log("📜 Step 4: Exporting Solidity Groth16 verifier...");
    const solidityVerifier = await snarkjs.zKey.exportSolidityVerifier(
        ZKEY_FINAL_PATH,
        {
            groth16: fs.readFileSync(
                path.join(require.resolve("snarkjs"), "..", "templates", "verifier_groth16.sol.ejs"),
                "utf-8"
            ),
        }
    );
    fs.writeFileSync(VERIFIER_SOL_PATH, solidityVerifier);
    console.log("   ✅ Solidity verifier saved to:", VERIFIER_SOL_PATH, "\n");

    console.log("==================================================");
    console.log("🎉 TRUSTED SETUP COMPLETE!");
    console.log("==================================================");
    console.log("\nNext steps:");
    console.log("  1. npm run prove     — Generate a test proof");
    console.log("  2. npm run verify    — Verify the proof locally");
    console.log("  3. Deploy Groth16Verifier.sol to 0G Chain");
}

main().catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
});
