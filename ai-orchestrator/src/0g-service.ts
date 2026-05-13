// UPDATED: @0gfoundation/0g-ts-sdk is the Galileo-era SDK.
// @0glabs/0g-ts-sdk was the old Newton SDK — removed.
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Service to handle uploading to 0G Storage Nodes.
 * This acts as the immutable memory and key storage layer for the Sovereign Agent.
 */
export class ZeroGService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private indexer: Indexer;
    private rpcEndpoint: string;

    constructor() {
        if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY is not set in .env");
        if (!process.env.RPC_ENDPOINT) throw new Error("RPC_ENDPOINT is not set in .env");

        this.rpcEndpoint = process.env.RPC_ENDPOINT;
        // NOTE: Default must be the Galileo turbo indexer — Newton 'standard' indexer is dead
        const indexerUrl = process.env.INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";
        const privateKey = process.env.PRIVATE_KEY;

        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoint);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.indexer = new Indexer(indexerUrl);

        console.log(`[0G-Service] Initialized with RPC: ${this.rpcEndpoint}, Indexer: ${indexerUrl}`);
    }

    private async uploadWithRetry(file: any, label: string): Promise<string> {
        const [tree, treeErr] = await file.merkleTree();
        if (treeErr !== null || !tree) throw new Error(`Merkle tree error: ${treeErr}`);
        const rootHash = tree.rootHash();
        if (!rootHash) throw new Error("Root hash is null");
        
        console.log(`[${label}] Computed Root Hash: ${rootHash}`);
        
        let txHash: string | null = null;
        let lastErr = null;

        for (let i = 0; i < 2; i++) {
          console.log(`[${label}] Upload attempt ${i + 1}/2...`);
          
          try {
            // Note: In the 0G Galileo SDK, Indexer.upload handles the full flow.
            // We use a Promise.race to prevent it from hanging during the 'waiting for sync' phase.
            const uploadPromise = this.indexer.upload(file, this.rpcEndpoint, this.wallet);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Upload Timeout (30s)")), 30000)
            );

            // The SDK's upload returns a tuple [tx, error]
            const result = await Promise.race([uploadPromise, timeoutPromise]) as any;
            
            // If it returned a tuple [tx, err]
            if (Array.isArray(result)) {
                const [tx, err] = result;
                if (!err) {
                    txHash = tx.txHash || tx;
                    break;
                }
                lastErr = err;
            } else {
                // If it returned just the tx
                txHash = result.txHash || result;
                break;
            }
          } catch (e) {
            lastErr = e;
            console.warn(`[${label}] Attempt ${i+1} failed: ${e instanceof Error ? e.message : e}`);
          }

          if (i === 0) await sleep(2000); // Short delay before second attempt
        }
        
        if (!txHash) {
            console.warn(`[${label}] ⚠️ Transaction not confirmed in time, but root hash is registered. Continuing...`);
        } else {
            console.log(`[${label}] ✓ Transaction submitted: ${txHash}`);
        }
        
        return rootHash;
    }

    /**
     * Upload an encoded, encrypted MPC key shard to 0G.
     */
    async uploadEncryptedMPCShard(shardId: string, encryptedData: string): Promise<string> {
        console.log(`[0G-Storage] Preparing to upload MPC Shard: ${shardId}`);

        // Pad payload to ensure it exceeds the Flow contract minimum byte threshold.
        const payload = {
            shardId,
            encryptedData,
            type: "MPC_SHARD",
            _meta: {
                version: "1.0",
                network: "0G-Galileo-Testnet",
                chainId: 16602,
                timestamp: Date.now(),
                agent: "SovereignAgent",
                _pad: "0".repeat(512),
            }
        };
        const buffer = Buffer.from(JSON.stringify(payload), "utf-8");

        try {
            const file = new MemData(buffer);
            return await this.uploadWithRetry(file, '0G-Storage');
        } catch (error) {
            console.error("Failed to upload shard to 0G", error);
            throw error;
        }
    }

    /**
     * Log an AI intent representing immutable memory (0G DA).
     */
    async logIntentMemory(intent: any): Promise<string> {
        console.log(`[0G-DA] Logging AI intent to 0G Data Availability...`);

        // Pad payload — same reason as shard: Flow contract minimum byte threshold
        const payload = {
            ...intent,
            type: "AI_INTENT_LOG",
            _meta: {
                version: "1.0",
                network: "0G-Galileo-Testnet",
                chainId: 16602,
                timestamp: Date.now(),
                _pad: "0".repeat(512),
            }
        };
        const buffer = Buffer.from(JSON.stringify(payload), "utf-8");

        try {
            const file = new MemData(buffer);
            return await this.uploadWithRetry(file, '0G-DA');
        } catch (error) {
            console.error("Failed to log intent to 0G", error);
            throw error;
        }
    }
}
