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
        
        let tx: any = null;
        let lastErr = null;
        for (let i = 0; i < 2; i++) { // Reduced to 2 attempts for faster dashboard response
          console.log(`[${label}] Upload attempt ${i + 1}...`);
          
          try {
            // Add a 15s timeout to the upload call itself
            const uploadPromise = this.indexer.upload(file, this.rpcEndpoint, this.wallet);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Request Timeout (15s)")), 15000)
            );

            const [resultTx, resultErr] = await Promise.race([uploadPromise, timeoutPromise]) as [any, any];
            
            if (resultErr === null) { 
              tx = resultTx; 
              break; 
            }
            lastErr = resultErr;
          } catch (e) {
            lastErr = e;
          }

          const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
          console.warn(`[${label}] Failed attempt ${i+1}/2: ${msg}. Retrying in 3s...`);
          await sleep(3000);
        }
        
        if (!tx) throw new Error(`Upload failed after retries: ${lastErr}`);
        console.log(`[${label}] ✓ Uploaded. Root: ${rootHash}, TX: ${tx?.txHash ?? tx}`);
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
