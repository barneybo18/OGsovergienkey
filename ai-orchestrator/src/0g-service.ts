import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
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
        const storageNodeUrl = process.env.STORAGE_NODE_URL || "https://storage-testnet-rpc.0g.ai";
        const indexerUrl = process.env.INDEXER_URL || "https://indexer-storage-testnet-standard.0g.ai";
        const privateKey = process.env.PRIVATE_KEY;

        this.provider = new ethers.JsonRpcProvider(this.rpcEndpoint);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.indexer = new Indexer(indexerUrl);

        console.log(`[0G-Service] Initialized with RPC: ${this.rpcEndpoint}, Indexer: ${indexerUrl}`);
    }

    /**
     * Upload an encoded, encrypted MPC key shard to 0G.
     */
    async uploadEncryptedMPCShard(shardId: string, encryptedData: string): Promise<string> {
        console.log(`[0G-Storage] Preparing to upload MPC Shard: ${shardId}`);
        const data = JSON.stringify({ shardId, encryptedData, type: "MPC_SHARD" });
        const buffer = Buffer.from(data, "utf-8");
        
        try {
            const file = new MemData(buffer);
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);
            

            // Perform real upload with retries for testnet stability
            let tx = null;
            let uploadErr = null;
            for (let i = 0; i < 3; i++) {
                console.log(`[0G-Storage] Upload attempt ${i + 1}...`);
                const [resultTx, resultErr] = await this.indexer.upload(file, this.rpcEndpoint, this.wallet);
                if (resultErr === null) {
                    tx = resultTx;
                    break;
                }
                uploadErr = resultErr;
                console.warn(`[0G-Storage] Upload failed: ${uploadErr}. Retrying in 5s...`);
                await sleep(5000);
            }
            
            if (uploadErr !== null && tx === null) throw new Error(`Upload error after 3 retries: ${uploadErr}`);

            console.log(`[0G-Storage] 🔓 MPC Shard pinned to 0G. Transaction: ${tx}`);
            return rootHash;
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
        const data = JSON.stringify({ ...intent, type: "AI_INTENT_LOG" });
        const buffer = Buffer.from(data, "utf-8");
        
        try {
            const file = new MemData(buffer);
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null) throw new Error(`Merkle tree error: ${treeErr}`);


            // In 0G, DA is often anchored via the same storage layer for high-throughput
            let tx = null;
            let uploadErr = null;
            for (let i = 0; i < 3; i++) {
                console.log(`[0G-DA] DA Log attempt ${i + 1}...`);
                const [resultTx, resultErr] = await this.indexer.upload(file, this.rpcEndpoint, this.wallet);
                if (resultErr === null) {
                    tx = resultTx;
                    break;
                }
                uploadErr = resultErr;
                console.warn(`[0G-DA] DA Log failed: ${uploadErr}. Retrying in 5s...`);
                await sleep(5000);
            }
            
            if (uploadErr !== null && tx === null) throw new Error(`DA Upload error after 3 retries: ${uploadErr}`);

            console.log(`[0G-DA] 🧠 AI Intent permanently stored on 0G DA. Root Hash: ${rootHash}`);
            return rootHash;
        } catch (error) {
            console.error("Failed to log intent to 0G", error);
            throw error;
        }
    }
}
