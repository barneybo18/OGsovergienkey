"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

interface TerminalLogProps {
  logs: string[];
}

export function TerminalLog({ logs }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full min-h-[300px]">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <Terminal className="w-5 h-5 text-[var(--color-brand-purple)]" />
        <h3 className="font-semibold text-white/90 text-sm uppercase tracking-widest">Network Telemetry</h3>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 font-mono text-sm text-[var(--color-brand-cyan)] overflow-y-auto flex flex-col gap-2 max-h-[400px] custom-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="text-white/30 italic">Waiting for orchestrator signal...</div>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={`${i}-${log.slice(0, 10)}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="break-all"
            >
              <span className="text-[var(--color-brand-purple)] mr-2">➜</span>
              {log}
            </motion.div>
          ))
        )}
        
        {/* Animated cursor if waiting or active */}
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-2 h-4 bg-[var(--color-brand-purple)] mt-1"
        />
      </div>
    </div>
  );
}
