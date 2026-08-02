"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useMemory } from "@/lib/memory-store";
import { 
  PenTool, Wand2, Sparkles, Save, Maximize2, Minimize2, 
  Loader2, ArrowRight, Brain, BookOpen, GraduationCap 
} from "lucide-react";

export default function CoWriterPage() {
  const { profile } = useMemory();
  const [text, setText] = useState("The fundamental theorem of calculus connects differentiation and integration. It tells us that these two operations are essentially opposites of each other.");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Context Engine States
  const [useMemoryContext, setUseMemoryContext] = useState(true);
  const [selectedBook, setSelectedBook] = useState("");
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/books`)
      .then(res => res.json())
      .then(data => setAvailableBooks(data.books || []))
      .catch(() => setAvailableBooks([]));
  }, []);

  const processText = async (action: "improve" | "expand" | "simplify" | "continue" | "teach") => {
    if (!text.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/cowriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          action,
          profile: useMemoryContext ? profile : null,
          bookId: selectedBook || null
        }),
      });
      if (!res.ok) throw new Error("API failed");
      
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let done = false;
      let newText = "";
      
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          newText += decoder.decode(value, { stream: true });
          setText(newText);
        }
      }
    } catch (e) {
      alert("Failed to process text.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 h-[calc(100vh-6rem)] lg:h-[calc(100vh-7rem)] relative">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-accent-amber/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[10%] w-[25vw] h-[25vw] rounded-full bg-accent-purple/10 blur-[100px] mix-blend-screen" />
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col space-y-4 relative z-10 min-h-0">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 drop-shadow-sm"><PenTool className="w-6 h-6 text-accent-amber" /> AI Co-Writer</h1>
          <p className="text-sm text-text-muted mt-1 font-medium">Collaborate with your personalized AI Twin to draft, refine, and learn.</p>
        </div>
        
        <Card variant="glass" className="flex-1 flex flex-col overflow-hidden p-0 border border-border-primary bg-bg-glass backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative group">
          <div className="border-b border-border-primary bg-bg-card p-2 md:p-3 flex items-center gap-2 flex-wrap">
            <button className="text-[11px] font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors flex items-center gap-2">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <div className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => processText("improve")} disabled={isProcessing} className="text-[10px] font-black uppercase tracking-widest text-accent-amber hover:text-text-primary px-3 py-1.5 rounded-lg bg-accent-amber/20 border border-accent-amber/30 hover:bg-accent-amber hover:border-accent-amber transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Wand2 className="w-3.5 h-3.5" /> Improve
              </button>
              <button onClick={() => processText("expand")} disabled={isProcessing} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-text-primary px-3 py-1.5 rounded-lg bg-emerald-400/20 border border-emerald-400/30 hover:bg-emerald-50 hover:border-emerald-500 transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                <Maximize2 className="w-3.5 h-3.5" /> Expand
              </button>
              <button onClick={() => processText("simplify")} disabled={isProcessing} className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-text-primary px-3 py-1.5 rounded-lg bg-cyan-400/20 border border-cyan-400/30 hover:bg-cyan-500 hover:border-cyan-500 transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Minimize2 className="w-3.5 h-3.5" /> Simplify
              </button>
              <button onClick={() => processText("teach")} disabled={isProcessing} className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-text-primary px-3 py-1.5 rounded-lg bg-purple-400/20 border border-purple-400/30 hover:bg-purple-500 hover:border-purple-500 transition-all duration-300 flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <GraduationCap className="w-3.5 h-3.5" /> Teach Me
              </button>
            </div>
          </div>
          
          <div className="relative flex-1 min-h-0 group-hover:bg-bg-secondary transition-colors">
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none p-5 md:p-6 text-text-primary text-sm md:text-base leading-relaxed placeholder:text-text-muted/50 custom-scrollbar"
              placeholder="Start typing your draft here..."
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-bg-tertiary backdrop-blur-sm flex items-center justify-center pointer-events-none transition-all duration-300">
                <div className="bg-bg-primary border border-accent-amber/50 p-4 md:p-5 rounded-2xl flex items-center gap-3 text-accent-amber font-black shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-pulse text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" /> {selectedBook ? "Retrieving Citations & Writing..." : "Twin is thinking..."}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-full md:w-72 flex flex-col space-y-4 pt-0 md:pt-[54px] relative z-10 shrink-0 min-h-0">
        <h3 className="font-bold text-sm flex items-center gap-2 text-text-primary drop-shadow-sm"><Sparkles className="w-4 h-4 text-accent-purple" /> Context Engine</h3>
        
        {/* Dynamic Context Settings */}
        <Card variant="glass" className="p-4 space-y-5 bg-bg-glass backdrop-blur-3xl border border-border-primary shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          
          {/* Memory Integration Toggle */}
          <div 
            onClick={() => setUseMemoryContext(!useMemoryContext)}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center gap-3 ${useMemoryContext ? 'border-accent-purple/50 bg-accent-purple/20 text-accent-purple shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]' : 'border-border-primary bg-bg-card text-text-muted hover:border-border-hover'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${useMemoryContext ? 'bg-accent-purple text-text-primary shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-bg-tertiary text-text-muted'}`}>
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-text-primary">Memory Profile</p>
              <p className="text-[9px] mt-0.5 text-text-muted">Link AI to your weaknesses</p>
            </div>
            <div className="flex-1" />
            <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${useMemoryContext ? 'bg-accent-purple shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'bg-bg-primary border border-border-hover'}`}>
              <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${useMemoryContext ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* RAG Integration Selector */}
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-accent-blue" /> Source Material (RAG)</label>
             <select 
               value={selectedBook}
               onChange={(e) => setSelectedBook(e.target.value)}
               className="w-full bg-bg-card border border-border-primary rounded-lg p-2.5 text-[13px] text-text-primary outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all cursor-pointer font-medium"
             >
               <option value="">No Book Attached</option>
               {availableBooks.map(b => (
                 <option key={b} value={b}>{b}</option>
               ))}
             </select>
             {selectedBook && <p className="text-[10px] text-accent-blue font-bold flex items-center gap-1 mt-1"><Sparkles className="w-3 h-3"/> AI pulls exact facts from this PDF.</p>}
          </div>

        </Card>

        {/* Suggestions */}
        <Card variant="glass" className="flex-1 p-4 overflow-y-auto bg-bg-glass backdrop-blur-3xl border border-border-primary shadow-[0_8px_32px_rgba(0,0,0,0.5)] custom-scrollbar min-h-[150px]">
          <div className="space-y-3">
            
            <div className="p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-sm shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]">
              <strong className="text-accent-amber block mb-1.5 text-[10px] uppercase tracking-widest font-black flex items-center gap-1.5"><Sparkles className="w-3 h-3"/> Next Steps</strong>
              <p className="text-text-secondary leading-snug font-medium text-xs">Let your Twin automatically generate the next paragraph based on context.</p>
              <button onClick={() => processText("continue")} disabled={isProcessing} className="w-full mt-3 px-3 py-2 bg-accent-amber/20 hover:bg-accent-amber text-accent-amber hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center gap-1.5 disabled:opacity-50">
                Continue Writing <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
}
