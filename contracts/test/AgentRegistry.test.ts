import { expect } from "chai";
import { ethers } from "hardhat";
import { AgentRegistry, MockZKVerifier } from "../typechain-types";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;
  let verifier: MockZKVerifier;
  let owner: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    // Deploy mock verifier (for test purposes — real Verifier requires valid Groth16 proofs)
    const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
    verifier = await MockZKVerifier.deploy();
    await verifier.waitForDeployment();

    // Deploy registry with verifier
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    registry = await AgentRegistry.deploy(await verifier.getAddress());
    await registry.waitForDeployment();
  });

  describe("Registration", function () {
    it("should register a new agent and emit event", async function () {
      const pubKey = ethers.encodeBytes32String("sak_pub_123");
      const constitutionHash = ethers.encodeBytes32String("0x-storage-root");

      await expect(registry.registerAgent(pubKey, constitutionHash))
        .to.emit(registry, "AgentRegistered")
        .withArgs(1, owner.address, pubKey, constitutionHash);

      const agent = await registry.agents(1);
      expect(agent.owner).to.equal(owner.address);
      expect(agent.pubKeyHash).to.equal(pubKey);
      expect(agent.isActive).to.be.true;
    });

    it("should fail if operator is not authorized", async function () {
      const pubKey = ethers.encodeBytes32String("sak_pub_123");
      const constitutionHash = ethers.encodeBytes32String("hash");
      
      await expect(registry.connect(otherAccount).registerAgent(pubKey, constitutionHash))
        .to.be.revertedWith("Not authorized");
    });

    it("should increment agent IDs", async function () {
      const key1 = ethers.encodeBytes32String("key1");
      const key2 = ethers.encodeBytes32String("key2");
      const hash1 = ethers.encodeBytes32String("hash1");
      const hash2 = ethers.encodeBytes32String("hash2");

      await registry.registerAgent(key1, hash1);
      await registry.registerAgent(key2, hash2);

      const agent1 = await registry.agents(1);
      const agent2 = await registry.agents(2);
      expect(agent1.pubKeyHash).to.equal(key1);
      expect(agent2.pubKeyHash).to.equal(key2);
    });
  });

  describe("Constitution Updates", function () {
    beforeEach(async function () {
      const pubKey = ethers.encodeBytes32String("key1");
      const hash = ethers.encodeBytes32String("hash1");
      await registry.registerAgent(pubKey, hash);
    });

    it("should allow owner to update constitution", async function () {
      const newHash = ethers.encodeBytes32String("new-constitution");
      await expect(registry.updateConstitution(1, newHash))
        .to.emit(registry, "ConstitutionUpdated")
        .withArgs(1, newHash);

      const agent = await registry.agents(1);
      expect(agent.constitutionHash).to.equal(newHash);
    });

    it("should reject constitution update from non-owner", async function () {
      const newHash = ethers.encodeBytes32String("bad-hash");
      await expect(
        registry.connect(otherAccount).updateConstitution(1, newHash)
      ).to.be.revertedWith("Not the agent owner");
    });
  });

  describe("Intent Logging", function () {
    beforeEach(async function () {
      const pubKey = ethers.encodeBytes32String("pubkey");
      const constitutionHash = ethers.encodeBytes32String("hash");
      await registry.registerAgent(pubKey, constitutionHash);
    });

    it("should log intent with valid (mock) ZK proof", async function () {
      const intentDataId = "da-root-456";
      // Mock Groth16 proof points (MockZKVerifier accepts anything)
      const pA: [bigint, bigint] = [1n, 2n];
      const pB: [[bigint, bigint], [bigint, bigint]] = [[1n, 2n], [3n, 4n]];
      const pC: [bigint, bigint] = [1n, 2n];
      const pubSignals: [bigint, bigint, bigint, bigint] = [800n, 100n, 1n, 1n];

      await expect(registry.logIntent(1, intentDataId, pA, pB, pC, pubSignals))
        .to.emit(registry, "IntentLogged")
        .withArgs(1, intentDataId);
    });

    it("should reject intent for inactive agent", async function () {
      await registry.deactivateAgent(1);
      const pA: [bigint, bigint] = [1n, 2n];
      const pB: [[bigint, bigint], [bigint, bigint]] = [[1n, 2n], [3n, 4n]];
      const pC: [bigint, bigint] = [1n, 2n];
      const pubSignals: [bigint, bigint, bigint, bigint] = [800n, 100n, 1n, 1n];

      await expect(
        registry.logIntent(1, "intent-id", pA, pB, pC, pubSignals)
      ).to.be.revertedWith("Agent is inactive");
    });

    it("should fail if not the agent owner", async function () {
      const pA: [bigint, bigint] = [1n, 2n];
      const pB: [[bigint, bigint], [bigint, bigint]] = [[1n, 2n], [3n, 4n]];
      const pC: [bigint, bigint] = [1n, 2n];
      const pubSignals: [bigint, bigint, bigint, bigint] = [800n, 100n, 1n, 1n];

      await expect(
        registry.connect(otherAccount).logIntent(1, "data", pA, pB, pC, pubSignals)
      ).to.be.revertedWith("Not the agent owner");
    });
  });

  describe("Management", function () {
    it("should allow deactivating an agent", async function () {
      const pubKey = ethers.encodeBytes32String("pubkey");
      const constitutionHash = ethers.encodeBytes32String("hash");
      await registry.registerAgent(pubKey, constitutionHash);

      await expect(registry.deactivateAgent(1))
        .to.emit(registry, "AgentDeactivated")
        .withArgs(1);
      
      const agent = await registry.getAgent(1);
      expect(agent.isActive).to.be.false;
    });
  });
});
