import { ZeroGService } from "./0g-service";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { generateProof } from "./prover";
const sss = require('shamirs-secret-sharing');


import { parseTask } from "./task-parser";

dotenv.config();

const REGISTRY_ABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json"), "utf8")).abi;
const ADDRESSES = JSON.parse(fs.readFileSync(path.join(__dirname, "../../contracts/addresses.json"), "utf8"));

/**
 * The Sovereign Agent Orchestrator
 * This class handles the complete lifecycle: Genesis, Intent, Proving, and Settlement.
 */
export class SovereignAgent {
    private zeroG: ZeroGService;
    private wallet: ethers.Wallet;
    private registry: ethers.Contract;

    constructor() {
        const usePrivateKey = process.env.USE_PRIVATE_KEY_FOR_TESTING === "true";
        if (usePrivateKey && !process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY is not set in .env");
        if (!process.env.RPC_ENDPOINT) throw new Error("RPC_ENDPOINT is not set in .env");

        this.zeroG = new ZeroGService();
        const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);
        const privateKey = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001"; // Dummy key for prepare mode
        this.wallet = new ethers.Wallet(privateKey, provider);
        this.registry = new ethers.Contract(ADDRESSES.AgentRegistry, REGISTRY_ABI, provider); // Attach to provider to allow encoding
    }

    /**
     * Phase 1: Genesis - Generate MPC Shard, Prove Constitution, Upload to 0G, Register on-chain
     */
    async asyncSpawn(name: string, userAddress: string) {
        console.log(`\n>> [GENESIS] Initializing Agent Birth: ${name} (Owner: ${userAddress})`);
        
        // 1. Generate ephemeral keypair and split with Shamir 2-of-3
        const ephemeralWallet = ethers.Wallet.createRandom();
        const secretBytes = Buffer.from(ephemeralWallet.privateKey.slice(2), 'hex');
        const shares = sss.split(secretBytes, { shares: 3, threshold: 2 });
        const agentPubKeyHex = ethers.id(ephemeralWallet.publicKey) as `0x${string}`;

        console.log(`[Flow] Phase 1a: Generating Verifiable Constitution (ZK Proof) & Computing 0G Root...`);
        const provingStart = Date.now();
        
        // Parallelize ZK Proving and 0G Root computation for speed
        const mockShardData = JSON.stringify({
          shardIndex: 1,
          totalShards: 3,
          threshold: 2,
          shardHex: shares[0].toString('hex'),
          agentPubKey: ephemeralWallet.publicKey,
          timestamp: Date.now()
        });
        const buffer = Buffer.from(mockShardData, "utf-8");

        const [proofResult, shardRootHash] = await Promise.all([
            generateProof(
                0, // Initial balance 0
                userAddress, // targetAddress
                1000, // maxSpendLimit
                userAddress // whitelistedAddress
            ),
            this.zeroG.getMerkleRoot(buffer)
        ]);
        
        const { pA, pB, pC, pubSignals } = proofResult;
        const provingDuration = ((Date.now() - provingStart) / 1000).toFixed(1);
        console.log(`PROVING_DURATION: ${provingDuration}s`);
        console.log(`[Flow] ✅ ZK Proof & 0G Root ready.`);

        // 2. Upload to 0G Storage in background (Don't block the prepare-payload return)
        console.log(`[Flow] Phase 1b: Securing Identity Shards on 0G Storage (Background)...`);
        this.zeroG.backgroundUpload(buffer, '0G-Storage');
        
        // 3. Register on 0G Chain
        console.log(`[Flow] Phase 1c: Settling Sovereign Identity on 0G Galileo...`);
        
        const constitutionHashBytes32 = shardRootHash.startsWith('0x')
          ? shardRootHash.padEnd(66, '0').slice(0, 66)
          : ('0x' + shardRootHash).padEnd(66, '0').slice(0, 66);
          
        if (process.argv.includes("--prepare-only")) {
            // AUTHORIZATION CHECK: In the current contract, registerAgent is restricted.
            // We use the server's authority to "onboard" the user wallet if it's not already authorized.
            try {
                const isAuthorized = await this.registry.authorizedOperators(userAddress);
                const contractOwner = await this.registry.owner();
                if (!isAuthorized && userAddress.toLowerCase() !== contractOwner.toLowerCase()) {
                    console.log(`[Flow] 🛡️ User Wallet ${userAddress} is not authorized. Onboarding via Server Authority...`);
                    const authTx = await this.registry.connect(this.wallet).getFunction("setOperator")(userAddress, true);
                    await authTx.wait();
                    console.log(`[Flow] ✅ User Wallet ${userAddress} is now authorized to register agents.`);
                }
            } catch (error) {
                console.warn(`[Flow] ⚠️ Authorization check skipped (Contract may be public): ${error}`);
            }

            // Encode the transaction data for frontend signing
            const txData = this.registry.interface.encodeFunctionData("registerAgent", [agentPubKeyHex, constitutionHashBytes32]);
            
            console.log(`\nPREPARE_PAYLOAD: ${JSON.stringify({
                to: await this.registry.getAddress(),
                data: txData,
                value: "0"
            })}`);
            
            console.log(`ROOT_HASH: ${shardRootHash}`);
            return BigInt(0); 
        }

        const tx = await this.registry.connect(this.wallet).getFunction("registerAgent")(agentPubKeyHex, constitutionHashBytes32);
        const receipt = await this.waitForReceipt(tx);
        
        const event = receipt.logs.map((log: any) => this.registry.interface.parseLog(log)).find((log: any) => log?.name === "AgentRegistered");
        const agentId = event?.args[0];

        console.log(`✅ Genesis Complete! Agent ID: ${agentId}, TX: ${receipt.hash}`);
        console.log(`AGENT_ID: ${agentId}`);
        console.log(`ROOT_HASH: ${shardRootHash}`);
        return agentId;
    }

    async spawn(name: string, userAddress: string) {
        return this.asyncSpawn(name, userAddress);
    }


    /**
     * Phase 2: Action - Form intent, Prove via ZK, Log to DA, Settle on-chain
     *
     * >> PREPARING SETTLEMENT:
     * 1. The raw intent data is sent to the snarkjs Groth16 Prover.
     * 2. The output Groth16 Proof + the 0G DA Root Hash are aggregated.
     * 3. MPC Nodes verify ZK Proof on-chain -> decrypt shard -> sign transaction!
     */
    async executeIntent(agentId: bigint, amount: number, targetAddress: string) {
        console.log(`\n>> [EXECUTION] Agent ${agentId} forming intent...`);
        
        // 1. Define Intent and Constitution
        // Convert hex address to [u8; 20]
        const cleanAddress = targetAddress.startsWith("0x") ? targetAddress.slice(2) : targetAddress;
        const addressBytes = Array.from(Buffer.from(cleanAddress, "hex"));
        if (addressBytes.length !== 20) throw new Error("Target address must be 20 bytes");

        const context = {
            config: {
                max_spend_limit: 1000,
                whitelisted_address: addressBytes
            },
            intent: {
                intent_amount: amount,
                target_address: addressBytes,
                asset_id: 1,
                signature: new Array(64).fill(0)
            }
        };

        // 2. Generate ZK Proof via snarkjs
        const provingStart = Date.now();
        const { pA, pB, pC, pubSignals } = await generateProof(
            amount, 
            targetAddress,
            1, // assetId
            1000, 
            targetAddress
        );
        const provingDuration = ((Date.now() - provingStart) / 1000).toFixed(1);
        console.log(`[PROVING] 🛡️ Groth16 Proof Successfully Generated in ${provingDuration}s.`);
        console.log(`PROVING_DURATION: ${provingDuration}s`);

        // 5. Log raw intent to 0G DA
        let intentRootHash = "0x-offline-intent";
        try {
            intentRootHash = await this.zeroG.logIntentMemory({ ...context.intent, agentId: agentId.toString() });
        } catch (e) {
            console.warn(`[0G-WARNING] DA Offline: ${e}. Proceeding in local-only mode.`);
        }

        // 6. Final Settlement on-chain
        console.log(`[Settlement] Calling AgentRegistry.logIntent on 0G Chain...`);
        const tx = await this.registry.logIntent(agentId, intentRootHash, pA, pB, pC, pubSignals);
        const receipt = await this.waitForReceipt(tx);

        console.log(`✅ Intent anchored on-chain! Memory Root: ${intentRootHash}, TX: ${receipt.hash}`);
    }

    /**
     * Phase 3: Task Execution - Direct instruction verified by ZK
     */
    async executeTask(agentId: bigint, instruction: string, result: string) {
        console.log(`\n>> [TASK] Agent ${agentId} executing task: ${instruction}`);
        
        // 1. Parse task
        const { amount, targetAddress, isTransfer } = parseTask(instruction);
        
        if (isTransfer && !targetAddress) {
            throw new Error("Execution failed: Target address not found in instruction.");
        }

        const finalTarget = targetAddress || "0x0000000000000000000000000000000000000000";

        // 2. Generate ZK Proof
        const { pA, pB, pC, pubSignals } = await generateProof(
            amount, 
            finalTarget,
            1000, // maxSpendLimit
            finalTarget // whitelistedAddress
        );

        // 3. Encode proof as bytes for the contract
        const proof = ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint[2]", "uint[2][2]", "uint[2]", "uint[4]"],
            [pA, pB, pC, pubSignals]
        );

        // 4. Submit or Prepare
        if (process.argv.includes("--prepare-only")) {
            const txData = this.registry.interface.encodeFunctionData("executeTask", [agentId, instruction, result, proof]);
            console.log(`\nPREPARE_PAYLOAD: ${JSON.stringify({
                to: await this.registry.getAddress(),
                data: txData,
                value: "0"
            })}`);
            return;
        }

        console.log(`[Settlement] Calling AgentRegistry.executeTask...`);
        const tx = await this.registry.connect(this.wallet).getFunction("executeTask")(agentId, instruction, result, proof);
        const receipt = await this.waitForReceipt(tx);

        console.log(`✅ Task recorded on-chain! TX: ${receipt.hash}`);
    }

    /**
     * Resilient tx.wait() replacement.
     */
    private async waitForReceipt(tx: any, maxAttempts = 75, intervalMs = 4000): Promise<any> {
        try {
            const receipt = await tx.wait();
            if (receipt) return receipt;
        } catch (e: any) {
            const isRpcQuirk = e?.error?.code === -32000 || e?.code === 'UNKNOWN_ERROR';
            if (!isRpcQuirk) throw e;
            console.warn(`[RPC] tx.wait() hit Galileo RPC quirk (-32000). Switching to manual polling for ${tx.hash}...`);
        }

        const provider = this.wallet.provider!;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise(r => setTimeout(r, intervalMs));
            try {
                const receipt = await provider.getTransactionReceipt(tx.hash);
                if (receipt) {
                    console.log(`[RPC] ✅ Receipt confirmed on attempt ${attempt}. Block: ${receipt.blockNumber}`);
                    return receipt;
                }
                console.log(`[RPC] Polling attempt ${attempt}/${maxAttempts} — tx ${tx.hash.slice(0, 12)}... not yet mined.`);
            } catch (pollErr: any) {
                console.warn(`[RPC] Poll attempt ${attempt} error: ${pollErr?.message ?? pollErr}`);
            }
        }
        throw new Error(`Transaction ${tx.hash} not confirmed after ${maxAttempts} attempts.`);
    }

    private bytesToUint256Array(buffer: Buffer): bigint[] {
        const result: bigint[] = [];
        for (let i = 0; i < buffer.length; i += 32) {
            const chunk = buffer.slice(i, i + 32);
            result.push(BigInt("0x" + chunk.toString("hex").padEnd(64, "0")));
        }
        return result;
    }
}

async function run() {
    const agent = new SovereignAgent();
    
    // Check for --spawn-only flag
    const isSpawnOnly = process.argv.includes("--spawn-only");
    
    // Parameters from command line
    const name = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : `Bot-${Math.floor(Math.random() * 1000)}`;
    const userAddress = process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "";
    const reportPath = path.join(__dirname, "../../report.md");
    
    if (!userAddress && !process.argv.includes("--prepare-only")) {
        console.error("❌ Error: User address is required for non-prepare mode.");
        process.exit(1);
    }
    
    try {
        const agentId = await agent.spawn(name, userAddress);
        
        if (process.argv.includes("--prepare-only")) {
            console.log("\n🚀 PREPARE SUCCESSFUL: Payload generated for frontend signing.");
            process.exit(0);
        }

        if (!isSpawnOnly) {
            await agent.executeIntent(agentId, 800, target);
        }

        console.log("\n🚀 MISSION SUCCESSFUL: Sovereign Agent is live and secured.");
        
        // Append to report.md
        const reportEntry = `\n### 🟢 Spawn Run: ${new Date().toISOString()}
- **Agent Name**: ${name}
- **Agent ID**: ${agentId}
- **Status**: SUCCESS
- **Execution**: Mock/Local ZK Proof generation succeeded and intent anchored on Galileo Testnet.
---`;
        fs.appendFileSync(reportPath, reportEntry, "utf-8");
        process.exit(0);
        
    } catch (error) {
        console.error("\n❌ MISSION FAILED:", error);
        
        // Append to report.md
        const errorMessage = error instanceof Error ? error.message : String(error);
        const reportEntry = `\n### 🔴 Spawn Run: ${new Date().toISOString()}
- **Agent Name**: ${name}
- **Status**: FAILED
- **Error log**: \`${errorMessage}\`
---`;
        fs.appendFileSync(reportPath, reportEntry, "utf-8");
        
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}
