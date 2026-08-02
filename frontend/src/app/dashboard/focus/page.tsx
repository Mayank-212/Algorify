"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemory } from "@/lib/memory-store";
import { Headphones, Play, Square, TimerReset, Wind, Clock, History, Music } from "lucide-react";

type Mode = "pomodoro" | "stopwatch";
type Sound = "none" | "lofi" | "rain";

export default function ZenModePage() {
  const { recordFocusSession, memory } = useMemory();
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [pomodoroDuration, setPomodoroDuration] = useState(25);
  const [sound, setSound] = useState<Sound>("none");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [breathePhase, setBreathePhase] = useState<"in" | "hold" | "out">("in");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Focus history from memory
  const focusHistory = memory
    .filter(m => m.type === "focus_session")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Audio handling
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (sound !== "none") {
      const src = sound === "lofi" 
        ? "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" // Public domain lofi
        : "https://cdn.pixabay.com/download/audio/2021/08/09/audio_6b5a324024.mp3?filename=heavy-rain-nature-sounds-8186.mp3"; // Public domain rain
      
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;
      
      if (isActive) {
        audio.play().catch(e => console.log("Audio autoplay prevented"));
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sound, isActive]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === "pomodoro") {
            if (prev <= 1) {
              handleSessionComplete(pomodoroDuration);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1; // Stopwatch goes up
          }
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isActive, mode]);

  // Breathing Visualizer logic
  useEffect(() => {
    if (!isActive) return;
    
    const cycle = () => {
      setBreathePhase("in");
      setTimeout(() => {
        setBreathePhase("hold");
        setTimeout(() => {
          setBreathePhase("out");
        }, 2000); // Hold for 2s
      }, 4000); // Breathe in for 4s
    };
    
    cycle();
    const interval = setInterval(cycle, 10000); // Total cycle: 4 + 2 + 4 = 10s
    return () => clearInterval(interval);
  }, [isActive]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "pomodoro" ? pomodoroDuration * 60 : 0);
  };

  const handleSessionComplete = (minutes: number) => {
    setIsActive(false);
    recordFocusSession(minutes, sound);
    
    // Play completion chime
    try {
      const chime = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
      chime.play();
    } catch(e) {}
  };

  const stopStopwatch = () => {
    setIsActive(false);
    const minutes = Math.floor(timeLeft / 60);
    if (minutes > 0) {
      recordFocusSession(minutes, sound);
    }
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative pb-10 min-h-[calc(100vh-6rem)] flex flex-col">
      {/* Ambient glowing background reacting to breathing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 transition-all duration-[4000ms] ease-in-out"
           style={{ opacity: isActive ? (breathePhase === "in" ? 0.8 : breathePhase === "hold" ? 1 : 0.3) : 0.2 }}>
        <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-accent-cyan/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-accent-purple/20 blur-[120px] mix-blend-screen" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-primary pb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 drop-shadow-sm">
            <Wind className="w-8 h-8 text-accent-cyan" /> Zen Mode
          </h1>
          <p className="text-text-muted mt-2 font-medium">Breathe, focus, and melt your frustration away.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Main Focus Area */}
        <Card variant="glass" className="lg:col-span-2 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-bg-glass border-border-primary">
          
          {/* Breathing Visualizer */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
             <motion.div 
               animate={{ 
                 scale: isActive ? (breathePhase === "in" ? 1.5 : breathePhase === "hold" ? 1.5 : 1) : 1,
                 opacity: isActive ? (breathePhase === "hold" ? 0.8 : 0.4) : 0.2
               }}
               transition={{ duration: breathePhase === "hold" ? 2 : 4, ease: "easeInOut" }}
               className="w-64 h-64 rounded-full border-4 border-accent-cyan shadow-[0_0_50px_rgba(6,182,212,0.5)]"
             />
             <motion.div 
               animate={{ 
                 scale: isActive ? (breathePhase === "in" ? 1.2 : breathePhase === "hold" ? 1.2 : 0.8) : 0.8,
               }}
               transition={{ duration: breathePhase === "hold" ? 2 : 4, ease: "easeInOut", delay: 0.2 }}
               className="absolute w-64 h-64 rounded-full border-2 border-accent-purple shadow-[inset_0_0_50px_rgba(168,85,247,0.5)]"
             />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {isActive && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-xl font-bold text-accent-cyan tracking-widest uppercase"
              >
                {breathePhase === "in" ? "Breathe In..." : breathePhase === "hold" ? "Hold..." : "Breathe Out..."}
              </motion.div>
            )}

            <div className="text-[6rem] md:text-[8rem] font-black tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex gap-4 mt-8">
              <Button 
                onClick={toggleTimer}
                size="lg"
                className={`h-16 px-8 rounded-2xl font-black tracking-widest uppercase transition-all duration-300 ${isActive ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-text-primary border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-text-primary border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]'}`}
              >
                {isActive ? <><Square className="w-6 h-6 mr-3" /> Pause</> : <><Play className="w-6 h-6 mr-3" /> {timeLeft === (mode === "pomodoro" ? pomodoroDuration*60 : 0) ? "Start" : "Resume"}</>}
              </Button>
              
              <Button 
                onClick={mode === "pomodoro" ? resetTimer : stopStopwatch}
                variant="outline"
                size="lg"
                className="h-16 px-6 rounded-2xl border-border-hover hover:bg-bg-tertiary"
              >
                {mode === "pomodoro" ? <TimerReset className="w-6 h-6" /> : <Square className="w-6 h-6 text-rose-400" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Controls & History */}
        <div className="space-y-6">
          <Card variant="glass" className="p-6 bg-bg-glass border-border-primary">
            <h3 className="font-bold text-sm tracking-widest uppercase text-text-muted mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Timer Mode
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button 
                onClick={() => { setMode("pomodoro"); setTimeLeft(pomodoroDuration * 60); setIsActive(false); }}
                className={`p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${mode === "pomodoro" ? "bg-accent-purple/20 text-accent-purple border-accent-purple/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]" : "bg-bg-card text-text-muted border-border-primary hover:text-text-primary"}`}
              >
                Pomodoro
              </button>
              <button 
                onClick={() => { setMode("stopwatch"); setTimeLeft(0); setIsActive(false); }}
                className={`p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${mode === "stopwatch" ? "bg-accent-blue/20 text-accent-blue border-accent-blue/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-bg-card text-text-muted border-border-primary hover:text-text-primary"}`}
              >
                Stopwatch
              </button>
            </div>
            
            {mode === "pomodoro" && (
              <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {[15, 25, 45, 60].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => { setPomodoroDuration(dur); setTimeLeft(dur * 60); setIsActive(false); }}
                    className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${pomodoroDuration === dur ? "bg-accent-purple/40 text-text-primary border-accent-purple/50" : "bg-bg-secondary text-text-muted border-border-primary hover:text-text-primary hover:bg-bg-tertiary"}`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            )}

            <h3 className="font-bold text-sm tracking-widest uppercase text-text-muted mt-6 mb-4 flex items-center gap-2">
              <Music className="w-4 h-4" /> Refreshing Sounds
            </h3>
            <div className="flex flex-col gap-2">
              {(["none", "lofi", "rain"] as const).map(s => (
                <button 
                  key={s}
                  onClick={() => setSound(s)}
                  className={`p-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border flex items-center justify-between ${sound === s ? "bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "bg-bg-card text-text-muted border-border-primary hover:text-text-primary"}`}
                >
                  {s === "none" ? "Silent Focus" : s === "lofi" ? "Lo-Fi Chill Beats" : "Heavy Rain & Nature"}
                  {sound === s && <Headphones className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="p-6 bg-bg-glass border-border-primary flex-1">
            <h3 className="font-bold text-sm tracking-widest uppercase text-text-muted mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Session History
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {focusHistory.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-8">No zen sessions completed yet. Take a deep breath and start focusing!</p>
              ) : (
                focusHistory.map(session => (
                  <div key={session.id} className="p-3 rounded-xl bg-bg-tertiary border border-border-primary text-sm">
                    <p className="font-medium">{session.content}</p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">
                      {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
