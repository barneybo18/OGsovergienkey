"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  label: string;
  icon: ReactNode;
  trend?: string;
  status?: "online" | "loading" | "offline";
  trendColor?: string;
  history?: number[];
}

export function StatsCard({ title, value, label, icon, trend, status = "online", trendColor, history }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-all border border-white/5 bg-white/[0.02]"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-white/5 text-white/70 group-hover:text-brand-cyan transition-colors">
          {icon}
        </div>
        {status && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/20 border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              status === "online" ? "bg-green-500" : status === "loading" ? "bg-yellow-500" : "bg-red-500"
            }`} />
            <span className="text-[10px] uppercase tracking-tighter text-white/40 font-bold">{status}</span>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-3xl font-bold tracking-tighter text-white truncate min-w-0">{value}</span>
          <span className="text-xs text-white/60 font-medium flex-shrink-0">{label}</span>
        </div>
        {trend && (
          <p className={cn(
            "mt-2 text-[10px] font-semibold tracking-wide flex items-center gap-1",
            trendColor || "text-brand-cyan/80"
          )}>
            {trend}
          </p>
        )}
      </div>

      {/* Sparkline Overlay */}
      {history && history.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden pointer-events-none opacity-20">
          <svg viewBox={`0 0 ${history.length - 1} 100`} className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              points={history.map((val, i) => `${i},${100 - (val / Math.max(...history)) * 80}`).join(" ")}
              className="text-brand-cyan"
            />
          </svg>
        </div>
      )}

      {/* Background patterns */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// Utility to merge classes (already in page.tsx but needed here or imported)
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
