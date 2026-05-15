"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Terminal, Cpu } from "lucide-react";

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
    <div className="glass-panel p-6 rounded-2xl flex flex-col h-full min-h-[450px] border-white/5 bg-black/60 relative overflow-hidden group">
      {/* Ambient Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] group-hover:opacity-[0.05] transition-opacity bg-[radial-gradient(var(--color-brand-purple)_1px,transparent_1px)] bg-[length:20px_20px] z-10" />
      
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3 relative z-20">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-brand-purple" />
          <h3 className="font-bold text-white/90 text-[10px] uppercase tracking-[0.3em] font-display">System Orchestration</h3>
        </div>
        <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-[9px] text-brand-cyan font-mono uppercase font-bold tracking-tighter">Live Log Stream</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 font-mono text-[10px] leading-relaxed text-brand-cyan overflow-y-auto flex flex-col gap-2 relative z-20 custom-scrollbar pr-2"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-white/10">
            <Cpu size={32} className="animate-pulse" />
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold">Listening for ZK intent events...</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <motion.div
              key={`${i}-${log.slice(0, 15)}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <span className="text-white/20 font-bold shrink-0 min-w-[24px]">{i.toString().padStart(2, '0')}</span>
              <span className={`break-all ${
                log.includes('✅') || log.includes('SUCCESS') ? 'text-green-400' : 
                log.includes('❌') || log.includes('ERROR') ? 'text-red-400' : 
                log.includes('>>') ? 'text-brand-purple font-bold' :
                'text-brand-cyan/80'
              }`}>
                {log}
              </span>
            </motion.div>
          ))
        )}
        
        {/* Animated cursor if waiting or active */}
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-1.5 h-3 bg-brand-purple mt-1 shadow-[0_0_10px_var(--color-brand-purple)]"
        />
      </div>
      
      {/* Footer info */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[8px] text-white/10 font-mono relative z-20">
        <span className="tracking-widest">STDOUT_STREAMING_ACTIVE</span>
        <span className="flex items-center gap-1 opacity-50"><Cpu size={8} /> 0G-GALILEO-V1-NET</span>
      </div>
    </div>
  );
}
