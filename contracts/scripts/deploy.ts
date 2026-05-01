import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Preparing to deploy Sovereign Agent Keys contracts...");

  // 1. Deploy Real ZK Verifier (Groth16 from snarkjs)
  const Verifier = await ethers.getContractFactory("Verifier");
  const realVerifier = await Verifier.deploy();
  await realVerifier.waitForDeployment();
  const realVerifierAddress = await realVerifier.getAddress();
  console.log(`✅ Verifier (Real) deployed to: ${realVerifierAddress}`);

  // 2. Deploy Mock ZK Verifier (Legacy support)
  const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
  const mockVerifier = await MockZKVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();
  console.log(`✅ MockZKVerifier deployed to: ${mockVerifierAddress}`);

  // 3. Deploy AgentRegistry (linked to Real Verifier)
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(realVerifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`✅ AgentRegistry deployed to: ${registryAddress}`);

  // 4. Save addresses for ai-orchestrator and mission-control
  const addresses = {
    Verifier: realVerifierAddress,
    MockZKVerifier: mockVerifierAddress,
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
