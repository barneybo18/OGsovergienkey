import { Indexer, ZgFile } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

dotenv.config();

export class ZeroGService {
    private indexer: Indexer;
    private wallet: ethers.Wallet;
    private provider: ethers.JsonRpcProvider;

    constructor() {
        const rpcEndpoint = process.env.RPC_ENDPOINT!;
        const indexerUrl = process.env.INDEXER_URL!;
        const privateKey = process.env.PRIVATE_KEY!;

        this.provider = new ethers.JsonRpcProvider(rpcEndpoint);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.indexer = new Indexer(indexerUrl);

        console.log(`[SAK] Wallet loaded: ${this.wallet.address}`);
    }

    /**
     * Write content to a temp file, upload to 0G Storage, clean up.
     */
    private async uploadContent(content: string, label: string): Promise<string> {
        // Write to a temp file — ZgFile needs a real file path
        const tmpPath = path.join(os.tmpdir(), `sak-${label}-${Date.now()}.json`);
        fs.writeFileSync(tmpPath, content, "utf-8");

        try {
            const file = await ZgFile.fromFilePath(tmpPath);
            const [tx, err] = await this.indexer.upload(file, process.env.RPC_ENDPOINT!, this.wallet);

            if (err !== null) {
                throw new Error(`Upload failed: ${err}`);
            }

            return tx as string;
        } finally {
            // Always clean up temp file
            if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        }
    }

    /**
     * Upload an encrypted MPC key shard to 0G Storage.
     */
    async uploadEncryptedMPCShard(shardId: string, encryptedData: string): Promise<string> {
        console.log(`[0G-Storage] Preparing to upload MPC Shard: ${shardId}`);

        try {
            const content = JSON.stringify({ shardId, encryptedData });
            const tx = await this.uploadContent(content, `shard-${shardId}`);

            console.log(`[0G-Storage] ✅ MPC Shard pinned. Root Hash: ${tx}`);
            return tx;

        } catch (error) {
            console.error("[0G-Storage] Upload failed:", error);
            throw error;
        }
    }

    /**
     * Log an AI intent to 0G DA as immutable memory.
     */
    async logIntentMemory(intent: any): Promise<string> {
        console.log(`[0G-DA] Logging AI intent to 0G Data Availability...`);

        try {
            const content = JSON.stringify(intent);
            const tx = await this.uploadContent(content, "intent");

            console.log(`[0G-DA] ✅ AI Intent permanently stored. Root Hash: ${tx}`);
            return tx;

        } catch (error) {
            console.error("[0G-DA] Logging failed:", error);
            throw error;
        }
    }

    /**
     * Download data from 0G Storage by root hash.
     */
    async downloadShard(rootHash: string, outputPath: string): Promise<string> {
        console.log(`[0G-Storage] Retrieving shard with hash: ${rootHash}`);

        try {
            const err = await this.indexer.download(rootHash, outputPath, false);

            if (err !== null) {
                throw new Error(`Download failed: ${err}`);
            }

            const content = fs.readFileSync(outputPath, "utf-8");
            console.log(`[0G-Storage] ✅ Shard retrieved successfully`);
            return content;

        } catch (error) {
            console.error("[0G-Storage] Download failed:", error);
            throw error;
        }
    }
}