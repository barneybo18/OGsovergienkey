"use client";

import { AgentCard } from "@/components/AgentCard";
import { AgentDetailModal } from "@/components/AgentDetailModal";
import { TerminalLog } from "@/components/TerminalLog";
import { StatsCard } from "@/components/StatsCard";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Activity, Loader2, Wallet, Cpu, Network, RotateCw } from "lucide-react";
import { useState, useEffect } from "react";

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
  }
}

export default function MissionControl() {
  const [isSpawning, setIsSpawning] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 6;

  // Real-time network and performance state
  const [networkData, setNetworkData] = useState<NetworkStatus | null>(null);
  const [lastProvingTime, setLastProvingTime] = useState<string>("0s");
  const [spawnError, setSpawnError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const res = await fetch("/api/get-agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
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

  const handleSpawn = async () => {
    setSpawnError(null);
    setIsSpawning(true);
    setRuntimeLogs(["Initializing Peer-to-Peer Orchestrator...", "Contacting 0G Galileo Testnet..."]);
    
    try {
      const response = await fetch("/api/spawn-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Sovereign-Alpha-${Math.floor(Math.random() * 999)}`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setRuntimeLogs(prev => [...prev, `❌ ERROR: ${data.message}`]);
        throw new Error(data.message || "Spawn failed");
      }

      const logs = data.logs ? data.logs.split("\n").filter((l: string) => l.trim().length > 0) : [];
      setRuntimeLogs(prev => [...prev, ...logs, "✅ E2E Cycle Finalized."]);
      
      if (data.provingTime !== "N/A") {
          setLastProvingTime(data.provingTime);
      }

      // Re-fetch the full list to ensure everything is in sync
      fetchAgents();
      fetchNetworkStatus(); 
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Spawn failed:", err);
      setSpawnError(err.message || "Spawn failed — check terminal logs for details.");
    } finally {
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
    <main className="min-h-screen p-8 lg:p-24 relative overflow-hidden bg-[#020408]">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-cyan/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none" />
      
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
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan bg-brand-cyan/10 text-brand-cyan text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Activity className="w-4 h-4" /> 0G Galileo Testnet Active
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 text-white font-display">
              Sovereign <span className="text-gradient">Agents</span>
            </h1>
            <p className="text-lg text-white/60 max-w-2xl font-light">
              Mission Control Dashboard. Monitor AI execution, enforce cryptographic constitutions, and manage immutable intent memory on the 0G DA layer.
            </p>
          </div>
          <button 
            disabled={isSpawning}
            onClick={handleSpawn}
            className="glass-panel px-8 py-4 rounded-full flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
          >
            {isSpawning ? (
              <>
                <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                Wait (ZK Proving)...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-brand-purple" />
                Spawn Agent
              </>
            )}
          </button>
        </header>

        {spawnError && (
          <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3">
            ❌ {spawnError}
          </div>
        )}

        {/* Real-Data Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatsCard 
                title="Wallet Intelligence" 
                value={networkData?.wallet?.balance || "0.00"} 
                label="$0G" 
                icon={<Wallet size={20} />}
                trend={networkData?.wallet?.address ? `Addr: ${networkData.wallet.address.slice(0,6)}...${networkData.wallet.address.slice(-4)}` : "Checking RPC..."}
                status={networkData ? "online" : "loading"}
            />
            <StatsCard 
                title="ZK Proving Stats" 
                value={lastProvingTime} 
                label="Duration" 
                icon={<Cpu size={20} />}
                trend="Groth16 (snarkjs / circom 2.0)"
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
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                        currentPage === i + 1 
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
    </main>
  );
}

