"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Settings, BrainCircuit, Key, HardDrive, Home, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemory } from "@/lib/memory-store";

export default function SettingsPage() {
  const router = useRouter();
  const { profile } = useMemory();
  const [ltmEnabled, setLtmEnabled] = useState(true);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [model, setModel] = useState("gemini-1.5-flash");
  const [embedding, setEmbedding] = useState("google-001");
  const [apiKey, setApiKey] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLanding = async () => {
    setIsNavigating(true);
    await new Promise(r => setTimeout(r, 1000));
    router.push("/");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 drop-shadow-sm"><Settings className="w-8 h-8 text-text-primary" /> Engine Settings</h1>
          <p className="text-text-muted mt-2 font-medium">Configure your AI Learning Twin and advanced Python engine parameters.</p>
        </div>
        <button 
          onClick={handleLanding}
          disabled={isNavigating}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent-blue/10 text-accent-blue border border-accent-blue/30 hover:bg-accent-blue hover:text-text-primary rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-50"
        >
          {isNavigating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Home className="w-4 h-4" />}
          {isNavigating ? "Redirecting..." : "Landing Page"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Memory & DB */}
        <Card variant="glass" className="p-6 md:col-span-2 space-y-5 bg-bg-glass backdrop-blur-3xl border border-border-primary shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3 mb-2 border-b border-border-primary pb-4">
             <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 flex items-center justify-center border border-accent-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
               <HardDrive className="w-5 h-5 text-accent-cyan" />
             </div>
             <h2 className="font-bold text-xl text-text-primary">Memory Engine</h2>
          </div>
          <div className="space-y-4">
            <div 
              onClick={() => setLtmEnabled(!ltmEnabled)}
              className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${ltmEnabled ? "bg-accent-cyan/10 border-accent-cyan/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]" : "bg-bg-card border-border-primary hover:bg-bg-primary/70"}`}
            >
              <div>
                <p className="font-bold text-sm text-text-primary">Long-Term Memory Indexing</p>
                <p className="text-xs text-text-muted mt-1 font-medium">Allow Twin to remember chat history permanently.</p>
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${ltmEnabled ? "bg-accent-cyan shadow-[0_0_10px_rgba(6,182,212,0.6)]" : "bg-bg-primary border border-border-hover"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${ltmEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </div>
            <div 
              onClick={() => setRagEnabled(!ragEnabled)}
              className={`flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all border ${ragEnabled ? "bg-accent-cyan/10 border-accent-cyan/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]" : "bg-bg-card border-border-primary hover:bg-bg-primary/70"}`}
            >
              <div>
                <p className="font-bold text-sm text-text-primary">Learning Space RAG (Python Engine)</p>
                <p className="text-xs text-text-muted mt-1 font-medium">Connect Co-Writer to your uploaded PDFs.</p>
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${ragEnabled ? "bg-accent-cyan shadow-[0_0_10px_rgba(6,182,212,0.6)]" : "bg-bg-primary border border-border-hover"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${ragEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </div>
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-border-primary">
            <button className="text-[11px] font-black uppercase tracking-widest text-rose-400 hover:text-text-primary bg-rose-500/10 hover:bg-rose-500 px-4 py-2 rounded-lg transition-all border border-rose-500/20">
              Clear all L1/L2 Memory
            </button>
          </div>
        </Card>


      </div>
    </div>
  );
}
