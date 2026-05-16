import { NextResponse } from "next/server";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Network configuration map
const NETWORK_CONFIG: Record<number, { rpc: string; deploymentBlock: number; explorer: string; key: string }> = {
  16602: {
    rpc: "https://evmrpc-testnet.0g.ai",
    deploymentBlock: 33200000,
    explorer: "https://chainscan-galileo.0g.ai",
    key: "testnet",
  },
  16661: {
    rpc: "https://evmrpc.0g.ai",
    deploymentBlock: 0,
    explorer: "https://chainscan.0g.ai",
    key: "mainnet",
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = parseInt(searchParams.get("chainId") || "16602");

    const networkConf = NETWORK_CONFIG[chainId] ?? NETWORK_CONFIG[16602];

    // Load bundled contract config (addresses and ABI)
    const contractsPath = path.resolve(process.cwd(), "src", "config", "contracts.json");
    const contracts = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
    
    // Get addresses for the requested network
    const networkAddresses = contracts.addresses[networkConf.key] ?? {};

    if (!networkAddresses.AgentRegistry) {
      return NextResponse.json({
        success: true,
        agents: [],
        chainId,
        message: `No contracts deployed on ${networkConf.key} yet.`,
      });
    }

    const provider = new ethers.JsonRpcProvider(networkConf.rpc);
    const registry = new ethers.Contract(networkAddresses.AgentRegistry, contracts.abi, provider);

    // Query all agents from the correct deployment block for this network
    const filter = registry.filters.AgentRegistered();
    const events = await registry.queryFilter(filter, networkConf.deploymentBlock);

    // Load chain-specific custom names from local registry
    const metadataPath = path.resolve(process.cwd(), "src", "metadata", "registry.json");
    let chainMeta: Record<string, { name: string }> = {};
    try {
      if (fs.existsSync(metadataPath)) {
        const content = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
        // Support both legacy flat format and new chain-namespaced format
        chainMeta = content[String(chainId)]?.rootHashes || content.rootHashes || content;
      }
    } catch (e) {
      console.warn("[API] Could not load metadata registry:", e);
    }

    const agents = events.map(event => {
      const [agentId, owner, pubKeyHash, constitutionHash] = (event as any).args;
      const customMeta = chainMeta[constitutionHash];

      return {
        name: customMeta ? customMeta.name : `Agent #${agentId.toString()}`,
        id: `ID: ${agentId.toString()}`,
        rootHash: constitutionHash,
        pubKeyHash: pubKeyHash,
        owner: owner,
        zkStatus: "Verified" as const,
        txHash: event.transactionHash,
        chainId: chainId,
        explorerUrl: `${networkConf.explorer}/tx/${event.transactionHash}`,
      };
    }).reverse();

    return NextResponse.json({ success: true, agents, chainId });

  } catch (error) {
    const err = error as Error;
    console.error("[API] Get Agents Error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Failed to fetch agents",
      agents: [],
    }, { status: 500 });
  }
}
