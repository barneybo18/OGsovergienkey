import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy Script for Sovereign Agent Keys
 * 
 * Deploys:
 *   1. Verifier        — real Groth16 verifier (exported from snarkjs/circom)
 *   2. MockZKVerifier  — placeholder verifier (accepts any non-empty proof)
 *   3. AgentRegistry   — the core registry, linked to the real verifier
 *
 * Usage:
 *   Local:   npx hardhat run scripts/deploy.ts
 *   Testnet: npx hardhat run scripts/deploy.ts --network 0g-testnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==========================================================");
  console.log("🗝️  SOVEREIGN AGENT KEYS — CONTRACT DEPLOYMENT");
  console.log("==========================================================");
  console.log(`Deployer address : ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance : ${ethers.formatEther(balance)} 0G`);
  console.log("----------------------------------------------------------\n");

  // ── Step 1: Deploy Real ZK Verifier (Groth16 from snarkjs) ────
  console.log("📦 Deploying Verifier (Groth16)...");
  const Verifier = await ethers.getContractFactory("Verifier");
  const realVerifier = await Verifier.deploy();
  await realVerifier.waitForDeployment();
  const realVerifierAddress = await realVerifier.getAddress();
  console.log(`✅ Verifier (Real) deployed at: ${realVerifierAddress}\n`);

  // ── Step 2: Deploy MockZKVerifier (Legacy support) ────────────
  console.log("📦 Deploying MockZKVerifier...");
  const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
  const mockVerifier = await MockZKVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();
  console.log(`✅ MockZKVerifier deployed at: ${mockVerifierAddress}\n`);

  // ── Step 3: Deploy AgentRegistry (linked to Real Verifier) ────
  console.log("📦 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(realVerifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ AgentRegistry deployed at : ${registryAddress}\n`);

  // ── Step 4: Save addresses for ai-orchestrator and mission-control
  const addresses = {
    Verifier: realVerifierAddress,
    MockZKVerifier: mockVerifierAddress,
    AgentRegistry: registryAddress,
  };

  const configPath = path.join(__dirname, "..", "addresses.json");
  fs.writeFileSync(configPath, JSON.stringify(addresses, null, 2));
  console.log(`✅ Addresses saved to ${configPath}`);

  // ── Summary ───────────────────────────────────────────────────
  console.log("==========================================================");
  console.log("🎉 DEPLOYMENT COMPLETE — save these addresses!");
  console.log("==========================================================");
  console.log(`Verifier       : ${realVerifierAddress}`);
  console.log(`MockZKVerifier : ${mockVerifierAddress}`);
  console.log(`AgentRegistry  : ${registryAddress}`);
  console.log(`\n🔗 View on 0G Explorer:`);
  console.log(`   https://chainscan-galileo.0g.ai/address/${realVerifierAddress}`);
  console.log(`   https://chainscan-galileo.0g.ai/address/${registryAddress}`);
  console.log("==========================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
