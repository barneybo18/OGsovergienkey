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

    /**
     * Upload an encoded, encrypted MPC key shard to 0G.
     */
    async uploadEncryptedMPCShard(shardId: string, encryptedData: string): Promise<string> {
        console.log(`[0G-Storage] Preparing to upload MPC Shard: ${shardId}`);

        // Pad payload to ensure it exceeds the Flow contract minimum byte threshold.
        // Raw shard was ~85 bytes — Flow contract requires a minimum viable sector size.
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
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null || !tree) throw new Error(`Merkle tree error: ${treeErr}`);
            const rootHash = tree.rootHash();
            if (!rootHash) throw new Error("Root hash is null");

            let tx: any | null = null;
            let uploadErr = null;
            for (let i = 0; i < 3; i++) {
                console.log(`[0G-Storage] Upload attempt ${i + 1}...`);
                // Official Galileo SDK signature: upload(file, rpcUrl, signer)
                const [resultTx, resultErr] = await this.indexer.upload(file, this.rpcEndpoint, this.wallet);
                if (resultErr === null) {
                    tx = resultTx;
                    break;
                }
                uploadErr = resultErr;
                const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
                console.warn(`[0G-Storage] Upload failed (attempt ${i+1}/3): ${errMsg}. Retrying in 5s...`);
                await sleep(5000);
            }

            if (uploadErr !== null && tx === null) throw new Error(`Upload error after 3 retries: ${uploadErr}`);

            const txHash = tx?.txHash ?? tx;
            console.log(`[0G-Storage] 🔐 MPC Shard uploaded! Root: ${rootHash}, TX: ${txHash}`);
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
            const [tree, treeErr] = await file.merkleTree();
            if (treeErr !== null || !tree) throw new Error(`Merkle tree error: ${treeErr}`);
            const rootHash = tree.rootHash();
            if (!rootHash) throw new Error("Root hash is null");

            let tx: any | null = null;
            let uploadErr = null;
            for (let i = 0; i < 3; i++) {
                console.log(`[0G-DA] DA Log attempt ${i + 1}...`);
                const [resultTx, resultErr] = await this.indexer.upload(file, this.rpcEndpoint, this.wallet);
                if (resultErr === null) {
                    tx = resultTx;
                    break;
                }
                uploadErr = resultErr;
                const errMsg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
                console.warn(`[0G-DA] DA Log failed (attempt ${i+1}/3): ${errMsg}. Retrying in 5s...`);
                await sleep(5000);
            }

            if (uploadErr !== null && tx === null) throw new Error(`DA Upload error after 3 retries: ${uploadErr}`);

            const txHash = tx?.txHash ?? tx;
            console.log(`[0G-DA] 🧠 AI Intent permanently stored on 0G DA. Root Hash: ${rootHash}, TX: ${txHash}`);
            return rootHash;
        } catch (error) {
            console.error("Failed to log intent to 0G", error);
            throw error;
        }
    }
}
