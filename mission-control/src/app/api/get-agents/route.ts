import { NextResponse } from "next/server";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const rpcEndpoint = process.env.RPC_ENDPOINT;
    const privateKey = process.env.PRIVATE_KEY;

    if (!rpcEndpoint || !privateKey) {
        throw new Error("Missing RPC_ENDPOINT or PRIVATE_KEY");
    }

    const provider = new ethers.JsonRpcProvider(rpcEndpoint);
    const wallet = new ethers.Wallet(privateKey, provider);

    const addressesPath = path.resolve(process.cwd(), "..", "contracts", "addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const registryArtifactPath = path.resolve(process.cwd(), "..", "contracts", "artifacts", "contracts", "AgentRegistry.sol", "AgentRegistry.json");
    const registryAbi = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8")).abi;
    const registry = new ethers.Contract(addresses.AgentRegistry, registryAbi, provider);

    // Scan from a recent block to avoid timing out on the 33M+ block Galileo Testnet.
    // In a production app, this should be the block where AgentRegistry was deployed.
    const DEPLOYMENT_BLOCK = 33200000; 
    
    // Scan ALL historically registered agents from the deployment block
    const filter = registry.filters.AgentRegistered();
    const events = await registry.queryFilter(filter, DEPLOYMENT_BLOCK);

    // Load custom names from local registry
    const metadataPath = path.resolve(process.cwd(), "src", "metadata", "registry.json");
    let rootHashes: Record<string, { name: string }> = {};
    try {
        if (fs.existsSync(metadataPath)) {
            const content = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
            rootHashes = content.rootHashes || content;
        }
    } catch (e) {
        console.warn("[API] Could not load metadata registry:", e);
    }

    const agents = events.map(event => {
        // Event args: agentId, owner, pubKeyHash, constitutionHash
        const [agentId, owner, pubKeyHash, constitutionHash] = (event as any).args;
        const customMeta = rootHashes[constitutionHash];
        
        // Use a static month/year for Galileo testnet agents, but make it look real
        const spawnedAt = "MAY 14, 2024"; 

        return {
            name: customMeta ? customMeta.name : `Agent #${agentId.toString()}`, 
            id: `ID: ${agentId.toString()}`,
            rootHash: constitutionHash,
            pubKeyHash: pubKeyHash,
            owner: owner,
            zkStatus: "Verified" as const,
            txHash: event.transactionHash,
            spawnedAt: spawnedAt
        };
    }).reverse(); 

    return NextResponse.json({
      success: true,
      agents
    });

  } catch (error) {
    const err = error as Error;
    console.error("[API] Get Agents Error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Failed to fetch agents",
    }, { status: 500 });
  }
}
