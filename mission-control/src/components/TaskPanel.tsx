'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Terminal, Send, Loader2, CheckCircle2, History, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  instruction: string;
  result: string;
  timestamp: number;
  completed: boolean;
}

export function TaskPanel({ agentId, owner }: { agentId: string; owner: string }) {
  const { address, isConnected } = useAccount();
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isProving, setIsProving] = useState(false);

  // Strip "ID: " from agentId if present
  const cleanId = agentId.replace('ID: ', '');
  const isOwner = isConnected && address?.toLowerCase() === owner?.toLowerCase();

  const fetchTasks = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/agent/${cleanId}/tasks`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks.reverse()); // Show newest first
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [cleanId]);

  const handleExecute = async () => {
    if (!instruction) return;
    setLoading(true);
    setStatus('Dispatching ZK task...');
    try {
      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: cleanId, instruction }),
      });
      const data = await res.json();
      if (data.success) {
        setInstruction('');
        setLoading(false);
        setStatus('');
        // Task is proving in the background — poll the chain every 15s
        setIsProving(true);
        setStatus('Generating ZK Proof... (30-60s)');
        let attempts = 0;
        const maxAttempts = 12; // 12 * 15s = 3 minutes
        const poll = setInterval(async () => {
          attempts++;
          const prevCount = tasks.length;
          await fetchTasks();
          setStatus(`Proving in background... polling chain (${attempts}/${maxAttempts})`);
          // If we got a new task, stop polling
          setTasks(prev => {
            if (prev.length > prevCount) {
              clearInterval(poll);
              setIsProving(false);
              setStatus('');
            }
            return prev;
          });
          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setIsProving(false);
            setStatus('Proof may still be processing — click Refresh.');
            setTimeout(() => setStatus(''), 5000);
          }
        }, 15000);
      } else {
        alert("Execution failed: " + data.message);
        setLoading(false);
        setStatus('');
      }
    } catch (e) {
      console.error(e);
      alert("Error dispatching task.");
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-brand-cyan uppercase tracking-[0.2em] flex items-center gap-2">
            <Terminal size={14} /> Sovereign Command Console
          </h3>
          {isOwner && (
            <span className="text-[10px] text-green-400 font-bold flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
              <ShieldCheck size={10} /> Authorized
            </span>
          )}
        </div>
        
        <div className="relative group">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={!isOwner || loading}
            placeholder={isOwner ? "Enter sovereign instruction (e.g., Transfer 100 $0G to 0x...)" : "Connect as owner to issue commands"}
            className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-sm text-white/80 font-mono focus:border-brand-cyan/50 focus:outline-none transition-all resize-none h-32 shadow-inner custom-scrollbar"
          />
          <div className="absolute bottom-4 right-4">
            <button
              onClick={handleExecute}
              disabled={loading || !instruction || !isOwner}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${
                loading || !instruction || !isOwner
                ? "bg-white/5 text-white/20 border border-white/5 cursor-not-allowed"
                : "bg-brand-cyan text-black hover:shadow-[0_0_15px_rgba(0,255,242,0.3)] hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              {loading ? (status || "Verifying...") : "Execute"}
            </button>
          </div>
          {!isOwner && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center p-6 text-center">
              <p className="text-xs text-white/60 font-medium bg-[#0a0c10] px-4 py-2 rounded-full border border-white/10">
                Instruction panel locked. Owner authorization required.
              </p>
            </div>
          )}
        </div>
        {isProving && (
          <div className="mt-3 p-3 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20 flex items-center gap-3">
            <Loader2 className="animate-spin text-brand-cyan shrink-0" size={14} />
            <p className="text-[11px] text-brand-cyan font-mono">{status || 'ZK proof running in background...'}</p>
          </div>
        )}
      </section>

      <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
            <History size={14} /> Execution Audit Log
          </h3>
          <div className="flex items-center gap-3">
            {fetching && <Loader2 className="animate-spin text-brand-cyan" size={12} />}
            <button onClick={fetchTasks} className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-tighter">Refresh</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {tasks.length === 0 && !fetching ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 border border-dashed border-white/5 rounded-3xl"
              >
                <p className="text-xs text-white/20 font-mono uppercase tracking-[0.2em]">Zero Historical Artifacts Found</p>
              </motion.div>
            ) : (
              tasks.map((task, idx) => (
                <motion.div 
                  key={task.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/30 font-mono uppercase bg-white/5 px-2 py-0.5 rounded">ID #{task.id}</span>
                      <span className="text-[10px] text-green-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> ZK_VERIFIED
                      </span>
                    </div>
                    <span className="text-[9px] text-white/20 font-mono">
                      {new Date(task.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 font-mono mb-4 leading-relaxed">{task.instruction}</p>
                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 group-hover:border-brand-cyan/20 transition-colors">
                    <p className="text-[9px] text-white/30 uppercase font-bold mb-2 tracking-widest flex items-center justify-between">
                      On-Chain Output
                      <a href="#" className="text-brand-cyan hover:underline flex items-center gap-1">
                        <ExternalLink size={8} /> View on 0G DA
                      </a>
                    </p>
                    <p className="text-xs text-brand-cyan font-mono leading-tight break-all">{task.result}</p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
