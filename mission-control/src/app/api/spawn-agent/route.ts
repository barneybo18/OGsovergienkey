import { NextResponse } from "next/server";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // 1. Input Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, message: "Valid agent name is required" }, { status: 400 });
    }

    // 2. Resolve absolute path for orchestrator
    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");
    
    console.log(`[API] Triggering E2E Flow for agent: ${name}`);

    if (!fs.existsSync(orchestratorPath)) {
        throw new Error(`Orchestrator directory not found at: ${orchestratorPath}`);
    }

    // 3. Execution (Using ts-node transpile-only for speed)
    // Raised timeout to 45 minutes for REAL SP1 ZK proving + compilation
    const command = `npx ts-node --transpile-only src/agent.ts`;

    const { stdout, stderr } = await execAsync(command, {
      cwd: orchestratorPath,
      timeout: 2700000, 
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true" }
    });

    if (stderr && stderr.includes("Error")) {
        console.error(`[API] Orchestrator Stderr: ${stderr}`);
    }

    // 4. Pattern matching for real telemetry and metrics
    const agentIdMatch = stdout.match(/AGENT_ID: (\d+)/);
    const rootHashMatch = stdout.match(/ROOT_HASH: ([^\n\r]+)/);
    const provingTimeMatch = stdout.match(/PROVING_DURATION: ([^\n\r]+)/);
    const txHashMatch = stdout.match(/TX: (0x[a-fA-F0-9]+)/);

    return NextResponse.json({
      success: true,
      name: name,
      agentId: agentIdMatch ? agentIdMatch[1] : "N/A",
      rootHash: rootHashMatch ? rootHashMatch[1] : "N/A",
      provingTime: provingTimeMatch ? provingTimeMatch[1] : "N/A",
      txHash: txHashMatch ? txHashMatch[1] : "N/A",
      logs: stdout,
      message: "Sovereign Agent E2E Flow Completed Successfully",
    });

  } catch (error: unknown) {
    const err = error as { signal?: string; code?: string; message?: string };
    console.error("[API] Spawn Error Detail:", err);
    
    const isTimeout = err.signal === "SIGTERM" || err.code === "ETIMEDOUT";
    const errorMessage = isTimeout 
        ? "ZK Proving timed out (exceeded 45 minutes)" 
        : (err.message || "Internal server error during agent spawning");

    return NextResponse.json({
      success: false,
      message: errorMessage,
    }, { status: 500 });
  }
}