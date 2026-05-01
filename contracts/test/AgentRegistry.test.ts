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

    it("Should fail if operator is not authorized", async function () {
        const pubKey = ethers.encodeBytes32String("sak_pub_123");
        const constitutionHash = ethers.encodeBytes32String("hash");
        
        await expect(registry.connect(otherAccount).registerAgent(pubKey, constitutionHash))
          .to.be.revertedWith("Not authorized");
    });
  });

  describe("Intent Logging", function () {
    it("Should allow logging an intent with a valid proof", async function () {
      const pubKey = ethers.encodeBytes32String("pubkey");
      const constitutionHash = ethers.encodeBytes32String("hash");
      await registry.registerAgent(pubKey, constitutionHash);
      
      const intentDataId = "da-root-456";
      const pubInputs = [100, 200];
      const proof = ethers.toUtf8Bytes("mock-proof");

      await expect(registry.logIntent(1, intentDataId, pubInputs, proof))
        .to.emit(registry, "IntentLogged")
        .withArgs(1, intentDataId);
    });

    it("Should fail if not the agent owner", async function () {
        const pubKey = ethers.encodeBytes32String("pubkey");
        const constitutionHash = ethers.encodeBytes32String("hash");
        await registry.registerAgent(pubKey, constitutionHash);

        await expect(registry.connect(otherAccount).logIntent(1, "data", [100], ethers.toUtf8Bytes("proof")))
          .to.be.revertedWith("Not the agent owner");
    });
  });

  describe("Management", function () {
      it("Should allow deactivating an agent", async function () {
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
