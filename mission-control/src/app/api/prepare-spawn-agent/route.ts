import { NextResponse } from "next/server";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { name, address } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, message: "Valid agent name is required" }, { status: 400 });
    }
    if (!address || typeof address !== "string") {
      return NextResponse.json({ success: false, message: "Wallet address is required" }, { status: 400 });
    }

    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");
    
    console.log(`[API] Preparing E2E Flow for agent: ${name} with address: ${address}`);

    if (!fs.existsSync(orchestratorPath)) {
        throw new Error(`Orchestrator directory not found at: ${orchestratorPath}`);
    }

    const command = `npx ts-node --transpile-only src/agent.ts "${name}" "${address}" --prepare-only`;
    console.log(`[API] Executing prepare command: ${command} in ${orchestratorPath}`);

    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(command, {
      cwd: orchestratorPath,
      timeout: 600000,       // 10 minutes (for proving)
      maxBuffer: 50 * 1024 * 1024,
      env: { ...process.env, TS_NODE_TRANSPILE_ONLY: "true", NODE_OPTIONS: "--max-old-space-size=4096" }
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[API] Prepare Orchestrator finished in ${duration}s`);

    if (stderr && stderr.includes("Error")) {
        console.error(`[API] Prepare Orchestrator Stderr: ${stderr}`);
    }

    // Pattern matching for payload
    const payloadMatch = stdout.match(/PREPARE_PAYLOAD: ({.*})/);
    const rootHashMatch = stdout.match(/ROOT_HASH: ([^\n\r]+)/);

    if (!payloadMatch) {
      throw new Error("Failed to generate transaction payload.");
    }

    const rootHash = rootHashMatch ? rootHashMatch[1] : "N/A";
    const payload = JSON.parse(payloadMatch[1]);

    // Persist custom name and proving stats locally
    try {
        const metaDir = path.resolve(process.cwd(), "src", "metadata");
        if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
        const metaPath = path.join(metaDir, "registry.json");
        let registry: { rootHashes: Record<string, { name: string }>, provingHistory: number[] } = { rootHashes: {}, provingHistory: [] };
        
        if (fs.existsSync(metaPath)) {
            const content = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            // Handle migration from old format if needed
            if (content.rootHashes) {
                registry = content;
            } else {
                registry.rootHashes = content;
            }
        }
        
        registry.rootHashes[rootHash] = { name };
        
        // Add duration to history (last 10 proofs)
        const durNum = parseFloat(duration);
        if (!isNaN(durNum)) {
            registry.provingHistory.push(durNum);
            if (registry.provingHistory.length > 10) registry.provingHistory.shift();
        }
        
        fs.writeFileSync(metaPath, JSON.stringify(registry, null, 2));
        console.log(`[API] Persisted metadata and stats for ${name}. Duration: ${duration}s`);
    } catch (e) {
        console.error("[API] Failed to persist agent metadata:", e);
    }

    return NextResponse.json({
      success: true,
      name: name,
      rootHash: rootHash,
      duration: parseFloat(duration),
      txPayload: payload,
      logs: stdout,
      message: "Transaction payload prepared successfully. Please sign via your wallet.",
    });

  } catch (error: unknown) {
    const err = error as { signal?: string; code?: string; message?: string };
    console.error("[API] Prepare Spawn Error Detail:", err);
    
    const isTimeout = err.signal === "SIGTERM" || err.code === "ETIMEDOUT";
    const errorMessage = isTimeout 
        ? "ZK Proving timed out (exceeded 10 minutes)." 
        : (err.message || "Internal server error during prepare");

    return NextResponse.json({
      success: false,
      message: errorMessage,
    }, { status: 500 });
  }
}
