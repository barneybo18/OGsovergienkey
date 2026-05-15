"use client";

import { AgentCard } from "@/components/AgentCard";
import { AgentDetailModal } from "@/components/AgentDetailModal";
import { TerminalLog } from "@/components/TerminalLog";
import { StatsCard } from "@/components/StatsCard";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Activity, Loader2, Wallet, Cpu, Network, RotateCw, PlusCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAccount, useBalance, useSendTransaction, useConfig } from "wagmi";
import { formatEther } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m > 0 ? `${m}m ` : ""}${s}s`;
};

interface Agent {
  name: string;
  id: string;
  rootHash: string;
  pubKeyHash?: string;
  owner?: string;
  zkStatus: "Verified" | "Pending" | "Failed";
  txHash?: string;
}

interface NetworkStatus {
  success: boolean;
  wallet: {
    address: string;
    balance: string;
  };
  network: {
    totalAgents: number;
    rpcStatus: string;
    indexerUrl: string;
  };
  zkStats?: {
    lastProvingTime: number;
    avgProvingTime: number;
    status: string;
    history: number[];
  };
}

import { ConnectButtonCustom } from "@/components/ConnectButton";

export default function MissionControl() {
  const { address: connectedAddress, isConnected } = useAccount();
  const config = useConfig();
  const { data: balanceData } = useBalance({
    address: connectedAddress,
  });
  const { sendTransactionAsync } = useSendTransaction();

  const [isSpawning, setIsSpawning] = useState(false);
  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [tempAgentName, setTempAgentName] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side hydration before reading wagmi state
  useEffect(() => { setIsMounted(true); }, []);

  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [lowPowerMode, setLowPowerMode] = useState<boolean>(false);

  // Load low power mode preference
  useEffect(() => {
    const saved = localStorage.getItem("SAK_LOW_POWER");
    if (saved === "true") setLowPowerMode(true);
  }, []);

  const toggleLowPower = () => {
    const newVal = !lowPowerMode;
    setLowPowerMode(newVal);
    localStorage.setItem("SAK_LOW_POWER", String(newVal));
  };

  // ─── VANTA WAVES CONFIG ─── (loads via CDN to avoid webpack UMD issues) ───
  useEffect(() => {
    let cancelled = false;

    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(script);
      });
    }

    async function initVanta() {
      if (vantaEffect.current || !vantaRef.current || lowPowerMode) return;

      try {
        // Load THREE.js from CDN first — Vanta needs window.THREE to exist
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js");
        if (cancelled || !vantaRef.current) return;

        // Now load Vanta waves — it will pick up window.THREE automatically
        await loadScript("https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js");
        if (cancelled || !vantaRef.current) return;

        const VANTA = (window as any).VANTA;
        if (!VANTA?.WAVES) {
          console.warn("[Vanta] VANTA.WAVES not available after script load");
          return;
        }

        vantaEffect.current = VANTA.WAVES({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xb0b,
          shininess: 150.00,
          waveHeight: 40.0,
          waveSpeed: 0.15,
          zoom: 1.75
        });
      } catch (err) {
        console.error("[Vanta] Failed to initialize:", err);
      }
    }

    initVanta();

    if (lowPowerMode) {
        if (vantaEffect.current) {
            vantaEffect.current.destroy();
            vantaEffect.current = null;
        }
    } else {
        initVanta();
    }

    return () => {
      cancelled = true;
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [lowPowerMode]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 6;

  // Real-time network and performance state
  const [networkData, setNetworkData] = useState<NetworkStatus | null>(null);
  const [lastProvingTime, setLastProvingTime] = useState<string>("0s");
  const [spawnError, setSpawnError] = useState<string | null>(null);
  const [spawnTimer, setSpawnTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpawning) {
      setSpawnTimer(0);
      interval = setInterval(() => {
        setSpawnTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSpawning]);

  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const res = await fetch("/api/get-agents");
      const data = await res.json();
      if (data.duration) setLastProvingTime(`${data.duration}s`);
      if (data.success) {
        setAgents(data.agents);
      } else {
        console.warn("Failed to refresh active fleet:", data.message);
      }
    } catch (e) {
      console.error("Failed to fetch agents:", e);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const fetchNetworkStatus = async () => {
    try {
      const res = await fetch("/api/network-status");
      const data = await res.json() as NetworkStatus;
      if (data.success) setNetworkData(data);
    } catch (e) {
      console.error("Failed to fetch status:", e);
    }
  };

  useEffect(() => {
    fetchNetworkStatus();
    fetchAgents();
    const interval = setInterval(fetchNetworkStatus, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const handleSpawn = async (name: string) => {
    const finalName = name.trim() || `SAK-Agent-${Math.floor(Math.random() * 10000)}`;
    setSpawnError(null);
    setIsSpawning(true);
    setRuntimeLogs(["[SAK] Initializing Agent Genesis Sequence...", `[SAK] Identity: ${finalName}`, "[SAK] Contacting 0G Galileo Testnet..."]);
    toast.info(`ZK Genesis for ${finalName} dispatched!`);

    try {
      if (!isConnected) {
        toast.error("Please connect your wallet first.");
        setIsSpawning(false);
        return;
      }

      // Add dynamic progress logs while waiting for the backend
      const progressSteps = [
        "[ZK] Generating Witness... 15%",
        "[ZK] Calculating Constraints... 32%",
        "[ZK] Synthesizing Groth16 Proof... 48%",
        "[ZK] Proof Optimization... 67%",
        "[0G] Preparing Shard Merkle Tree... 82%",
        "[0G] Finalizing Shard Encoding... 95%"
      ];
      
      let stepIdx = 0;
      const progressInterval = setInterval(() => {
        if (stepIdx < progressSteps.length) {
            setRuntimeLogs(prev => [...prev, progressSteps[stepIdx]]);
            stepIdx++;
        } else {
            clearInterval(progressInterval);
        }
      }, 4000);

      const res = await fetch("/api/prepare-spawn-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            name: finalName, 
            address: connectedAddress 
        })
      });

      clearInterval(progressInterval);

      const data = await res.json();
      if (data.duration) setLastProvingTime(`${data.duration}s`);

      if (!data.success) {
        setRuntimeLogs(prev => [...prev, `❌ ERROR: ${data.message}`]);
        toast.error(`Prepare failed: ${data.message}`);
        setSpawnError(data.message || "Prepare failed");
        setIsSpawning(false);
        return;
      }

      setRuntimeLogs(prev => [...prev, 
        `[SAK] Agent payload generated: ${data.name}`,
        `[ZK] Groth16 Proof ready.`,
        `[SIGNING] Please confirm the transaction in your wallet to settle on 0G Galileo...`
      ]);
      toast.info("Payload ready! Please sign in your wallet.");

      // Send the transaction using the connected wallet!
      const txHash = await sendTransactionAsync({
          to: data.txPayload.to as `0x${string}`,
          data: data.txPayload.data as `0x${string}`,
          value: data.txPayload.value ? BigInt(data.txPayload.value) : BigInt(0)
      });

      setRuntimeLogs(prev => [...prev,
        `[TX] Transaction broadcasted: ${txHash}`,
        "[0G] Waiting for on-chain confirmation (Aggressive Polling)...",
      ]);

      // Use waitForTransactionReceipt for definitive on-chain confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1,
      });

      setRuntimeLogs(prev => [...prev, `[0G] Settlement confirmed in block ${receipt.blockNumber}.`]);
      
      // Immediately refresh the fleet and network status
      await fetchAgents();
      await fetchNetworkStatus();
      setIsSpawning(false);
      setCurrentPage(1);

      setRuntimeLogs(prev => [...prev,
        `✅ Agent anchored on-chain!`,
        `🔗 TX: ${txHash}`,
        "✅ E2E ZK Genesis Cycle Finalized.",
      ]);
      toast.success(`Agent is live on 0G Galileo!`);

    } catch (error: any) {
      console.error("Spawn failed:", error);
      setSpawnError(error.message || "Spawn failed — check terminal logs for details.");
      toast.error(error.message || "Spawn failed");
      setIsSpawning(false);
    }
  };

  // Pagination Logic
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = agents.slice(indexOfFirstAgent, indexOfLastAgent);
  const totalPages = Math.ceil(agents.length / agentsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <main ref={vantaRef} className="min-h-screen p-8 lg:p-24 relative overflow-hidden transition-colors duration-1000 z-0">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-cyan/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Digital Soul Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '200px 200px' }} />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header Area */}
        <header className="mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan text-[10px] font-bold uppercase tracking-widest mb-4"
            >
              <Activity className="w-3 h-3" /> Network: 0G Galileo Testnet
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 text-white font-display">
              Mission <span className="text-gradient">Control</span>
            </h1>
            <p className="text-base text-white/50 max-w-2xl font-light leading-relaxed">
              Decentralized AI Governance. Securely spawn agents, verify cryptographic constitutions via ZK-SNARKs, and manage high-integrity intent memory on the 0G DA layer.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <button
                onClick={toggleLowPower}
                className={cn(
                    "px-4 py-4 rounded-xl flex items-center gap-2 transition-all border text-[10px] font-bold uppercase tracking-widest",
                    lowPowerMode 
                        ? "bg-brand-purple/20 border-brand-purple/40 text-brand-purple" 
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                )}
                title={lowPowerMode ? "Enable High Performance UI (WebGL)" : "Disable GPU-Heavy Background"}
            >
                <Cpu size={14} className={lowPowerMode ? "" : "animate-pulse"} />
                {lowPowerMode ? "Low Power: ON" : "Low Power: OFF"}
            </button>
            <ConnectButtonCustom />
            <motion.button
              whileHover={isSpawning ? {} : { 
                scale: 1.05,
                boxShadow: "0 0 25px rgba(0, 255, 209, 0.4), 0 0 60px rgba(0, 255, 209, 0.15)",
                borderColor: "rgba(0, 255, 209, 0.5)",
              }}
              whileTap={isSpawning ? {} : { scale: 0.97 }}
              onClick={() => !isSpawning && setIsNamingModalOpen(true)}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "px-8 py-4 rounded-xl flex items-center gap-3 transition-all font-bold text-sm uppercase tracking-[0.2em] border border-white/10",
                isSpawning 
                  ? "bg-white/10 text-white/40 cursor-not-allowed" 
                  : "bg-brand-cyan text-black hover:bg-brand-cyan/90"
              )}
            >
              {isSpawning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Genesis Proving ({formatTime(spawnTimer)})
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  Spawn Sovereign Agent
                </>
              )}
            </motion.button>
          </div>
        </header>

        {spawnError && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-3"
          >
            <Shield className="w-4 h-4 shrink-0" /> {spawnError}
          </motion.div>
        )}

        {/* Real-Data Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatsCard
            title="Wallet Intelligence"
            value={isMounted && isConnected && balanceData?.value !== undefined ? Number(formatEther(balanceData.value)).toFixed(4) : "—"}
            label={isMounted && isConnected ? "$0G" : "Disconnected"}
            icon={<Wallet size={20} />}
            trend={isMounted && isConnected && connectedAddress ? `Addr: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "Wallet not connected"}
            status={isMounted && isConnected ? "online" : "offline"}
          />
          <StatsCard
            title="ZK Proving Stats"
            value={networkData?.zkStats?.lastProvingTime ? `${networkData.zkStats.lastProvingTime}s` : lastProvingTime}
            label="Last Proof"
            icon={<Cpu size={20} />}
            trend={networkData?.zkStats?.status || "Groth16 (snarkjs)"} trendColor={!networkData?.zkStats?.lastProvingTime ? "text-brand-cyan/80" : networkData.zkStats.lastProvingTime < 45 ? "text-green-400" : networkData.zkStats.lastProvingTime < 90 ? "text-yellow-400" : "text-red-400"} history={networkData?.zkStats?.history}
            status={isSpawning ? "loading" : "online"}
          />
          <StatsCard
            title="Network Vitality"
            value={networkData?.network?.totalAgents || "0"}
            label="Deploys"
            icon={<Network size={20} />}
            trend={`Node: ${networkData?.network?.rpcStatus || "Syncing"}`}
            status={networkData ? "online" : "loading"}
          />
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Agents Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-white/10 pb-2 flex-1 text-white/90 uppercase tracking-wider text-xs font-bold opacity-60 font-display">
                <Shield className="w-5 h-5 text-white/50" /> Active Fleet
              </h2>
              <button
                onClick={fetchAgents}
                disabled={isLoadingAgents}
                className="ml-4 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20"
                title="Refresh from Blockchain"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingAgents ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {isLoadingAgents ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="glass-panel h-[180px] animate-pulse rounded-3xl bg-white/5" />
                  ))
                ) : (
                  currentAgents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      name={agent.name}
                      id={agent.id}
                      rootHash={agent.rootHash}
                      pubKeyHash={agent.pubKeyHash}
                      owner={agent.owner}
                      zkStatus={agent.zkStatus}
                      txHash={agent.txHash}
                      onClick={() => setSelectedAgent(agent)}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {!isLoadingAgents && agents.length > agentsPerPage && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-20 transition-all"
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${currentPage === i + 1
                        ? "bg-brand-purple/20 border-brand-purple text-brand-purple"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white disabled:opacity-20 transition-all"
                >
                  Next
                </button>
              </div>
            )}

            {agents.length === 0 && !isSpawning && !isLoadingAgents && (
              <div className="text-white/20 text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                No active agents in the fleet. Click &quot;Spawn Agent&quot; to begin.
              </div>
            )}
          </div>

          {/* Terminal / Telemetry Column */}
          <div className="lg:col-span-1">
            <TerminalLog logs={runtimeLogs} />
          </div>

        </div>
      </div>

      {/* Agent Detail Modal */}
      <AgentDetailModal 
        agent={selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
      />

      {/* Naming Modal */}
      <AnimatePresence>
        {isNamingModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNamingModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0f14] border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
                  <Cpu className="text-brand-cyan w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-display">Name Your Agent</h3>
                  <p className="text-xs text-white/40">Define your agent's identity.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/30 tracking-widest mb-2 px-1">Agent Designation</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. PR1M3-Trader"
                    value={tempAgentName}
                    onChange={(e) => setTempAgentName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tempAgentName.trim()) {
                          setIsNamingModalOpen(false);
                          handleSpawn(tempAgentName);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-brand-cyan/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
                
                <button
                  onClick={() => {
                      setIsNamingModalOpen(false);
                      handleSpawn(tempAgentName);
                  }}
                  disabled={!tempAgentName.trim()}
                  className="w-full py-4 rounded-2xl bg-brand-cyan text-black font-bold uppercase tracking-widest text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-cyan/90 transition-all shadow-lg shadow-brand-cyan/10"
                >
                  Initiate Genesis
                </button>
                <button
                  onClick={() => setIsNamingModalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-white/5 text-white/40 font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
