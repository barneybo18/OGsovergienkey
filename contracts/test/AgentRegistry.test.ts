import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry, Verifier } from "../typechain-types";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;
  let verifier: Verifier;
  let owner: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    const VerifierFactory = await ethers.getContractFactory("Verifier");
    verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();

    const RegistryFactory = await ethers.getContractFactory("AgentRegistry");
    registry = await RegistryFactory.deploy(await verifier.getAddress());
    await registry.waitForDeployment();
  });

  describe("Registration", function () {
    it("Should register a new agent correctly", async function () {
      const pubKey = "sak_pub_123";
      const constitutionHash = "0x-storage-root";

      await expect(registry.registerAgent(pubKey, constitutionHash))
        .to.emit(registry, "AgentRegistered")
        .withArgs(1, owner.address, pubKey, constitutionHash);

      const agent = await registry.agents(1);
      expect(agent.owner).to.equal(owner.address);
      expect(agent.pubKey).to.equal(pubKey);
      expect(agent.isActive).to.be.true;
    });
  });

  describe("Intent Logging", function () {
    it("Should allow logging an intent with a valid proof", async function () {
      await registry.registerAgent("pubkey", "hash");
      
      const intentDataId = "da-root-456";
      const pubInputs = [100, 200];
      const proof = ethers.toUtf8Bytes("mock-proof");

      await expect(registry.logIntent(1, intentDataId, pubInputs, proof))
        .to.emit(registry, "IntentLogged")
        .withArgs(1, intentDataId);
    });

    it("Should fail if agent is inactive", async function () {
      // In this version of the contract, we don't have a deactivate function yet
      // but we can test the basic requirement.
      const pubInputs = [100];
      const proof = ethers.toUtf8Bytes("proof");
      
      // Agent 99 doesn't exist/is inactive by default
      await expect(registry.logIntent(99, "data", pubInputs, proof))
        .to.be.revertedWith("Agent is inactive");
    });
  });
});
