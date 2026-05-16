import { NextResponse } from "next/server";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

const NETWORK_CONFIG: Record<number, { rpc: string; key: string; indexerUrl: string }> = {
  16602: {
    rpc: "https://evmrpc-testnet.0g.ai",
    key: "testnet",
    indexerUrl: "https://indexer-storage-testnet-turbo.0g.ai",
  },
  16661: {
    rpc: "https://evmrpc.0g.ai",
    key: "mainnet",
    indexerUrl: "https://indexer-storage-mainnet.0g.ai",
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = parseInt(searchParams.get("chainId") || "16602");
    const networkConf = NETWORK_CONFIG[chainId] ?? NETWORK_CONFIG[16602];

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing PRIVATE_KEY in environment variables");

    const provider = new ethers.JsonRpcProvider(networkConf.rpc);

    const addressesPath = path.resolve(process.cwd(), "..", "contracts", "addresses.json");
    const allAddresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    // Strictly use only the network-specific key — no cross-network fallback
    const addresses = allAddresses[networkConf.key] ?? {};

    if (!addresses.AgentRegistry) {
      return NextResponse.json({
        success: true,
        network: { totalAgents: 0, rpcStatus: "No Contract Deployed", indexerUrl: networkConf.indexerUrl },
        zkStats: { lastProvingTime: 0, avgProvingTime: 0, status: "N/A", history: [] },
      });
    }

    const registryArtifactPath = path.resolve(
      process.cwd(), "..", "contracts", "artifacts", "contracts", "AgentRegistry.sol", "AgentRegistry.json"
    );
    const registryAbi = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8")).abi;
    const registry = new ethers.Contract(addresses.AgentRegistry, registryAbi, provider);

    const nextAgentId = await registry.nextAgentId().catch(() => 0n);

    // Load ZK Stats — chain-namespaced
    const metadataPath = path.resolve(process.cwd(), "src", "metadata", "registry.json");
    let zkStats = {
      lastProvingTime: 0,
      avgProvingTime: 0,
      status: "N/A",
      history: [] as number[],
    };
    try {
      if (fs.existsSync(metadataPath)) {
        const content = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        const chainData = content[String(chainId)];
        if (chainData?.provingHistory?.length > 0) {
          const history = chainData.provingHistory;
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
        totalAgents: Math.max(0, Number(nextAgentId) - 1),
        rpcStatus: "Healthy",
        indexerUrl: networkConf.indexerUrl,
      },
      zkStats,
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
