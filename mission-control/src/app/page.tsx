"use client";

import { AgentCard } from "@/components/AgentCard";
import { TerminalLog } from "@/components/TerminalLog";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Activity, Loader2 } from "lucide-react";
import { useState } from "react";

export default function MissionControl() {
  const [isSpawning, setIsSpawning] = useState(false);
  const [agents, setAgents] = useState([
    {
      name: "Ares-Yield-Bot",
      id: "AGENT-001",
      rootHash: "0x999999123456...a1b2c3d4",
      zkStatus: "Verified" as const,
    },
    {
      name: "Hermes-Arb-Screener",
      id: "AGENT-002",
      rootHash: "0xabcdef123456...5e6f7g8h",
      zkStatus: "Pending" as const,
    },
    {
      name: "Athena-Risk-Manager",
      id: "AGENT-003",
      rootHash: "0x000000000000...00000000",
      zkStatus: "Failed" as const,
    }
  ]);

  const handleSpawn = () => {
    setIsSpawning(true);
    
    // Simulate the 0G DKG and Contract Transaction delay
    setTimeout(() => {
      const newAgent = {
        name: `Sovereign-Alpha-${Math.floor(Math.random() * 999)}`,
        id: `AGENT-00${agents.length + 1}`,
        rootHash: "0x" + Math.random().toString(16).slice(2, 14) + "...",
        zkStatus: "Verified" as const,
      };
      
      setAgents([newAgent, ...agents]);
      setIsSpawning(false);
    }, 2000);
  };

  return (
    <main className="min-h-screen p-8 lg:p-24 relative">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-cyan/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-purple/20 blur-[120px] rounded-full point-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Area */}
        <header className="mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan bg-brand-cyan/10 text-brand-cyan text-xs font-bold uppercase tracking-widest mb-4"
            >
              <Activity className="w-4 h-4" /> 0G Newton Testnet Active
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
            className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSpawning ? (
              <>
                <Loader2 className="w-5 h-5 text-brand-purple animate-spin" />
                Spawning...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-brand-purple" />
                Spawn Agent
              </>
            )}
          </button>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Agents Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2 border-b border-white/10 pb-2 flex-1 text-white/90">
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
          </div>

          {/* Terminal / Telemetry Column */}
          <div className="lg:col-span-1">
            <TerminalLog />
          </div>

        </div>
      </div>
    </main>
  );
}

