import { ZeroGService } from "./0g-service";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { generateProof } from "./prover";
const sss = require('shamirs-secret-sharing');


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
        
        // 1. Real MPC simulation: generate ephemeral keypair and split with Shamir 2-of-3
        const ephemeralWallet = ethers.Wallet.createRandom();
        const secretBytes = Buffer.from(ephemeralWallet.privateKey.slice(2), 'hex');
        const shares = sss.split(secretBytes, { shares: 3, threshold: 2 });
        // Store shard 1 on 0G Storage (other shards go to MPC nodes in production)
        const mockShardData = JSON.stringify({
          shardIndex: 1,
          totalShards: 3,
          threshold: 2,
          shardHex: shares[0].toString('hex'),
          agentPubKey: ephemeralWallet.publicKey,
          timestamp: Date.now()
        });
        const shardId = `shard-${name.toLowerCase()}-001`;
        const agentPubKeyHex = ethers.id(ephemeralWallet.publicKey) as `0x${string}`;
        
        // 2. Upload to 0G Storage (Resilient to 503 errors)
        let shardRootHash = "0x-offline";
        try {
            shardRootHash = await this.zeroG.uploadEncryptedMPCShard(shardId, mockShardData);
        } catch (e) {
            console.warn(`[0G-WARNING] Storage Offline: ${e}. Proceeding in local-only mode.`);
        }
        
        // 3. Register on 0G Chain (Requires RPC to be up)
        console.log(`[Flow] Registering agent on-chain at ${ADDRESSES.AgentRegistry}...`);
        const pubKey = agentPubKeyHex; // Real ephemeral agent public key hash
        // Convert constitutionHash string to bytes32
        const constitutionHashBytes32 = shardRootHash.startsWith('0x')
          ? shardRootHash.padEnd(66, '0').slice(0, 66)
          : ('0x' + shardRootHash).padEnd(66, '0').slice(0, 66);
        const tx = await this.registry.registerAgent(pubKey, constitutionHashBytes32);
        const receipt = await this.waitForReceipt(tx);
        
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

        // 2. Generate ZK Proof via snarkjs
        const provingStart = Date.now();
        const { pA, pB, pC, pubSignals } = await generateProof(
            amount, 
            targetAddress, 
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
     * Resilient tx.wait() replacement.
     * The Galileo dev RPC (evmrpc-testnet.0g.ai) sometimes returns -32000 instead of null
     * for unconfirmed txs, causing ethers.js v6 to throw immediately instead of retrying.
     * This helper catches that and falls back to manual polling via getTransactionReceipt().
     */
    private async waitForReceipt(tx: any, maxAttempts = 75, intervalMs = 4000): Promise<any> {
        // First, try the native tx.wait() — works fine on healthy RPC responses
        try {
            const receipt = await tx.wait();
            if (receipt) return receipt;
        } catch (e: any) {
            const isRpcQuirk = e?.error?.code === -32000 || e?.code === 'UNKNOWN_ERROR';
            if (!isRpcQuirk) throw e; // real error — re-throw immediately
            console.warn(`[RPC] tx.wait() hit Galileo RPC quirk (-32000). Switching to manual polling for ${tx.hash}...`);
        }

        // Manual polling fallback — provider.getTransactionReceipt() returns null (not -32000)
        // when the tx hasn't mined yet, so ethers.js won't throw.
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
        throw new Error(`Transaction ${tx.hash} not confirmed after ${maxAttempts} attempts (~${(maxAttempts * intervalMs / 60000).toFixed(1)} min). RPC may be degraded.`);
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
    
    // Test parameters: Using a stable test address for the demo run
    const name = `Bot-${Math.floor(Math.random() * 1000)}`;
    const target = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Standard Hardhat Test Address #1
    const reportPath = path.join(__dirname, "../../report.md");
    
    try {
        const agentId = await agent.spawn(name);
        await agent.executeIntent(agentId, 800, target);
        console.log("\n🚀 MISSION SUCCESSFUL: Sovereign Agent is live and secured.");
        
        // Append to report.md
        const reportEntry = `\n### 🟢 Spawn Run: ${new Date().toISOString()}
- **Agent Name**: ${name}
- **Agent ID**: ${agentId}
- **Status**: SUCCESS
- **Execution**: Mock/Local ZK Proof generation succeeded and intent anchored on Galileo Testnet.
---`;
        fs.appendFileSync(reportPath, reportEntry, "utf-8");
        
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
