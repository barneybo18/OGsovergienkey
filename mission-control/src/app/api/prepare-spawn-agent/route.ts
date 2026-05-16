import { NextResponse } from "next/server";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

const NETWORK_CONFIG: Record<number, { rpc: string; key: string }> = {
  16602: { rpc: "https://evmrpc-testnet.0g.ai", key: "testnet" },
  16661: { rpc: "https://evmrpc.0g.ai", key: "mainnet" },
};

export async function POST(request: Request) {
  try {
    const { name, address, chainId: rawChainId } = await request.json();
    const chainId = parseInt(String(rawChainId || "16602"));
    const networkConf = NETWORK_CONFIG[chainId] ?? NETWORK_CONFIG[16602];

    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, message: "Valid agent name is required" }, { status: 400 });
    }
    if (!address || typeof address !== "string") {
      return NextResponse.json({ success: false, message: "Wallet address is required" }, { status: 400 });
    }

    // Resolve addresses for the target network
    // Load bundled contract config (addresses and ABI)
    const contractsPath = path.resolve(process.cwd(), "src", "config", "contracts.json");
    const contracts = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
    
    // Get addresses for the requested network
    const networkAddresses = contracts.addresses[networkConf.key] ?? {};

    if (!networkAddresses.AgentRegistry) {
      return NextResponse.json({
        success: false,
        message: `Contracts are not yet deployed on ${networkConf.key}. Please deploy first.`,
      }, { status: 503 });
    }

    const orchestratorPath = path.resolve(process.cwd(), "..", "ai-orchestrator");
    console.log(`[API] Preparing spawn for: ${name} | Network: ${networkConf.key} (chainId: ${chainId}) | User: ${address}`);

    if (!fs.existsSync(orchestratorPath)) {
      throw new Error(`Orchestrator directory not found at: ${orchestratorPath}`);
    }

    // Pass chainId and network key to the orchestrator
    const command = `npx ts-node --transpile-only src/agent.ts "${name}" "${address}" --prepare-only --chain-id=${chainId}`;
    console.log(`[API] Executing: ${command} in ${orchestratorPath}`);

    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(command, {
      cwd: orchestratorPath,
      timeout: 600000,
      maxBuffer: 50 * 1024 * 1024,
      env: {
        ...process.env,
        TS_NODE_TRANSPILE_ONLY: "true",
        NODE_OPTIONS: "--max-old-space-size=4096",
        CHAIN_ID: String(chainId),
        RPC_ENDPOINT: networkConf.rpc,
      },
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[API] Prepare finished in ${duration}s`);
    if (stderr && stderr.includes("Error")) {
      console.error(`[API] Stderr: ${stderr}`);
    }

    const payloadMatch = stdout.match(/PREPARE_PAYLOAD: ({.*})/);
    const rootHashMatch = stdout.match(/ROOT_HASH: ([^\n\r]+)/);

    if (!payloadMatch) {
      throw new Error("Failed to generate transaction payload.");
    }

    const rootHash = rootHashMatch ? rootHashMatch[1].trim() : "N/A";
    const payload = JSON.parse(payloadMatch[1]);

    // ─── Persist metadata — namespaced by chainId ─────────────────
    try {
      const metaDir = path.resolve(process.cwd(), "src", "metadata");
      if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
      const metaPath = path.join(metaDir, "registry.json");

      let registry: Record<string, any> = {};
      if (fs.existsSync(metaPath)) {
        const raw = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        // Migrate legacy flat format to chain-namespaced format
        if (raw.rootHashes && !raw[String(chainId)]) {
          registry["16602"] = { rootHashes: raw.rootHashes, provingHistory: raw.provingHistory || [] };
        } else {
          registry = raw;
        }
      }

      if (!registry[String(chainId)]) {
        registry[String(chainId)] = { rootHashes: {}, provingHistory: [] };
      }

      registry[String(chainId)].rootHashes[rootHash] = { name };

      const durNum = parseFloat(duration);
      if (!isNaN(durNum)) {
        registry[String(chainId)].provingHistory.push(durNum);
        if (registry[String(chainId)].provingHistory.length > 10) {
          registry[String(chainId)].provingHistory.shift();
        }
      }

      fs.writeFileSync(metaPath, JSON.stringify(registry, null, 2));
      console.log(`[API] Persisted metadata for ${name} on chain ${chainId}. Duration: ${duration}s`);
    } catch (e) {
      console.error("[API] Failed to persist agent metadata:", e);
    }

    return NextResponse.json({
      success: true,
      name,
      rootHash,
      duration: parseFloat(duration),
      txPayload: payload,
      chainId,
      logs: stdout,
      message: "Transaction payload prepared successfully. Please sign via your wallet.",
    });

  } catch (error: unknown) {
    const err = error as { signal?: string; code?: string; message?: string };
    console.error("[API] Prepare Spawn Error:", err);
    const isTimeout = err.signal === "SIGTERM" || err.code === "ETIMEDOUT";
    const errorMessage = isTimeout
      ? "ZK Proving timed out (exceeded 10 minutes)."
      : (err.message || "Internal server error during prepare");

    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
