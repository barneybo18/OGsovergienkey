"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

const SIMULATED_LOGS = [
  ">> INTENT: Detected transfer of 500 ETH to 0x12..",
  ">> PROVING: Generating RISC-V ZK receipt...",
  ">> VERIFIED: Intent satisfies Constitution max_spend limit.",
  ">> 0G STORAGE: Encrypted payload pinned.",
  ">> SUCCESS: 0G Root Hash 0xabcdef... committed."
];

export function TerminalLog() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < SIMULATED_LOGS.length) {
        setLogs(prev => [...prev, SIMULATED_LOGS[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full min-h-[300px]">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <Terminal className="w-5 h-5 text-[var(--color-brand-purple)]" />
        <h3 className="font-semibold text-white/90 text-sm uppercase tracking-widest">Network Telemetry</h3>
      </div>
      <div className="flex-1 font-mono text-sm text-[var(--color-brand-cyan)] overflow-y-auto flex flex-col gap-2">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {log}
          </motion.div>
        ))}
        {logs.length < SIMULATED_LOGS.length && (
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="w-2 h-4 bg-[var(--color-brand-purple)] mt-1"
          />
        )}
      </div>
    </div>
  );
}
