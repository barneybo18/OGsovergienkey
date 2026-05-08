const { expect } = require("chai");
const snarkjs = require("snarkjs");
const path = require("path");

/**
 * Circuit Unit Tests
 * These tests validate the logic of constitution.circom
 * Note: Requires circuit artifacts to be compiled in zk-engine/circuits/build/
 */
describe("Constitution Circuit", function () {
    this.timeout(100000);

    it("Should accept valid intent within spend limits", async function () {
        const input = {
            intent_amount: 800,
            target_address: BigInt("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef").toString(),
            max_spend_limit: 1000,
            whitelisted_address: BigInt("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef").toString()
        };

        const wasmPath = path.join(__dirname, "../circuits/build/constitution_js/constitution.wasm");
        const zkeyPath = path.join(__dirname, "../circuits/circuit_final.zkey");

        try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
            expect(publicSignals).to.be.an("array");
            // Order: [committed_amount, committed_address, max_spend_limit, whitelisted_address]
            expect(publicSignals[0]).to.equal("800"); 
            expect(publicSignals[2]).to.equal("1000");
        } catch (e) {
            if (e.message.includes("ENOENT")) {
                this.skip(); // Skip if artifacts are missing
            } else {
                throw e;
            }
        }
    });

    it("Should reject intent exceeding spend limit", async function () {
        const input = {
            intent_amount: 1200, // Over limit
            target_address: BigInt("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef").toString(),
            max_spend_limit: 1000,
            whitelisted_address: BigInt("0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef").toString()
        };

        const wasmPath = path.join(__dirname, "../circuits/build/constitution_js/constitution.wasm");
        const zkeyPath = path.join(__dirname, "../circuits/circuit_final.zkey");

        try {
            await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
            throw new Error("Should have reverted");
        } catch (e) {
            if (e.message.includes("ENOENT")) {
                this.skip();
            } else {
                expect(e.message).to.include("Assert Failed");
            }
        }
    });
});
