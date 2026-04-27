import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Preparing to deploy Sovereign Agent Keys contracts...");

  // 1. Deploy Mock ZK Verifier
  const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
  const verifier = await MockZKVerifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log(`✅ MockZKVerifier deployed to: ${verifierAddress}`);

  // 2. Deploy AgentRegistry
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(verifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ AgentRegistry deployed to: ${registryAddress}`);

  // 3. Save addresses for ai-orchestrator and mission-control
  const addresses = {
    MockZKVerifier: verifierAddress,
    AgentRegistry: registryAddress,
  };

  const configPath = path.join(__dirname, "..", "addresses.json");
  fs.writeFileSync(configPath, JSON.stringify(addresses, null, 2));
  console.log(`✅ Addresses saved to ${configPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
