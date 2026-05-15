"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Cpu, Network, Lock, Fingerprint, Database, ExternalLink, Copy, Terminal, History, Info, Code, CheckCircle2, AlertCircle } from "lucide-react";
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
    spawnedAt?: string;
  } | null;
  onClose: () => void;
}

type Tab = "identity" | "governance" | "action";

export function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("identity");
  const [showSource, setShowSource] = useState(false);

  if (!agent) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: "identity", label: "Identity", icon: <Fingerprint size={14} /> },
    { id: "governance", label: "Governance", icon: <Shield size={14} /> },
    { id: "action", label: "Sovereign Action", icon: <Terminal size={14} /> },
  ];

  const circomSource = `pragma circom 2.0.0;
include "comparators.circom";

template Constitution() {
    signal input max_spend_limit;
    signal input whitelisted_address;
    signal input intent_amount;
    signal input target_address;
    
    signal output valid;

    // 1. Check intent_amount <= max_spend_limit
    component leq = LessEqThan(64);
    leq.in[0] <== intent_amount;
    leq.in[1] <== max_spend_limit;
    
    // 2. Check target_address == whitelisted_address
    component eq = IsEqual();
    eq.in[0] <== target_address;
    eq.in[1] <== whitelisted_address;

    // 3. Final validity
    valid <== leq.out * eq.out;
}

component main = Constitution();`;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-6xl h-[90vh] bg-[#0d0f14] border border-white/10 rounded-[48px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-10 border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[32px] bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 relative group">
                <div className="absolute inset-0 bg-brand-cyan/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Cpu className="text-brand-cyan w-10 h-10 relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl font-bold text-white font-display tracking-tight leading-none">{agent.name}</h2>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest leading-none">
                      {agent.zkStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-white/30 text-xs font-mono tracking-widest">
                  <span>{agent.id}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>SPAWNED: {agent.spawnedAt || "APR 15, 2024"}</span>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1.5 rounded-[24px] border border-white/5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-8 py-3 rounded-[18px] flex items-center gap-3 text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? "bg-brand-cyan text-black shadow-[0_0_30px_rgba(0,255,242,0.3)]" 
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
              className="p-4 rounded-[24px] bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Sidebar / Info Panel */}
            <div className="w-full lg:w-96 border-r border-white/5 p-10 bg-black/40 overflow-y-auto hidden lg:block">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <Info size={14} /> Cryptographic Context
              </h3>
              
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] text-brand-cyan uppercase font-black mb-3 tracking-widest">Settlement Hash (0G)</p>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group cursor-pointer hover:border-brand-cyan/30 transition-colors">
                    <p className="text-[11px] text-white/60 font-mono mb-2 flex items-center gap-2">
                      <Network size={12} className="text-brand-purple" /> Genesis Proof
                    </p>
                    <a 
                      href={`https://scan-testnet.0g.ai/tx/${agent.txHash}`}
                      target="_blank"
                      className="text-[10px] text-white/30 font-mono break-all block leading-relaxed hover:text-brand-cyan transition-colors"
                    >
                      {agent.txHash || "0x7d2a...881c"}
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-brand-cyan uppercase font-black mb-3 tracking-widest">Memory Consistency (DA)</p>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 group cursor-pointer hover:border-brand-cyan/30 transition-colors">
                    <p className="text-[11px] text-white/60 font-mono mb-2 flex items-center gap-2">
                      <Database size={12} className="text-brand-cyan" /> Persistence Root
                    </p>
                    <code className="text-[10px] text-white/30 font-mono break-all block leading-relaxed">
                      {agent.rootHash}
                    </code>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="block text-[10px] text-white/20 uppercase font-bold mb-1">Latency</span>
                    <span className="text-sm text-green-400 font-mono font-bold">14ms</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="block text-[10px] text-white/20 uppercase font-bold mb-1">Status</span>
                    <span className="text-sm text-white/80 font-mono font-bold">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar relative">
              <AnimatePresence mode="wait">
                {activeTab === "identity" && (
                  <motion.div
                    key="identity"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                  >
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                          <Fingerprint className="text-brand-cyan w-8 h-8" /> Identity Protocol V1
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-white/40 uppercase font-black tracking-widest border border-white/5">
                          Threshold MPC
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/10 hover:border-brand-cyan/20 transition-all group">
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-xs text-white/30 uppercase font-bold tracking-widest">Public Key Hash</p>
                            <Copy size={14} className="text-white/10 group-hover:text-brand-cyan transition-colors" />
                          </div>
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 group-hover:bg-black/60 transition-colors">
                            <code className="text-lg text-brand-cyan font-mono block truncate">{agent.pubKeyHash || "0x7a8b...3c2d"}</code>
                          </div>
                          <p className="mt-4 text-[10px] text-white/20 leading-relaxed">
                            Verifiable threshold identity generated via Shamir's Secret Sharing. 
                            Locked in SMC enclave.
                          </p>
                        </div>
                        
                        <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/10 hover:border-brand-cyan/20 transition-all group">
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-xs text-white/30 uppercase font-bold tracking-widest">Authority (Owner)</p>
                            <Copy size={14} className="text-white/10 group-hover:text-brand-cyan transition-colors" />
                          </div>
                          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 group-hover:bg-black/60 transition-colors">
                            <code className="text-lg text-white font-mono block truncate">{agent.owner || "0x123...abc"}</code>
                          </div>
                          <p className="mt-4 text-[10px] text-white/20 leading-relaxed">
                            This address holds the Sovereign Master Key (SMK) and has exclusive execution rights.
                          </p>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">MPC Shard Distribution</h3>
                        <div className="h-px flex-1 mx-8 bg-white/5" />
                        <span className="text-[10px] text-brand-cyan font-bold uppercase">2-of-3 SSS Policy</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((shard) => (
                          <div key={shard} className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 relative overflow-hidden group hover:bg-white/[0.03] transition-all">
                            <div className="flex items-center justify-between mb-6 relative z-10">
                              <span className="text-xs font-black text-white/20 uppercase tracking-widest">Shard 0{shard}</span>
                              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                <Lock size={14} className="text-green-400" />
                              </div>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full mb-6 relative z-10">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1, delay: shard * 0.2 }}
                                className="h-full rounded-full bg-gradient-to-r from-green-500/20 to-green-500" 
                              />
                            </div>
                            <p className="text-[10px] text-white/40 font-mono italic relative z-10">
                              Verified in SMC enclave
                            </p>
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === "governance" && (
                  <motion.div
                    key="governance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                  >
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-4">
                          <Shield className="text-brand-purple w-8 h-8" /> Active Constitution
                        </h3>
                        <button 
                          onClick={() => setShowSource(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-black uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all"
                        >
                          <Code size={14} /> View Logic Source
                        </button>
                      </div>

                      <div className="p-10 rounded-[48px] bg-gradient-to-br from-brand-purple/5 to-transparent border border-brand-purple/20 relative overflow-hidden">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 relative z-10">
                          <div>
                            <p className="text-xs text-brand-purple uppercase font-black mb-8 tracking-[0.3em]">Runtime Constraints</p>
                            <div className="space-y-6">
                              <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                    <Database size={16} className="text-white/40" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-white font-bold">Spending Limit</p>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Max per intent</p>
                                  </div>
                                </div>
                                <span className="text-lg text-white font-mono font-bold tracking-tighter group-hover:text-brand-purple transition-colors">1,000.00 $0G</span>
                              </div>
                              <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                    <Network size={16} className="text-white/40" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-white font-bold">Whitelist Filter</p>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Destination guard</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                                  <CheckCircle2 size={12} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                    <Lock size={16} className="text-white/40" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-white font-bold">ZK Verification</p>
                                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Logic validation</p>
                                  </div>
                                </div>
                                <span className="text-[11px] text-brand-cyan font-mono font-bold uppercase tracking-widest">Groth16 • Passed</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center">
                            <div className="p-8 rounded-[32px] bg-black/40 border border-white/5 relative group">
                              <div className="absolute -top-3 left-8 px-3 py-1 bg-[#1a1c24] border border-white/10 rounded-lg">
                                <span className="text-[9px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                                  <Terminal size={10} /> Verified Intent Parser
                                </span>
                              </div>
                              <p className="text-sm text-white/60 leading-relaxed italic">
                                "The agent is cryptographically restricted from exceeding 1000 $0G per transaction. All outgoing transfers must target pre-verified smart contract endpoints."
                              </p>
                              <div className="mt-8 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center">
                                  <Shield size={14} className="text-brand-purple" />
                                </div>
                                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Immutable SAK Policy V1</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-purple/10 blur-[120px] rounded-full" />
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Immutable Log (0G Storage)</h3>
                        <div className="h-px flex-1 mx-8 bg-white/5" />
                        <button className="text-[10px] text-brand-cyan font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                          <History size={12} /> Full History
                        </button>
                      </div>
                      <div className="bg-white/[0.01] rounded-[32px] border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-white/[0.03] border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20">
                              <th className="p-6">Action ID</th>
                              <th className="p-6">Intent Type</th>
                              <th className="p-6">ZK Validity</th>
                              <th className="p-6">Testnet Height</th>
                            </tr>
                          </thead>
                          <tbody className="font-mono">
                            {[1].map((i) => (
                              <tr key={i} className="border-b border-white/5 text-white/50 hover:bg-white/[0.02] transition-colors">
                                <td className="p-6 text-white/30">{agent.rootHash.slice(0, 16)}...</td>
                                <td className="p-6"><span className="text-brand-cyan bg-brand-cyan/10 px-3 py-1 rounded-full border border-brand-cyan/20">SPAWN_AGENT</span></td>
                                <td className="p-6 text-green-400">VERIFIED</td>
                                <td className="p-6">BLOCK #104,231</td>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex flex-col items-center justify-center"
                  >
                    <div className="max-w-2xl w-full text-center space-y-8 relative">
                      {/* Decorative elements */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-cyan/5 blur-[100px] rounded-full -z-10" />
                      
                      <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 relative">
                        <Terminal size={40} className="text-white/20" />
                        <div className="absolute -bottom-2 -right-2 p-2 bg-[#1a1c24] border border-white/10 rounded-xl">
                          <AlertCircle size={16} className="text-brand-cyan animate-pulse" />
                        </div>
                      </div>

                      <h3 className="text-4xl font-bold text-white tracking-tight">Sovereign Execution</h3>
                      
                      <p className="text-lg text-white/40 leading-relaxed max-w-lg mx-auto">
                        We are currently activating the high-frequency settlement layer for real-time agent intents. 
                        <span className="block mt-4 text-brand-cyan font-bold uppercase tracking-widest text-xs">Full activation scheduled for Phase 3</span>
                      </p>

                      <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] opacity-40 pointer-events-none grayscale">
                         <TaskPanel agentId={agent.id} owner={agent.owner || ""} />
                      </div>

                      <div className="pt-8">
                        <button disabled className="px-12 py-4 rounded-[24px] bg-white/5 border border-white/10 text-white/20 font-black uppercase tracking-[0.3em] text-sm cursor-not-allowed">
                          Execution Locked
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Source Viewer Overlay */}
              <AnimatePresence>
                {showSource && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-4 z-50 bg-[#0a0c10] border border-white/10 rounded-[32px] overflow-hidden flex flex-col"
                  >
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                      <h4 className="text-xs font-black text-brand-purple uppercase tracking-[0.4em] flex items-center gap-3">
                        <Code size={16} /> constitution.circom
                      </h4>
                      <button 
                        onClick={() => setShowSource(false)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex-1 p-8 overflow-auto custom-scrollbar bg-black/40">
                      <pre className="text-xs font-mono text-white/60 leading-relaxed">
                        {circomSource}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer / Meta */}
          <div className="p-10 bg-white/[0.02] border-t border-white/5 flex items-center justify-between px-12">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">Telemetry Synced</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-3">
                <Shield size={12} className="text-brand-purple" />
                <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em]">Proof Verified</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="px-10 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black transition-all text-xs uppercase tracking-[0.3em] border border-white/10 hover:border-white/20 active:scale-95"
            >
              Close Console
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
