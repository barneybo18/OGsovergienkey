"use client";

import { AgentCard } from "@/components/AgentCard";
import { TerminalLog } from "@/components/TerminalLog";
import { StatsCard } from "@/components/StatsCard";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Activity, Loader2, Wallet, Cpu, Network } from "lucide-react";
import { useState, useEffect } from "react";

interface Agent {
  name: string;
  id: string;
  rootHash: string;
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
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  
  // Real-time network and performance state
  const [networkData, setNetworkData] = useState<NetworkStatus | null>(null);
  const [lastProvingTime, setLastProvingTime] = useState<string>("0s");

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
    const interval = setInterval(fetchNetworkStatus, 10000); // 10s refresh
    return () => clearInterval(interval);
  }, []);

  const handleSpawn = async () => {
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

      const newAgent: Agent = {
        name: data.name,
        id: `ID: ${data.agentId}`,
        rootHash: data.rootHash,
        zkStatus: "Verified" as const,
        txHash: data.txHash
      };

      setAgents([newAgent, ...agents]);
      fetchNetworkStatus(); // Refresh stats after spawn
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Spawn failed:", err);
    } finally {
      setIsSpawning(false);
    }
  };

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
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 text-white">
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
                trend="STARK (Local SP1 Prover)"
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
              <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-white/10 pb-2 flex-1 text-white/90 uppercase tracking-wider text-xs font-bold opacity-60">
                <Shield className="w-5 h-5 text-white/50" /> Active Fleet
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {agents.map((agent) => (
                  <AgentCard 
                    key={agent.id}
                    name={agent.name}
                    id={agent.id}
                    rootHash={agent.rootHash}
                    zkStatus={agent.zkStatus}
                  />
                ))}
            </AnimatePresence>
            </div>
            {agents.length === 0 && !isSpawning && (
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
    </main>
  );
}

