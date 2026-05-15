import { NextResponse } from "next/server";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 1. Load config from process.env (Next.js server-side)
    const rpcEndpoint = process.env.RPC_ENDPOINT;
    const privateKey = process.env.PRIVATE_KEY;
    const indexerUrl = process.env.INDEXER_URL;

    if (!rpcEndpoint || !privateKey) {
        throw new Error("Missing RPC_ENDPOINT or PRIVATE_KEY in environment variables");
    }

    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 2. Load Contract Info
    const addressesPath = path.resolve(process.cwd(), "..", "contracts", "addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const registryArtifactPath = path.resolve(process.cwd(), "..", "contracts", "artifacts", "contracts", "AgentRegistry.sol", "AgentRegistry.json");
    const registryAbi = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8")).abi;
    const registry = new ethers.Contract(addresses.AgentRegistry, registryAbi, provider);

    // 3. Fetch Data
    const nextAgentId = await registry.nextAgentId().catch(() => 0n);

    // 4. Load ZK Stats
    const metadataPath = path.resolve(process.cwd(), "src", "metadata", "registry.json");
    let zkStats = {
        lastProvingTime: 0,
        avgProvingTime: 0,
        status: "N/A",
        history: [] as number[]
    };

    try {
        if (fs.existsSync(metadataPath)) {
            const content = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
            if (content.provingHistory && content.provingHistory.length > 0) {
                const history = content.provingHistory;
                zkStats.lastProvingTime = history[history.length - 1];
                zkStats.avgProvingTime = Number((history.reduce((a: number, b: number) => a + b, 0) / history.length).toFixed(1));
                zkStats.history = history;
                
                if (zkStats.lastProvingTime < 45) zkStats.status = "Fast • Groth16";
                else if (zkStats.lastProvingTime < 90) zkStats.status = "Nominal • Groth16";
                else zkStats.status = "Slow • Optimization Needed";
            }
        }
    } catch (e) {
        console.warn("[API] Failed to compute ZK stats:", e);
    }

    return NextResponse.json({
      success: true,
      network: {
          totalAgents: Number(nextAgentId) - 1,
          rpcStatus: "Healthy",
          indexerUrl: indexerUrl || "N/A"
      },
      zkStats
    });

  } catch (error) {
    const err = error as Error;
    console.error("[API] Network Status Error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Failed to fetch network status",
    }, { status: 500 });
  }
}
