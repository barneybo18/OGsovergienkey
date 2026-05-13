"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Cpu, Network, Lock, Fingerprint, Database, ExternalLink, Copy, Terminal, History, Info } from "lucide-react";
import { useState } from "react";
import { TaskPanel } from "./TaskPanel";

interface AgentDetailModalProps {
  agent: {
    name: string;
    id: string;
    rootHash: string;
    pubKeyHash?: string;
    owner?: string;
    zkStatus: string;
    txHash?: string;
  } | null;
  onClose: () => void;
}

type Tab = "identity" | "governance" | "action";

export function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("identity");

  if (!agent) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: "identity", label: "Identity", icon: <Fingerprint size={14} /> },
    { id: "governance", label: "Governance", icon: <Shield size={14} /> },
    { id: "action", label: "Sovereign Action", icon: <Terminal size={14} /> },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-[85vh] bg-[#0a0c10] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl shadow-brand-cyan/5 flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/30 shadow-[0_0_20px_rgba(0,255,242,0.1)]">
                <Cpu className="text-brand-cyan w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-bold text-white font-display tracking-tight">{agent.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                    {agent.zkStatus}
                  </span>
                </div>
                <p className="text-xs text-white/30 uppercase tracking-[0.3em] font-mono">{agent.id}</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all ${
                    activeTab === tab.id 
                    ? "bg-brand-cyan text-black shadow-lg" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <button 
              onClick={onClose}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar / Info Panel (Always visible on large screens) */}
            <div className="w-full md:w-80 border-r border-white/5 p-8 bg-black/20 overflow-y-auto hidden md:block">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Info size={12} /> System Specs
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-brand-cyan uppercase font-bold mb-2">Settlement Layer</p>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/80 font-medium mb-1 flex items-center gap-2">
                      <Network size={12} className="text-brand-purple" /> 0G Galileo
                    </p>
                    <a 
                      href={`https://chainscan-galileo.0g.ai/tx/${agent.txHash}`}
                      target="_blank"
                      className="text-[10px] text-white/40 font-mono truncate block hover:text-brand-purple transition-colors"
                    >
                      {agent.txHash?.slice(0, 20)}...
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-brand-cyan uppercase font-bold mb-2">Memory Consistency</p>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-white/80 font-medium mb-1 flex items-center gap-2">
                      <Database size={12} className="text-brand-cyan" /> 0G Storage DA
                    </p>
                    <code className="text-[10px] text-white/40 font-mono break-all block leading-tight">
                      {agent.rootHash.slice(0, 40)}...
                    </code>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/30">Latency</span>
                    <span className="text-green-400 font-mono">14ms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-white/30">Uptime</span>
                    <span className="text-white/80 font-mono">99.9%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === "identity" && (
                  <motion.div
                    key="identity"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                          <Fingerprint className="text-brand-cyan" /> Cryptographic Identity
                        </h3>
                        <span className="text-[10px] text-white/20 uppercase tracking-widest font-mono">MPC-V1 Protocol</span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-panel p-6 rounded-[32px] border-white/10 bg-white/[0.01]">
                          <p className="text-[10px] text-white/30 uppercase font-bold mb-4 tracking-wider">Aggregate Key Hash (Public)</p>
                          <div className="flex items-center justify-between gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <code className="text-sm text-brand-cyan font-mono truncate">{agent.pubKeyHash || "0x7a8b...3c2d"}</code>
                            <button onClick={() => copyToClipboard(agent.pubKeyHash || "")} className="text-white/20 hover:text-white transition-colors"><Copy size={16} /></button>
                          </div>
                        </div>
                        
                        <div className="glass-panel p-6 rounded-[32px] border-white/10 bg-white/[0.01]">
                          <p className="text-[10px] text-white/30 uppercase font-bold mb-4 tracking-wider">Owner Authority (Public)</p>
                          <div className="flex items-center justify-between gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <code className="text-sm text-white/80 font-mono truncate">{agent.owner || "0x123...abc"}</code>
                            <button onClick={() => copyToClipboard(agent.owner || "")} className="text-white/20 hover:text-white transition-colors"><Copy size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6">MPC Private Shards (Encrypted)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((shard) => (
                          <div key={shard} className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-bold text-white/40">Shard #{shard}</span>
                              <Lock size={14} className={shard < 3 ? "text-green-500" : "text-yellow-500"} />
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full mb-4">
                              <div className={`h-full rounded-full ${shard < 3 ? "w-full bg-green-500/50" : "w-0 bg-yellow-500/50"}`} />
                            </div>
                            <p className="text-[10px] text-white/20 font-mono italic">
                              {shard < 3 ? "Verified in SAK enclave" : "Awaiting distributed signature"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === "governance" && (
                  <motion.div
                    key="governance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <section>
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <Shield className="text-brand-purple" /> Verifiable Constitution
                      </h3>
                      <div className="glass-panel p-8 rounded-[32px] border-brand-purple/20 bg-brand-purple/5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                          <div>
                            <p className="text-[10px] text-brand-purple uppercase font-bold mb-4 tracking-widest">Active Constraints</p>
                            <ul className="space-y-4">
                              <li className="flex items-center justify-between">
                                <span className="text-sm text-white/60">Spending Limit</span>
                                <span className="text-sm text-white font-mono">1000.00 $0G</span>
                              </li>
                              <li className="flex items-center justify-between">
                                <span className="text-sm text-white/60">Destination Whitelist</span>
                                <span className="text-sm text-green-400 font-bold">ENABLED</span>
                              </li>
                              <li className="flex items-center justify-between">
                                <span className="text-sm text-white/60">Logic Verification</span>
                                <span className="text-sm text-brand-cyan font-mono">Circom-Groth16</span>
                              </li>
                            </ul>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-center">
                              <p className="text-xs text-white/40 italic mb-4">"The agent shall not exceed 1000 $0G per transaction and must only interact with verified contract interfaces."</p>
                              <button className="text-[10px] text-brand-purple font-bold uppercase tracking-widest hover:underline">View Source (Circom)</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <History size={14} /> Immutable Intent History (0G Storage)
                      </h3>
                      <div className="bg-black/40 rounded-[24px] border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/5 font-bold uppercase tracking-tighter text-white/30">
                              <th className="p-4">Action Hash</th>
                              <th className="p-4">Intent Type</th>
                              <th className="p-4">ZK Proof</th>
                              <th className="p-4">Settlement</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1].map((i) => (
                              <tr key={i} className="border-b border-white/5 text-white/60 font-mono hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 truncate max-w-[120px]">{agent.rootHash.slice(0, 16)}...</td>
                                <td className="p-4 text-brand-cyan">SPAWN_AGENT</td>
                                <td className="p-4 text-green-400">PASSED</td>
                                <td className="p-4">BLOCK #104231</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === "action" && (
                  <motion.div
                    key="action"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <TaskPanel agentId={agent.id} owner={agent.owner || ""} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer / Meta */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Live Telemetry Synchronized</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="px-8 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-xs uppercase tracking-widest border border-white/10"
            >
              Close Console
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
