import { ZeroGService } from "./0g-service";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const REGISTRY_ABI = JSON.parse(fs.readFileSync(path.join(__dirname, "../../contracts/artifacts/contracts/AgentRegistry.sol/AgentRegistry.json"), "utf8")).abi;
const ADDRESSES = JSON.parse(fs.readFileSync(path.join(__dirname, "../../contracts/addresses.json"), "utf8"));

/**
 * The Sovereign Agent Orchestrator
 * This class handles the complete lifecycle: Genesis, Intent, Proving, and Settlement.
 */
class SovereignAgent {
    private zeroG: ZeroGService;
    private wallet: ethers.Wallet;
    private registry: ethers.Contract;

    constructor() {
        if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY is not set in .env");
        if (!process.env.RPC_ENDPOINT) throw new Error("RPC_ENDPOINT is not set in .env");

        this.zeroG = new ZeroGService();
        const provider = new ethers.JsonRpcProvider(process.env.RPC_ENDPOINT);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        this.registry = new ethers.Contract(ADDRESSES.AgentRegistry, REGISTRY_ABI, this.wallet);
    }

    /**
     * Phase 1: Genesis - Generate MPC Shard, Upload to 0G, Register on-chain
     */
    async spawn(name: string) {
        console.log(`\n>> [GENESIS] Spawning agent: ${name}`);
        
        // 1. Simulate MPC DKG and shard generation
        const mockShardData = `enc_v1_sak_${Math.random().toString(36).substring(7)}`;
        const shardId = `shard-${name.toLowerCase()}-001`;
        
        // 2. Upload to 0G Storage (Resilient to 503 errors)
        let shardRootHash = "0x-offline";
        try {
            shardRootHash = await this.zeroG.uploadEncryptedMPCShard(shardId, mockShardData);
        } catch (e) {
            console.warn(`[0G-WARNING] Storage Offline: ${e}. Proceeding in local-only mode.`);
        }
        
        // 3. Register on 0G Chain (Requires RPC to be up)
        console.log(`[Flow] Registering agent on-chain at ${ADDRESSES.AgentRegistry}...`);
        const pubKey = `sak_pub_${Math.random().toString(36).substring(7)}`; // Mock aggregate pubkey
        const tx = await this.registry.registerAgent(pubKey, shardRootHash);
        const receipt = await tx.wait();
        
        // Extract agentId from event
        const event = receipt.logs.map((log: any) => this.registry.interface.parseLog(log)).find((log: any) => log?.name === "AgentRegistered");
        const agentId = event?.args[0];

        console.log(`✅ Agent spawned! ID: ${agentId}, TX: ${receipt.hash}`);
        console.log(`AGENT_ID: ${agentId}`);
        console.log(`ROOT_HASH: ${shardRootHash}`);
        return agentId;
    }

    /**
     * Phase 2: Action - Form intent, Prove via ZK, Log to DA, Settle on-chain
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

        // 2. Write inputs for ZK Engine
        const zkInputWinDir = path.join(__dirname, "../../zk-engine/script");
        const zkInputLinuxDir = `/mnt/c/Users/PR1M3/Desktop/SAK-Phase2/zk-engine/script`;
        fs.writeFileSync(path.join(zkInputWinDir, "zk_input.json"), JSON.stringify(context, null, 2));
        console.log(`[ZK] Inputs prepared for SP1 Prover.`);

        // 3. Trigger ZK Prover via WSL (avoids NTFS rebuild glitches)
        // SP1_PROVER=local generates a REAL STARK proof — takes 5-20min on CPU
        // Initial run may take longer due to Rust compilation (45min timeout)
        console.log(`[ZK] Starting SP1 Prover in WSL (REAL local proof mode)...`);
        console.log(`[ZK] Compiling Prover... (This may take ~10min on first run)`);
        const provingStart = Date.now();
        try {
            execSync(
                `wsl bash -l -c "export SP1_PROVER=local && export PATH=/home/prime/.cargo/bin:/home/prime/.sp1/bin:\\$PATH && cd '${zkInputLinuxDir}' && cargo run --release"`,
                { timeout: 2700000, stdio: "inherit" }  // 45-minute timeout
            );
        } catch (err) {
            console.error("ZK Proving failed. The intent might violate the constitution.");
            throw err;
        }
        const provingDuration = ((Date.now() - provingStart) / 1000).toFixed(1);
        console.log(`[PROVING] 🛡️ STARK Proof Successfully Generated in ${provingDuration}s.`);
        console.log(`PROVING_DURATION: ${provingDuration}s`);

        // 4. Load ZK Proof Output
        const zkOutput = JSON.parse(fs.readFileSync(path.join(zkInputWinDir, "zk_output.json"), "utf8"));
        console.log(`✅ ZK Proof generated and verified locally.`);

        // 5. Log raw intent to 0G DA
        const intentRootHash = await this.zeroG.logIntentMemory({ ...context.intent, agentId: agentId.toString() });

        // 6. Final Settlement on-chain
        console.log(`[Settlement] Calling AgentRegistry.logIntent on 0G Chain...`);
        // Decode hex-encoded proof output from ZK engine
        const proofBytes = Buffer.from(zkOutput.proof, "hex");
        const pubValBytes = Buffer.from(zkOutput.public_values, "hex");

        const pubInputs = this.bytesToUint256Array(pubValBytes);
        const tx = await this.registry.logIntent(agentId, intentRootHash, pubInputs, proofBytes);
        const receipt = await tx.wait();

        console.log(`✅ Intent anchored on-chain! Memory Root: ${intentRootHash}, TX: ${receipt.hash}`);
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
    
    // Test parameters
    const name = `Bot-${Math.floor(Math.random() * 1000)}`;
    const target = "DEADBEEF00000000000000000000000000000000"; // 20 bytes
    
    try {
        const agentId = await agent.spawn(name);
        await agent.executeIntent(agentId, 800, target);
        console.log("\n🚀 MISSION SUCCESSFUL: Sovereign Agent is live and secured.");
    } catch (error) {
        console.error("\n❌ MISSION FAILED:", error);
        process.exit(1);
    }
}

if (require.main === module) {
    run();
}
