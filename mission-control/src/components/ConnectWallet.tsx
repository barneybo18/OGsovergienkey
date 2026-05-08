"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { motion } from "framer-motion";
import { Wallet, LogOut, AlertTriangle } from "lucide-react";
import { ogGalileoTestnet } from "@/config/chain";

/**
 * Wallet connection button for Mission Control.
 * Handles connect/disconnect and chain switching to 0G Galileo.
 */
export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isWrongChain = isConnected && chainId !== ogGalileoTestnet.id;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Wrong chain warning */}
        {isWrongChain && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => switchChain({ chainId: ogGalileoTestnet.id })}
            className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10 transition-all text-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            Switch to 0G
          </motion.button>
        )}

        {/* Connected state */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel px-4 py-2 rounded-full flex items-center gap-3 relative group cursor-pointer"
          onClick={() => disconnect()}
          title="Disconnect Wallet"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse group-hover:bg-red-400 transition-colors" />
          <span className="text-sm font-mono text-white/80 group-hover:text-white/60 transition-colors">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <span className="text-white/40 group-hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </span>
          {/* Tooltip */}
          <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/90 border border-white/10 text-[11px] text-white/80 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            Disconnect Wallet
          </span>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      disabled={isPending}
      onClick={() => {
        const connector = connectors[0];
        if (connector) connect({ connector });
      }}
      title="Connect Wallet"
      className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 hover:bg-white/5 active:scale-95 transition-all text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed border-brand-cyan/30 relative group"
    >
      <Wallet className="w-5 h-5 text-brand-cyan" />
      {isPending ? "Connecting..." : "Connect Wallet"}
      {/* Tooltip */}
      <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-black/90 border border-white/10 text-[11px] text-white/80 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Connect Wallet
      </span>
    </motion.button>
  );
}
