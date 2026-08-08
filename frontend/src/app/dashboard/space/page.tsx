"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Library, Upload, BookOpen, Search, Loader2, Bot, Trash2, CheckCircle2, MonitorPlay, Download, Sparkles, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function LearningSpacePage() {
  const [books, setBooks] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [answer, setAnswer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"rag" | "youtube">("rag");
  const [ytUrl, setYtUrl] = useState("");
  const [loadingYt, setLoadingYt] = useState(false);
  const [ytNotes, setYtNotes] = useState("");

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/books`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books);
      }
    } catch (e) {
      console.log("Python engine offline. Run: python main.py");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/books/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchBooks();
      } else {
        alert("Upload failed. Make sure Python Engine is running on port 8001.");
      }
    } catch (err) {
      alert("Python Engine is not reachable. Start it using: cd python-engine && python main.py");
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!query || !selectedBook) return;
    setLoadingQuery(true);
    setAnswer("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/books/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedBook, query }),
      });
      const data = await res.json();
      setAnswer(data.answer || "No relevant info found.");
    } catch (err) {
      setAnswer("Failed to query the book. Is the Python RAG engine running?");
    } finally {
      setLoadingQuery(false);
    }
  };

  const handleGenerateYt = async () => {
    if (!ytUrl) return;
    setLoadingYt(true);
    setYtNotes("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/youtube/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to generate notes");
      setYtNotes(data.notes || "No notes generated.");
    } catch (err: any) {
      setYtNotes(`Error: ${err.message}`);
    } finally {
      setLoadingYt(false);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById("youtube-notes-container");
    if (!element) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin: 0.5,
        filename: 'Algorify_YouTube_Notes.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save();
    } catch (e) {
      console.error("PDF export failed:", e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Library className="w-6 h-6 text-accent-emerald" /> Learning Space</h1>
          <p className="text-text-muted mt-1">Ingest complex knowledge and turn it into actionable learning materials.</p>
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-border-primary pb-px">
        <button 
          onClick={() => setActiveTab("rag")}
          className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${activeTab === "rag" ? "text-accent-emerald border-accent-emerald" : "text-text-muted border-transparent hover:text-text-primary"}`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" /> Book RAG
        </button>
        <button 
          onClick={() => setActiveTab("youtube")}
          className={`px-4 py-2 font-medium text-sm transition-all border-b-2 ${activeTab === "youtube" ? "text-red-500 border-red-500" : "text-text-muted border-transparent hover:text-text-primary"}`}
        >
          <MonitorPlay className="w-4 h-4 inline mr-2" /> YouTube Notes
        </button>
      </div>

      {activeTab === "rag" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <Card variant="glass" className="p-8 border-dashed border-2 border-border-hover flex flex-col items-center justify-center text-center relative overflow-hidden group bg-bg-glass backdrop- shadow-none">
        <div className="absolute inset-0 bg-accent-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-16 h-16 rounded-full bg-accent-emerald/20 flex items-center justify-center mb-4 border border-accent-emerald/30 shadow-none group-hover:scale-110 transition-transform">
          <Upload className={`w-8 h-8 text-accent-emerald ${uploading ? "animate-bounce" : ""}`} />
        </div>
        <h3 className="font-bold text-xl mb-2 text-text-primary drop-shadow-none">Upload a Textbook or Notes</h3>
        <p className="text-sm text-text-muted mb-6">Supported formats: PDF (Processed by Python PyPDF)</p>
        <input 
          type="file" 
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleUpload} 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/50 px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-accent-emerald hover:text-text-primary transition-all duration-300 shadow-none hover:shadow-none disabled:opacity-50 flex items-center gap-2 relative z-10"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
          {uploading ? "Uploading & Parsing..." : "Browse PDF"}
        </button>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Left: Library */}
        <div className="flex flex-col h-[350px] md:h-[600px] space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 shrink-0 text-text-primary drop-shadow-none">
            <Library className="w-5 h-5 text-accent-emerald" /> Your ML-Indexed Library
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {books.length === 0 ? (
              <div className="p-8 text-center text-text-muted border border-border-primary rounded-2xl bg-bg-glass backdrop- shadow-none">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p>No books indexed yet.</p>
                <p className="text-xs mt-1">Upload a PDF above to get started.</p>
              </div>
            ) : (
              books.map((book) => (
                <Card 
                  key={book} 
                  variant="glass" 
                  onClick={() => setSelectedBook(book)}
                  className={`p-4 transition-all duration-300 cursor-pointer flex gap-4 border-2 relative overflow-hidden group ${
                    selectedBook === book 
                      ? "bg-accent-emerald/10 border-accent-emerald shadow-none scale-[1.02]" 
                      : "border-border-primary bg-bg-glass hover:bg-bg-tertiary hover:border-accent-emerald/30 hover:shadow-none hover:scale-[1.01]"
                  }`}
                >
                  {selectedBook === book && <div className="absolute inset-0 bg-gradient-to-r from-accent-emerald/10 to-transparent pointer-events-none" />}
                  <div className={`w-16 h-20 rounded-xl flex items-center justify-center shrink-0 border relative z-10 transition-colors ${selectedBook === book ? "bg-accent-emerald/20 border-accent-emerald/50" : "bg-bg-card border-border-primary group-hover:border-accent-emerald/30"}`}>
                    <BookOpen className={`w-6 h-6 ${selectedBook === book ? "text-accent-emerald drop-shadow-none" : "text-text-muted group-hover:text-accent-emerald/70"}`} />
                  </div>
                  <div className="flex flex-col justify-center relative z-10 flex-1 min-w-0">
                    <h4 className={`font-bold truncate ${selectedBook === book ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"}`}>{book}</h4>
                    <p className="text-[11px] text-text-muted mt-1 uppercase tracking-wider">Indexed via PyPDF</p>
                    <div className="text-[11px] font-bold text-emerald-400/80 flex items-center gap-1 mt-2 bg-emerald-500/10 w-max px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Query
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right: RAG Query */}
        <div className="flex flex-col h-[400px] md:h-[600px] space-y-4 mt-6 md:mt-0">
          <h3 className="font-bold text-lg flex items-center gap-2 shrink-0 text-text-primary drop-shadow-none">
            <Bot className="w-5 h-5 text-accent-blue" /> Ask Your Learning Twin
          </h3>
          <Card variant="glass" className="p-4 flex flex-col flex-1 bg-bg-glass backdrop- border-border-primary shadow-none">
            {!selectedBook ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted text-sm text-center">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                Select a book from your library<br/>to ask specific questions.
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="mb-4 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 shadow-none">
                    <Target className="w-3 h-3" /> Target: {selectedBook}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto mb-4 border border-border-primary rounded-2xl p-4 sm:p-6 bg-bg-card text-sm custom-scrollbar shadow-none">
                  {answer ? (
                    <div className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                      <div className="w-8 h-8 rounded-lg bg-accent-emerald/20 border border-accent-emerald/50 flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-accent-emerald drop-shadow-none" />
                      </div>
                      <div className="prose-chat prose-sm text-text-primary overflow-hidden w-full max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : loadingQuery ? (
                     <div className="flex flex-col gap-3 items-center text-text-muted justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-accent-emerald" /> 
                        <span className="font-medium animate-pulse">Algorify is retrieving facts...</span>
                     </div>
                  ) : (
                    <div className="text-text-muted flex flex-col items-center justify-center h-full text-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>Type a question below.</p>
                      <p className="text-xs">The Python engine will search the PDF and return an answer using Mistral RAG.</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                      placeholder="e.g. What does chapter 2 say about matrices?"
                      className="w-full bg-bg-card border border-border-primary rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-accent-emerald focus:ring-1 focus:ring-accent-emerald transition-all"
                    />
                  </div>
                  <button onClick={handleQuery} disabled={loadingQuery || !query} className="bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-accent-emerald hover:text-text-primary transition-all shadow-none hover:shadow-none disabled:opacity-50 shrink-0">
                    Ask
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      </div>
      )}

      {activeTab === "youtube" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card variant="glass" className="p-6 md:p-8 bg-bg-glass backdrop- border border-border-primary shadow-none relative overflow-hidden">
            <div className="absolute -top-[50%] -right-[10%] w-64 h-64 bg-red-500/20 rounded-full   pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/50 shadow-none shrink-0">
                <MonitorPlay className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-text-primary drop-shadow-none">Generate Notes from Video</h3>
                <p className="text-sm text-text-muted mt-1">Paste a YouTube URL. Algorify will extract the closed captions and use Mistral to generate highly-structured, aesthetic Markdown notes instantly.</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <div className="relative flex-1">
                <MonitorPlay className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-red-500/50" />
                <input 
                  type="text" 
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateYt()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-bg-card border border-border-primary rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
                />
              </div>
              <button 
                onClick={handleGenerateYt} 
                disabled={loadingYt || !ytUrl} 
                className="bg-red-500/20 text-red-500 border border-red-500/50 px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest hover:bg-red-500 hover:text-text-primary transition-all shadow-none hover:shadow-none flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                {loadingYt ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loadingYt ? "Processing..." : "Generate Notes"}
              </button>
            </div>
          </Card>

          {ytNotes && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 bg-bg-glass border border-border-primary hover:border-emerald-500/50 hover:bg-emerald-500/10 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all text-text-primary hover:text-emerald-400 shadow-none"
                >
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
              <Card variant="glass" className="p-1 md:p-2 bg-bg-glass backdrop- border border-border-primary shadow-none">
                <div id="youtube-notes-container" className="prose prose-invert prose-emerald prose-headings:font-black prose-headings:tracking-tight prose-h1:text-emerald-400 prose-h2:text-text-primary prose-h3:text-text-primary prose-a:text-emerald-400 prose-li:marker:text-emerald-500 max-w-none text-text-primary bg-bg-card p-6 md:p-10 rounded-[1.25rem] border border-border-primary">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {ytNotes}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
