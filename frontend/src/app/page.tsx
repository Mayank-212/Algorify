"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  BrainCircuit, ArrowRight, Sparkles, ShieldCheck, Zap, BookOpen, Target, Crosshair, 
  Cpu, Waves, Activity, CheckCircle2, Heart, Trophy, PenTool, Calendar, MessageSquare, Flame 
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── HELPER FOR SCROLL REVEALS ───
function FadeIn({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode, delay?: number, className?: string, direction?: "up" | "left" | "right" | "none" }) {
  const initial = {
    opacity: 0,
    y: direction === "up" ? 40 : 0,
    x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
    scale: direction === "none" ? 0.9 : 1
  };
  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    id: "memory",
    title: "1. A Brain That Cares",
    icon: BrainCircuit,
    color: "text-accent-blue",
    bg: "bg-accent-blue/10",
    border: "border-accent-blue/30",
    description: "You shouldn't have to remind your tutor what you struggled with yesterday. Our Memory Engine silently learns you over time, noticing your silent struggles and celebrating your hard-earned mastery.",
    detailUi: (
      <div className="h-full w-full flex flex-col justify-center space-y-6">
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
           <span className="text-white font-bold">Accuracy</span>
           <span className="text-accent-blue font-black text-2xl">84.2%</span>
        </div>
        <div>
           <div className="flex justify-between text-xs font-bold mb-2"><span className="text-rose-400">Silent Struggle</span><span className="text-white">Calculus</span></div>
           <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:"30%"}} transition={{duration:1}} className="h-full bg-rose-500" /></div>
        </div>
        <div>
           <div className="flex justify-between text-xs font-bold mb-2"><span className="text-emerald-400">Hard-Earned Mastery</span><span className="text-white">React.js</span></div>
           <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:"96%"}} transition={{duration:1, delay:0.2}} className="h-full bg-emerald-500" /></div>
        </div>
      </div>
    )
  },
  {
    id: "tutor",
    title: "2. The Tutor Who Won't Give Up",
    icon: MessageSquare,
    color: "text-accent-purple",
    bg: "bg-accent-purple/10",
    border: "border-accent-purple/30",
    description: "Sometimes, giving you the answer is the worst thing an AI can do. Your twin acts as an empathetic guide, patiently walking you through the logic until you experience that incredible 'aha!' moment for yourself.",
    detailUi: (
      <div className="h-full w-full flex flex-col gap-4 justify-center">
        <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="self-end bg-accent-purple/20 border border-accent-purple/30 text-white p-3 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
          I just can't figure out this derivative...
        </motion.div>
        <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.5}} className="self-start bg-white/10 border border-white/10 text-text-muted p-3 rounded-2xl rounded-tl-sm text-sm max-w-[90%]">
          I know it's frustrating, but you're so close! Let's take a deep breath. What happens to the exponent when you apply the power rule? Take your time.
        </motion.div>
      </div>
    )
  },
  {
    id: "arena",
    title: "3. Frustration Into Fun",
    icon: Crosshair,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    description: "We know tests cause anxiety. So we turned your weakest subjects into low-stakes, highly engaging gamified 'Boss Fights'. Fail in the arena as many times as you need, so you can win on the real exam.",
    detailUi: (
      <div className="h-full w-full flex flex-col items-center justify-center text-center">
        <h4 className="text-2xl font-black uppercase tracking-widest text-amber-500 mb-2">Concept Boss</h4>
        <p className="text-white font-bold mb-6 text-lg">Thermodynamics</p>
        <div className="flex items-center justify-center gap-4 w-full mb-8">
          <div className="w-1/3 h-3 bg-white/10 rounded-full overflow-hidden relative">
             <div className="absolute top-0 right-0 h-full w-[60%] bg-emerald-500" />
          </div>
          <span className="font-black text-xl text-white">VS</span>
          <div className="w-1/3 h-3 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full w-[80%] bg-rose-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full text-[10px] font-black uppercase tracking-widest">
          <div className="bg-amber-500/20 py-3 rounded-xl border border-amber-500/50 text-amber-400">B. Enthalpy</div>
          <div className="bg-white/5 py-3 rounded-xl border border-white/5 text-text-muted">C. Kinetic Energy</div>
        </div>
      </div>
    )
  },
  {
    id: "rag",
    title: "4. A Safe Space to Learn",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    description: "The internet is loud and full of misinformation. When you upload your textbooks, Algorify puts up a wall. It will only ever teach you using the safe, verified materials provided by your own university.",
    detailUi: (
      <div className="h-full w-full flex flex-col justify-center gap-6">
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-12 h-12 bg-rose-500/20 text-rose-400 flex items-center justify-center rounded-xl font-black text-sm">PDF</div>
          <div>
            <p className="font-bold text-white">My_Professors_Notes.pdf</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">Safely Indexed • 482 Pages</p>
          </div>
        </div>
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <p className="text-xs text-emerald-400 font-medium leading-relaxed">
            <strong className="block mb-1 font-black uppercase tracking-widest">Safe Context Lock</strong>
            I am only reading from your professor's notes. You don't have to worry about me giving you the wrong formula.
          </p>
        </div>
      </div>
    )
  },
  {
    id: "writer",
    title: "5. Never Start Blank",
    icon: PenTool,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    description: "Writer's block is paralyzing. The Co-Writer sits right beside you, gently suggesting the next sentence based on the books you've already read, helping you find your voice without doing the work for you.",
    detailUi: (
      <div className="h-full w-full bg-[#111] rounded-2xl border border-white/10 p-6 flex flex-col">
        <p className="text-white text-sm font-medium leading-relaxed">
          The implications of machine learning in healthcare are vast. 
          <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{repeat:Infinity, duration:1.5, repeatType:"reverse"}} className="text-rose-400"> For instance, neural networks can now predict...</motion.span>
        </p>
        <div className="mt-auto flex items-center gap-2 text-[10px] uppercase font-bold text-text-muted">
          <div className="px-2 py-1 bg-white/10 rounded">Tab to Accept Suggestion</div>
        </div>
      </div>
    )
  },
  {
    id: "planner",
    title: "6. Handling The Overwhelm",
    icon: Calendar,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    description: "When the assignments pile up, it's easy to freeze. Algorify acts as your gentle assistant, organizing the chaos into priority lists and giving you a hit of dopamine (XP) every time you check something off.",
    detailUi: (
      <div className="h-full w-full flex flex-col justify-center gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
           <div className="w-5 h-5 rounded border border-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-emerald-500" /></div>
           <div className="flex-1"><p className="text-white text-sm line-through text-white/50">Read Chapter 4</p></div>
           <span className="text-emerald-400 font-bold text-xs">+50 XP</span>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex items-center gap-4">
           <div className="w-5 h-5 rounded border border-white/30" />
           <div className="flex-1"><p className="text-orange-400 text-sm font-bold">Finish CS Assignment</p></div>
           <span className="text-text-muted font-bold text-[10px] uppercase">One step at a time</span>
        </div>
      </div>
    )
  },
  {
    id: "zen",
    title: "7. Take A Deep Breath",
    icon: Waves,
    color: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    border: "border-accent-cyan/30",
    description: "Burnout is real, and your mental health matters more than your grades. When you feel overwhelmed, enter Zen Mode. Let the Lo-Fi beats wash over you and sync your heart rate to the breathing visualizer.",
    detailUi: (
      <div className="h-full w-full flex items-center justify-center relative">
        <motion.div animate={{scale:[1, 1.2, 1]}} transition={{duration:4, repeat:Infinity, ease:"easeInOut"}} className="w-32 h-32 rounded-full border-2 border-accent-cyan/50 flex items-center justify-center bg-accent-cyan/10">
          <div className="text-center">
            <p className="text-accent-cyan font-bold tracking-widest uppercase text-[10px] mb-1">Breathe In</p>
            <p className="text-2xl font-black text-white tabular-nums">25:00</p>
          </div>
        </motion.div>
      </div>
    )
  },
  {
    id: "leaderboard",
    title: "8. You Are Not Alone",
    icon: Trophy,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
    description: "When you study in your room, it feels isolating. The Global Leaderboard connects you to a network of other students grinding just as hard as you are. Together, we motivate each other to keep pushing.",
    detailUi: (
      <div className="h-full w-full flex flex-col justify-center gap-3">
        {[1,2,3].map(i => (
          <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${i===1 ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-white/5 border-white/10'}`}>
            <span className={`font-black w-6 text-center ${i===1 ? 'text-yellow-400' : 'text-text-muted'}`}>#{i}</span>
            <div className="w-8 h-8 rounded-full bg-white/20" />
            <div className="flex-1">
              <p className={`text-sm font-bold ${i===1 ? 'text-white' : 'text-text-muted'}`}>Fellow Student {i}</p>
            </div>
            <span className="text-xs font-bold text-text-muted">{10000 - (i*1000)} XP</span>
          </div>
        ))}
      </div>
    )
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Parallax setup
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);

  useEffect(() => {
    supabase.auth.getSession().then(() => setChecking(false));
  }, []);

  const handleStart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) router.push("/dashboard");
    else router.push("/auth");
  };

  if (checking) return null;

  return (
    <div className="min-h-screen bg-[#020202] text-text-primary overflow-x-hidden selection:bg-accent-purple/30 font-sans">
      
      {/* ─── DEEP PARALLAX BACKGROUND ─── */}
      <motion.div style={{ y: yBg }} className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-20%] w-[80vw] h-[80vw] rounded-full bg-accent-blue/10   animate-pulse duration-10000" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-accent-purple/10  " />
        <div className="absolute top-[50%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-accent-rose/5  " />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </motion.div>

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#020202]/30 backdrop- border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Algorify Logo" className="w-8 h-8 rounded-lg shadow-none" />
          <span className="font-black text-lg tracking-tight text-white uppercase">Algorify</span>
        </div>
        <Button onClick={handleStart} variant="outline" className="rounded-full border-white/10 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-none hover:shadow-none backdrop-">
          Sign In
        </Button>
      </nav>

      <main className="relative z-10">
        
        {/* ─── HERO SECTION ─── */}
        <section className="flex flex-col items-center justify-center min-h-[95vh] px-4 text-center max-w-6xl mx-auto pt-20">
          <FadeIn direction="up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-[10px] sm:text-xs font-black uppercase tracking-widest text-accent-purple mb-8 shadow-none">
              <Heart className="w-4 h-4" /> Built with empathy for the modern student
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/10 leading-[1.05] mb-8">
              Studying shouldn't <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-blue via-accent-purple to-accent-rose animate-text">
                feel this lonely.
              </span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <p className="text-lg md:text-2xl text-text-muted max-w-3xl mx-auto font-medium leading-relaxed mb-12">
              You are smart, but the traditional education system is broken. Memorization doesn't work, and generic AI chatbots just spoon-feed you answers. It's time to meet an AI twin that actually cares about your mental health and true understanding.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.3}>
            <Button onClick={handleStart} size="lg" className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-sm bg-white text-black hover:bg-gray-200 hover:scale-[1.03] shadow-none hover:shadow-none transition-all duration-300">
              Find Your Study Twin <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </FadeIn>
        </section>

        {/* ─── MASSIVE INTERACTIVE FEATURE SHOWCASE ─── */}
        <section className="py-24 px-4 max-w-[1400px] mx-auto min-h-screen flex flex-col justify-center">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">How we protect your mind.</h2>
              <p className="text-xl text-text-muted max-w-2xl mx-auto font-medium">Click on any pillar below to see how Algorify replaces overwhelming software stacks with one deeply empathetic learning twin.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Side: Interactive Feature List */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 h-[600px] overflow-y-auto pr-4 custom-scrollbar">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === index;
                
                return (
                  <motion.div 
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    whileHover={{ scale: 1.02 }}
                    className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border backdrop- flex flex-col items-start text-left h-48 ${
                      isActive 
                        ? `bg-[#111] ${feature.border} shadow-none` 
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isActive ? feature.bg + ' ' + feature.color : 'bg-white/10 text-white'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className={`font-bold text-lg mb-1 ${isActive ? 'text-white' : 'text-text-secondary'}`}>{feature.title}</h3>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Side: Dynamic Presentation Panel */}
            <div className="lg:col-span-7 h-[600px] relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 bg-[#0a0a0a]/80 backdrop- border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-none"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${features[activeFeature].bg}`} />
                  
                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${features[activeFeature].bg} ${features[activeFeature].color}`}>
                        {(() => { const Icon = features[activeFeature].icon; return <Icon className="w-8 h-8" /> })()}
                      </div>
                      <h2 className="text-4xl font-black text-white">{features[activeFeature].title.substring(3)}</h2>
                    </div>
                    
                    <p className="text-lg text-text-muted leading-relaxed font-medium mb-10">
                      {features[activeFeature].description}
                    </p>

                    <div className="flex-1 bg-black/50 border border-white/5 rounded-3xl p-8 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                      {features[activeFeature].detailUi}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="py-40 px-4 text-center relative z-20">
          <FadeIn>
            <div className="max-w-5xl mx-auto bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-[3rem] p-16 md:p-24 backdrop- relative overflow-hidden shadow-none group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-1 bg-gradient-to-r from-transparent via-accent-purple to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
              
              <h2 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-8 leading-tight">The ultimate <br/>learning ecosystem.</h2>
              <p className="text-text-muted text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-medium">8 integrated tools. 1 centralized memory engine. Experience the future of adaptive, AI-driven education today.</p>
              
              <Button onClick={handleStart} size="lg" className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-sm bg-white text-black hover:bg-gray-200 hover:scale-[1.05] shadow-none hover:shadow-none transition-all duration-300">
                Enter Algorify
              </Button>
            </div>
          </FadeIn>
        </section>

      </main>
    </div>
  );
}
