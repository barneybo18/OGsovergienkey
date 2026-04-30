"use client";

import { motion } from "framer-motion";
import { Copy, ShieldCheck, Cpu } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AgentCardProps {
  name: string;
  id: string;
  rootHash: string;
  zkStatus: "Verified" | "Pending" | "Failed";
  txHash?: string;
  className?: string;
}

export function AgentCard({ name, id, rootHash, zkStatus, txHash, className }: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
      className={cn("glass-panel p-6 rounded-2xl flex flex-col gap-4 group cursor-pointer transition-all", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/30">
            <Cpu className="text-[var(--color-brand-cyan)] w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-wide text-white">{name}</h3>
            <p className="text-xs text-white/40 uppercase tracking-widest">{id}</p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2",
          zkStatus === "Verified" ? "bg-green-500/10 text-green-400 border border-green-500/20" : 
          zkStatus === "Pending" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
          "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          {zkStatus === "Verified" && <ShieldCheck className="w-3 h-3" />}
          {zkStatus}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Latest Memory Log (0G DA)</span>
          <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex items-center justify-between group-hover:border-[var(--color-brand-cyan)]/30 transition-colors">
            <span className="text-xs font-mono text-white/80 truncate w-4/5">{rootHash}</span>
            <button className="text-white/40 hover:text-white transition-colors">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        {txHash && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Testnet TX Hash</span>
            <div className="bg-black/40 p-2 rounded-lg border border-white/5 flex items-center justify-between hover:border-brand-purple/30 transition-colors">
              <span className="text-xs font-mono text-brand-purple/90 truncate w-4/5">{txHash}</span>
              <button className="text-white/40 hover:text-white transition-colors">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
