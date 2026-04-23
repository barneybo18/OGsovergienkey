import { ethers } from "hardhat";

/**
 * Deploy Script for Sovereign Agent Keys
 * 
 * Deploys:
 *   1. MockZKVerifier  — placeholder verifier (accepts any non-empty proof)
 *   2. AgentRegistry   — the core registry, linked to the verifier
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

  // ── Step 1: Deploy MockZKVerifier ─────────────────────────────
  console.log("📦 Deploying MockZKVerifier...");
  const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
  const verifier = await MockZKVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ MockZKVerifier deployed at: ${verifierAddress}\n`);

  // ── Step 2: Deploy AgentRegistry ──────────────────────────────
  console.log("📦 Deploying AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(verifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ AgentRegistry deployed at : ${registryAddress}\n`);

  // ── Summary ───────────────────────────────────────────────────
  console.log("==========================================================");
  console.log("🎉 DEPLOYMENT COMPLETE — save these addresses!");
  console.log("==========================================================");
  console.log(`MockZKVerifier : ${verifierAddress}`);
  console.log(`AgentRegistry  : ${registryAddress}`);
  console.log(`\n🔗 View on 0G Explorer:`);
  console.log(`   https://chainscan-galileo.0g.ai/address/${verifierAddress}`);
  console.log(`   https://chainscan-galileo.0g.ai/address/${registryAddress}`);
  console.log("==========================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
