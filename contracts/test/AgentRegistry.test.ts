import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry, MockZKVerifier } from "../typechain-types";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;
  let verifier: MockZKVerifier;
  let owner: any;
  let other: any;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();

    // Deploy mock verifier
    const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
    verifier = await MockZKVerifier.deploy();
    await verifier.waitForDeployment();

    // Deploy registry with verifier
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy(await verifier.getAddress());
    await registry.waitForDeployment();
  });

  describe("Agent Registration", function () {
    it("should register a new agent and emit event", async function () {
      const pubKey = "0x04abcdef1234567890";
      const constitutionHash = "QmXoYpZiJq7tY9mMkdW8qEYQhdSaKfPGg2R2ninS5FkRA";

      await expect(registry.registerAgent(pubKey, constitutionHash))
        .to.emit(registry, "AgentRegistered")
        .withArgs(1, owner.address, pubKey, constitutionHash);

      const agent = await registry.agents(1);
      expect(agent.owner).to.equal(owner.address);
      expect(agent.pubKey).to.equal(pubKey);
      expect(agent.constitutionHash).to.equal(constitutionHash);
      expect(agent.isActive).to.be.true;
    });

    it("should increment agent IDs", async function () {
      await registry.registerAgent("key1", "hash1");
      await registry.registerAgent("key2", "hash2");

      const agent1 = await registry.agents(1);
      const agent2 = await registry.agents(2);
      expect(agent1.pubKey).to.equal("key1");
      expect(agent2.pubKey).to.equal("key2");
    });
  });

  describe("Constitution Updates", function () {
    beforeEach(async function () {
      await registry.registerAgent("key1", "hash1");
    });

    it("should allow owner to update constitution", async function () {
      const newHash = "QmNewConstitutionHash";
      await expect(registry.updateConstitution(1, newHash))
        .to.emit(registry, "ConstitutionUpdated")
        .withArgs(1, newHash);

      const agent = await registry.agents(1);
      expect(agent.constitutionHash).to.equal(newHash);
    });

    it("should reject constitution update from non-owner", async function () {
      await expect(
        registry.connect(other).updateConstitution(1, "bad-hash")
      ).to.be.revertedWith("Not the agent owner");
    });
  });

  describe("Intent Logging", function () {
    beforeEach(async function () {
      await registry.registerAgent("key1", "hash1");
    });

    it("should log intent with valid (mock) ZK proof", async function () {
      const intentDataId = "0g-da-root-hash-abc123";
      const pubInputs = [800n, 1n]; // amount, asset_id
      const mockProof = ethers.toUtf8Bytes("valid-proof-bytes");

      await expect(registry.logIntent(1, intentDataId, pubInputs, mockProof))
        .to.emit(registry, "IntentLogged")
        .withArgs(1, intentDataId);
    });

    it("should reject empty ZK proof", async function () {
      await expect(
        registry.logIntent(1, "intent-id", [800n], "0x")
      ).to.be.revertedWith("Proof cannot be empty");
    });

    it("should reject intent for inactive agent", async function () {
      // Agent ID 99 doesn't exist → isActive is false by default
      await expect(
        registry.logIntent(99, "intent-id", [800n], ethers.toUtf8Bytes("proof"))
      ).to.be.revertedWith("Agent is inactive");
    });
  });
});
