"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Cpu, Network, Lock, Fingerprint, Database, ExternalLink, Copy } from "lucide-react";

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

export function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  if (!agent) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0a0c10] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-brand-cyan/10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/30">
                <Cpu className="text-brand-cyan w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-display tracking-tight">{agent.name}</h2>
                <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-mono">{agent.id}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[70vh]">
            
            {/* Column 1: Cryptographic Identity */}
            <div className="flex flex-col gap-6">
              <section>
                <h3 className="text-xs font-bold text-brand-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Fingerprint size={14} /> MPC Identity Shards
                </h3>
                <div className="space-y-3">
                  <div className="glass-panel p-4 rounded-2xl border-white/5">
                    <p className="text-[10px] text-white/30 uppercase mb-1">Aggregate Public Key Hash</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-white/70 font-mono truncate">{agent.pubKeyHash || "0x7a8b...3c2d"}</code>
                      <button onClick={() => copyToClipboard(agent.pubKeyHash || "")} className="text-white/20 hover:text-white"><Copy size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase mb-1">Owner Address</p>
                      <p className="text-xs text-white/70 font-mono truncate">{agent.owner?.slice(0,6)}...{agent.owner?.slice(-4)}</p>
                    </div>
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase mb-1">Shard Status</p>
                      <p className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <Lock size={10} /> 2/3 Active
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-brand-purple uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Shield size={14} /> Constitution Logic
                </h3>
                <div className="glass-panel p-5 rounded-2xl border-brand-purple/20 bg-brand-purple/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-white/80 font-medium">ZK Spend Enforcement</span>
                    <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">Active</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Max Spend Limit:</span>
                      <span className="text-white/90 font-mono">1000.00 $0G</span>
                    </li>
                    <li className="flex items-center justify-between text-xs">
                      <span className="text-white/40">Whitelist Restriction:</span>
                      <span className="text-white/90 font-mono">Enabled (1 Target)</span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* Column 2: 0G Storage & DA Telemetry */}
            <div className="flex flex-col gap-6">
              <section>
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Database size={14} /> 0G Storage Metadata
                </h3>
                <div className="space-y-3">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-white/30 uppercase mb-2">Memory Root Hash (DA)</p>
                    <code className="text-[11px] text-white/60 font-mono break-all block mb-3 leading-relaxed">
                      {agent.rootHash}
                    </code>
                    <a 
                      href={`https://indexer-storage-testnet-turbo.0g.ai/file/${agent.rootHash}`}
                      target="_blank"
                      className="text-[10px] text-brand-cyan hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={10} /> View on 0G Indexer
                    </a>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Network size={14} /> Network Settlement
                </h3>
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/40">Chain Status:</span>
                    <span className="text-xs text-green-400 font-bold uppercase tracking-tighter">Confirmed</span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5 mb-3">
                    <p className="text-[10px] text-white/30 uppercase mb-1">Transaction Hash</p>
                    <a 
                      href={`https://chainscan-galileo.0g.ai/tx/${agent.txHash}`}
                      target="_blank"
                      className="text-[11px] text-brand-purple font-mono truncate block hover:underline"
                    >
                      {agent.txHash}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-brand-cyan/40" />
                    </div>
                    <span className="text-[10px] text-white/30 font-mono whitespace-nowrap">GALILEO-V1</span>
                  </div>
                </div>
              </section>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-all text-sm font-medium border border-white/10"
            >
              Close Telemetry
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
