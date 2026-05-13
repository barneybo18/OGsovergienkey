import { NextResponse } from "next/server";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

// Fire-and-forget runner: starts the ZK proof process and returns immediately.
// The UI polls /api/get-agents until the new agent appears on-chain.
function fireAndForget(command: string, args: string[], cwd: string) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true", NODE_OPTIONS: "--max-old-space-size=4096" },
    shell: true,
    detached: false,
  });

  let stdout = "";

  child.stdout?.on("data", (d) => {
    stdout += d.toString();
    console.log(`[ZK-Spawn] ${d.toString().trim()}`);
  });

  child.stderr?.on("data", (d) => {
    const msg = d.toString();
    // Only log real errors, not ts-node init messages
    if (msg.includes("Error") || msg.includes("FATAL")) {
      console.error(`[ZK-Spawn STDERR] ${msg.trim()}`);
    }
  });

  child.on("close", (code) => {
    if (code === 0) {
      const agentIdMatch = stdout.match(/AGENT_ID: (\d+)/);
      const txMatch = stdout.match(/TX: (0x[a-fA-F0-9]+)/);
      console.log(`[ZK-Spawn] ✅ Agent spawned! ID: ${agentIdMatch?.[1] ?? "?"}, TX: ${txMatch?.[1] ?? "?"}`);
    } else {
      console.error(`[ZK-Spawn] ❌ Process exited with code ${code}`);
    }
  });

  child.on("error", (err) => {
    console.error("[ZK-Spawn] spawn error:", err.message);
  });
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, message: "Valid agent name is required" }, { status: 400 });
    }

    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");

    if (!fs.existsSync(orchestratorPath)) {
      return NextResponse.json({
        success: false,
        message: `Orchestrator directory not found at: ${orchestratorPath}`,
      }, { status: 500 });
    }

    console.log(`[API] Firing ZK genesis for agent: ${name}`);

    // Kick off proving in background — return immediately.
    // The UI polls /api/get-agents every few seconds until the new agent appears.
    fireAndForget(
      "npx",
      ["-y", "ts-node", "--transpile-only", "src/agent.ts", name],
      orchestratorPath
    );

    return NextResponse.json({
      success: true,
      name,
      message: "Agent genesis dispatched. ZK proof is being generated and will settle on 0G Galileo (~60s). Your fleet will update automatically.",
    });

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[API] Spawn Dispatch Error:", err.message || err);
    return NextResponse.json({
      success: false,
      message: err.message || "Internal server error during agent spawn dispatch",
    }, { status: 500 });
  }
}