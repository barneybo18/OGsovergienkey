import { NextResponse } from "next/server";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

async function runOrchestrator(args: string[], cwd: string): Promise<{ success: boolean; payload?: any; logs: string; message: string }> {
  return new Promise((resolve) => {
    const child = spawn("npx", args, {
      cwd,
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true" },
      shell: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => {
      const msg = d.toString();
      stdout += msg;
      console.log(`[Orchestrator] ${msg.trim()}`);
    });
    child.stderr?.on("data", (d) => {
      const msg = d.toString();
      stderr += msg;
      console.error(`[Orchestrator Error] ${msg.trim()}`);
    });

    child.on("close", (code) => {
      if (code === 0) {
        const payloadMatch = stdout.match(/PREPARE_PAYLOAD: ({.*})/);
        if (payloadMatch) {
          try {
            const payload = JSON.parse(payloadMatch[1]);
            resolve({ success: true, payload, logs: stdout, message: "Task prepared successfully" });
          } catch (e) {
            resolve({ success: false, logs: stdout, message: "Failed to parse payload" });
          }
        } else {
          resolve({ success: false, logs: stdout, message: "No payload found in output" });
        }
      } else {
        resolve({ success: false, logs: stdout + "\n" + stderr, message: `Orchestrator failed with code ${code}` });
      }
    });
  });
}

export async function POST(request: Request) {
  try {
    const { agentId, instruction, type } = await request.json();

    if (!agentId || !instruction) {
      return NextResponse.json({ success: false, message: "Agent ID and instruction are required" }, { status: 400 });
    }

    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");
    
    if (!fs.existsSync(orchestratorPath)) {
      return NextResponse.json({ 
        success: false, 
        message: "Orchestrator directory not found" 
      }, { status: 500 });
    }

    console.log(`[API] Preparing ZK task for agent ${agentId}: "${instruction}"`);

    const result = await runOrchestrator(
      ["-y", "ts-node", "--transpile-only", "src/execute-task.ts", String(agentId), instruction, "--prepare-only"],
      orchestratorPath
    );

    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        message: result.message,
        logs: result.logs
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      txPayload: result.payload,
      message: "Task payload prepared successfully. Please sign via your wallet.",
    });

  } catch (error: any) {
    console.error("[API] Task Preparation Error:", error.message || error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to prepare agent task",
    }, { status: 500 });
  }
}
