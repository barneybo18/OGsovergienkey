import { NextResponse } from "next/server";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import crypto from "crypto";

const execAsync = promisify(exec);

const DEMO_MODE = process.env.DEMO_MODE === "true";

// ─── DEMO MODE: Generates realistic-looking mock data without touching the network ───
async function handleDemoSpawn(name: string) {
  // Simulate a realistic pipeline delay (25s gives time to narrate during demo)
  await new Promise((r) => setTimeout(r, 25000));

  const agentId = Math.floor(Math.random() * 900) + 100;
  const rootHash = "0x" + crypto.randomBytes(32).toString("hex");
  const txHash = "0x" + crypto.randomBytes(32).toString("hex");
  const provingTime = (1.2 + Math.random() * 1.6).toFixed(1) + "s";

  // Simulated orchestrator stdout — mirrors real output format
  const logs = [
    `>> [GENESIS] Spawning agent: ${name}`,
    `[0G-Storage] Uploading MPC shard to 0G Storage...`,
    `[0G-Storage] ✅ Shard pinned. Root: ${rootHash.slice(0, 18)}...`,
    `[Flow] Registering agent on-chain at 0x65aAd1b52D7aD324dC98CB0EC9AACc3AF8036989...`,
    `[PROVING] Generating Groth16 proof (circom 2.0 / snarkjs)...`,
    `PROVING_DURATION: ${provingTime}`,
    `[PROVING] 🛡️ Groth16 Proof Successfully Generated in ${provingTime}.`,
    `[DA] Posting intent to 0G Data Availability...`,
    `[DA] ✅ Intent logged. DA Root: ${("0x" + crypto.randomBytes(32).toString("hex")).slice(0, 18)}...`,
    `[Settlement] Calling AgentRegistry.logIntent on 0G Chain...`,
    `✅ Agent spawned! ID: ${agentId}, TX: ${txHash.slice(0, 18)}...`,
    `AGENT_ID: ${agentId}`,
    `ROOT_HASH: ${rootHash}`,
    ``,
    `🚀 MISSION SUCCESSFUL: Sovereign Agent is live and secured.`,
  ].join("\n");

  return NextResponse.json({
    success: true,
    name: name,
    agentId: String(agentId),
    rootHash: rootHash,
    provingTime: provingTime,
    txHash: txHash,
    logs: logs,
    demo: true,
    message: "Sovereign Agent E2E Flow Completed Successfully (Demo Mode)",
  });
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // 1. Input Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, message: "Valid agent name is required" }, { status: 400 });
    }

    // ─── DEMO MODE SHORTCUT ───
    if (DEMO_MODE) {
      console.log(`[API] 🎬 DEMO MODE — Simulating spawn for: ${name}`);
      return handleDemoSpawn(name);
    }

    // 2. Resolve absolute path for orchestrator
    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");
    
    console.log(`[API] Triggering E2E Flow for agent: ${name}`);

    if (!fs.existsSync(orchestratorPath)) {
        throw new Error(`Orchestrator directory not found at: ${orchestratorPath}`);
    }

    // 3. Execution (Using ts-node transpile-only for speed)
    // Timeout: 10 minutes (Groth16 proving typically takes 10-60s, network calls add some buffer)
    // maxBuffer: 50MB to prevent stdout accumulation from consuming RAM
    const command = `npx ts-node --transpile-only src/agent.ts`;
    console.log(`[API] Executing command: ${command} in ${orchestratorPath}`);

    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(command, {
      cwd: orchestratorPath,
      timeout: 600000,       // 10 minutes
      maxBuffer: 50 * 1024 * 1024,  // 50MB stdout buffer cap
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true", NODE_OPTIONS: "--max-old-space-size=4096" }
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[API] Orchestrator finished in ${duration}s`);

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
        ? "ZK Proving timed out (exceeded 10 minutes). Your system may not have enough free RAM — close other apps and retry." 
        : (err.message || "Internal server error during agent spawning");

    return NextResponse.json({
      success: false,
      message: errorMessage,
    }, { status: 500 });
  }
}