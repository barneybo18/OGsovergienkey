import { NextResponse } from "next/server";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const orchestratorDir = path.resolve(process.cwd(), "..", "ai-orchestrator");
    const envPath = path.join(orchestratorDir, ".env");
    
    // 1. Load config from orchestrator .env
    const envContent = fs.readFileSync(envPath, "utf8");
    const rpcEndpoint = envContent.match(/RPC_ENDPOINT=([^\n\r]+)/)?.[1];
    const privateKey = envContent.match(/PRIVATE_KEY=([^\n\r]+)/)?.[1];
    const indexerUrl = envContent.match(/INDEXER_URL=([^\n\r]+)/)?.[1];

    if (!rpcEndpoint || !privateKey) {
        throw new Error("Missing RPC_ENDPOINT or PRIVATE_KEY in orchestrator .env");
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
    const [balance, nextAgentId] = await Promise.all([
        provider.getBalance(wallet.address),
        registry.nextAgentId().catch(() => 0n)
    ]);

    return NextResponse.json({
      success: true,
      wallet: {
          address: wallet.address,
          balance: ethers.formatEther(balance),
      },
      network: {
          totalAgents: Number(nextAgentId) - 1,
          rpcStatus: "Healthy",
          indexerUrl: indexerUrl || "N/A"
      }
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
