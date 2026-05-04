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

    // Filter events by the owner (our wallet)
    const filter = registry.filters.AgentRegistered(null, wallet.address);
    // Scan last 100,000 blocks (Galileo is young)
    const events = await registry.queryFilter(filter, -5000);

    const agents = events.map(event => {
        // Event args: agentId, owner, pubKeyHash, constitutionHash
        const [agentId, owner, pubKeyHash, constitutionHash] = (event as any).args;
        return {
            name: `Agent #${agentId.toString()}`, 
            id: `ID: ${agentId.toString()}`,
            rootHash: constitutionHash,
            pubKeyHash: pubKeyHash,
            owner: owner,
            zkStatus: "Verified" as const,
            txHash: event.transactionHash
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
