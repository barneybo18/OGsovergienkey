import { NextResponse } from "next/server";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

// Fire-and-forget runner. Starts the process but does NOT await it.
// Returns immediately. The UI polls the chain for the result.
function fireAndForget(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true" },
    shell: true,
    detached: false, // Keep it tied to this process, but don't await it
  });

  let stdout = "";
  let stderr = "";

  child.stdout?.on("data", (d) => {
    stdout += d.toString();
    console.log(`[ZK-Task] ${d.toString().trim()}`);
  });
  child.stderr?.on("data", (d) => {
    stderr += d.toString();
    // Only log actual errors, not ts-node init messages
    if (d.toString().includes("Error") || d.toString().includes("FATAL")) {
      console.error(`[ZK-Task STDERR] ${d.toString().trim()}`);
    }
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log(`[ZK-Task] ✅ Task completed successfully. TX found in stdout:`, stdout.match(/TX: (0x[a-fA-F0-9]+)/)?.[1]);
    } else {
      console.error(`[ZK-Task] ❌ Process exited with code ${code}`);
    }
  });

  child.on("error", (err) => {
    console.error("[ZK-Task] spawn error:", err.message);
  });
}

export async function POST(request: Request) {
  try {
    const { agentId, instruction } = await request.json();

    if (!agentId || !instruction) {
      return NextResponse.json({ success: false, message: "Agent ID and instruction are required" }, { status: 400 });
    }

    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");
    
    if (!fs.existsSync(orchestratorPath)) {
      return NextResponse.json({ 
        success: false, 
        message: `Orchestrator directory not found at: ${orchestratorPath}` 
      }, { status: 500 });
    }

    console.log(`[API] Firing ZK task for agent ${agentId}: "${instruction}"`);

    // Fire the task process and return IMMEDIATELY
    // The ZK prover runs in the background — UI polls the blockchain for results
    fireAndForget(
      "npx",
      ["-y", "ts-node", "--transpile-only", "src/execute-task.ts", String(agentId), instruction],
      orchestratorPath
    );

    return NextResponse.json({
      success: true,
      message: "ZK task dispatched. Generating proof and settling on 0G Galileo (~30-60s). Refresh task history to see result.",
    });

  } catch (error: any) {
    console.error("[API] Task Dispatch Error:", error.message || error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to dispatch agent task",
    }, { status: 500 });
  }
}
