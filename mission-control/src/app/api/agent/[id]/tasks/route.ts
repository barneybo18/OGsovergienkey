import { NextResponse } from "next/server";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Extract ID from string like "ID: 1" or just "1"
    const agentId = id.replace("ID: ", "");

    const rpcEndpoint = process.env.RPC_ENDPOINT;
    if (!rpcEndpoint) throw new Error("Missing RPC_ENDPOINT");

    const provider = new ethers.JsonRpcProvider(rpcEndpoint);

    const addressesPath = path.resolve(process.cwd(), "..", "contracts", "addresses.json");
    const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
    
    const registryArtifactPath = path.resolve(process.cwd(), "..", "contracts", "artifacts", "contracts", "AgentRegistry.sol", "AgentRegistry.json");
    const registryAbi = JSON.parse(fs.readFileSync(registryArtifactPath, "utf8")).abi;
    const registry = new ethers.Contract(addresses.AgentRegistry, registryAbi, provider);

    const tasks = await registry.getAgentTasks(agentId);

    const formattedTasks = tasks.map((task: any) => ({
      id: task.id.toString(),
      instruction: task.instruction,
      result: task.result,
      timestamp: Number(task.timestamp) * 1000,
      completed: task.completed
    }));

    return NextResponse.json({
      success: true,
      tasks: formattedTasks
    });

  } catch (error: any) {
    console.error("[API] Get Tasks Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to fetch agent tasks",
    }, { status: 500 });
  }
}
