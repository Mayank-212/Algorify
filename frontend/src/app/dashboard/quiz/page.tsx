"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, ProgressBar } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useMemory } from "@/lib/memory-store";
import {
  Brain, CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Sparkles, Target, Zap, Trophy, Heart, Shield, Flame, Star, Timer, Swords, Crown,
  Skull, Snowflake, SplitSquareHorizontal, Play, User
} from "lucide-react";
import type { QuizQuestion } from "@/types";

type Phase = "lobby" | "battle" | "result";

export default function PlayArenaPage() {
  const { addXP, recordMistake, recordMastery, recordQuizResults, profile } = useMemory();
  const [phase, setPhase] = useState<Phase>("lobby");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [topic, setTopic] = useState(profile.weaknesses.length > 0 ? profile.weaknesses[0] : "General Knowledge");
  const [count, setCount] = useState(5);
  const [sourceType, setSourceType] = useState<"general" | "book">("general");
  const [bookId, setBookId] = useState("");
  const [availableBooks, setAvailableBooks] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://127.0.0.1:8001'}/api/books`).then(r => r.json()).then(d => setAvailableBooks(d.books || [])).catch(() => {});
  }, []);

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [generating, setGenerating] = useState(false);

  // Deep RPG Game State
  const [playerHp, setPlayerHp] = useState(100);
  const [bossHp, setBossHp] = useState(100);
  const maxHp = 100;
  
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timer, setTimer] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);

  // Powerups & Effects
  const [powerups, setPowerups] = useState({ fiftyFifty: 1, freeze: 1, shield: 1 });
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [frozen, setFrozen] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  
  const [screenShake, setScreenShake] = useState(false);
  const [bossHit, setBossHit] = useState(false);

  const [report, setReport] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);

  // Global game loop (timer)
  useEffect(() => {
    if (!timerActive || timer <= 0 || frozen) return;
    const t = setInterval(() => setTimer((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timerActive, timer, frozen]);

  // Timeout triggers damage
  useEffect(() => {
    if (timer <= 0 && timerActive && !showFeedback) {
      handleAnswer(null);
    }
  }, [timer]);

  // Anti-cheat: tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && phase === "battle" && !showFeedback && playerHp > 0) {
        setPlayerHp(0);
        setReport("");
        setPhase("result");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase, showFeedback, playerHp]);

  const startQuiz = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic: sourceType === "book" ? "the core concepts covered in the provided textbook" : topic, 
          difficulty, 
          count, 
          bookId: sourceType === "book" ? bookId : undefined,
          profile
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuizQuestions(data.questions);
      setPhase("battle");
      setCurrentQ(0);
      setSelected(null);
      setAnswers([]);
      
      // Reset RPG Stats
      setPlayerHp(100);
      setBossHp(100);
      setPowerups({ 
        fiftyFifty: difficulty === "easy" ? 2 : 1, 
        freeze: difficulty === "easy" ? 2 : 1, 
        shield: difficulty === "easy" ? 2 : 1 
      });
      
      setXp(0);
      setStreak(0);
      setCombo(1);
      setTimer(30);
      setTimerActive(true);
      setReport("");
    } catch (err) {
      console.error(err);
      alert("Failed to generate arena battle. Check API limits.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePowerup = (type: "fiftyFifty" | "freeze" | "shield") => {
    if (powerups[type] <= 0 || showFeedback) return;
    setPowerups((p) => ({ ...p, [type]: p[type] - 1 }));

    if (type === "freeze") setFrozen(true);
    if (type === "shield") setShieldActive(true);
    if (type === "fiftyFifty") {
      const q = quizQuestions[currentQ];
      const wrongIndexes = q.options
        .map((_, i) => i)
        .filter((i) => i !== q.correctAnswer);
      // Randomly shuffle and take 2 to eliminate
      const toEliminate = wrongIndexes.sort(() => 0.5 - Math.random()).slice(0, 2);
      setEliminatedOptions(toEliminate);
    }
  };

  const handleAnswer = useCallback((idx: number | null) => {
    if (showFeedback) return;
    const q = quizQuestions[currentQ];
    const correct = idx === q.correctAnswer;
    const timeBonus = Math.max(0, timer * 2);
    
    // Damage Calc
    const damagePerQuestion = 100 / quizQuestions.length;

    setLastCorrect(correct);
    setShowFeedback(true);
    setTimerActive(false);
    setFrozen(false);
    setAnswers((p) => [...p, idx]);

    if (correct) {
      // Player attacks Boss
      setBossHit(true);
      setTimeout(() => setBossHit(false), 500);
      setBossHp((p) => Math.max(0, p - damagePerQuestion));
      
      const points = 100 * combo + timeBonus;
      setXp((p) => p + points);
      addXP(points);
      
      setStreak((p) => p + 1);
      setCombo((p) => Math.min(p + 1, 4));
    } else {
      // Boss attacks Player
      if (shieldActive) {
        setShieldActive(false); // Absorb
      } else {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 400);
        setPlayerHp((p) => Math.max(0, p - 34)); // 3 strikes you're out
      }
      
      if (idx !== null) {
        recordMistake(q.topic, q.question, q.misconception || "Unknown");
      }
      
      setStreak(0);
      setCombo(1);
    }
  }, [showFeedback, currentQ, quizQuestions, timer, combo, shieldActive, addXP, recordMistake]);

  const nextRound = () => {
    if (playerHp <= 0 || bossHp <= 0) { 
      setPhase("result"); 
      const score = answers.filter((a, i) => a === quizQuestions[i]?.correctAnswer).length;
      recordQuizResults(quizQuestions.length, score);
      if (bossHp <= 0) recordMastery(quizQuestions[0]?.topic);
      return; 
    }
    
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ((p) => p + 1);
      setSelected(null);
      setShowFeedback(false);
      setEliminatedOptions([]);
      setTimer(30);
      setTimerActive(true);
    } else {
      setPhase("result");
      const score = answers.filter((a, i) => a === quizQuestions[i]?.correctAnswer).length;
      recordQuizResults(quizQuestions.length, score);
      if (playerHp > 0) recordMastery(quizQuestions[0]?.topic);
    }
  };

  const generateReport = async () => { /* identical streaming logic */
    setGeneratingReport(true);
    try {
      const history = quizQuestions.map((q, idx) => ({
        question: q.question, difficulty: q.difficulty,
        correctAnswer: q.options[q.correctAnswer],
        userAnswer: answers[idx] != null ? q.options[answers[idx]!] : "Timed Out",
        wasCorrect: answers[idx] === q.correctAnswer,
        misconception: q.misconception,
      }));
      const res = await fetch("/api/report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history, profile }),
      });
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let done = false;
      let text = "";
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) { text += decoder.decode(value, { stream: true }); setReport(text); }
      }
    } catch { setReport("Failed"); } finally { setGeneratingReport(false); }
  };

  // ─── LOBBY PHASE ───
  if (phase === "lobby") {
    return (
      <div className="max-w-4xl mx-auto min-h-[calc(100vh-6rem)] lg:min-h-[calc(100vh-7rem)] py-6 flex flex-col justify-center items-center relative">

        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-2xl text-center space-y-5 relative z-10 px-4">
          
          <div className="relative inline-block mb-1">
            <div className="absolute inset-0 bg-accent-amber  opacity-30 animate-pulse" />
            <Crown className="w-10 h-10 md:w-12 md:h-12 mx-auto text-amber-400 drop-shadow-none relative z-10" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent uppercase tracking-tighter drop-shadow-none">
            Play Arena
          </h1>
          <p className="text-xs md:text-sm text-text-secondary max-w-md mx-auto font-medium">
            Face off against the AI Concept Boss. Equip your power-ups, maintain your streak, and conquer your weaknesses.
          </p>

          <Card variant="glass" className="p-1 bg-bg-glass backdrop- border border-border-primary text-left shadow-none shadow-none rounded-3xl mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-3">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`py-3 px-4 rounded-xl font-black uppercase tracking-widest transition-all duration-300 border-2 relative overflow-hidden group ${
                    difficulty === d
                      ? d === "easy" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-none sm:scale-105"
                        : d === "medium" ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-none sm:scale-105"
                        : "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-none sm:scale-105"
                      : "bg-bg-tertiary text-text-muted border-border-primary hover:bg-bg-tertiary hover:text-text-primary hover:border-border-hover"
                  }`}>
                  <div className="relative z-10 text-center">{d}</div>
                  {difficulty === d && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-50" />}
                </button>
              ))}
            </div>

            <div className="px-4 sm:px-8 py-3 sm:py-4 space-y-3 sm:space-y-4 text-left border-y border-border-primary bg-white/[0.02]">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2"><Brain className="w-4 h-4"/> Source Material</label>
                <div className="flex flex-col sm:flex-row gap-2 mb-3 bg-bg-card p-1 rounded-xl">
                  <button onClick={() => setSourceType("general")} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${sourceType === "general" ? "bg-accent-blue/20 text-accent-blue shadow-none" : "text-text-muted hover:text-text-primary"}`}>Algorify General Knowledge</button>
                  <button onClick={() => setSourceType("book")} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-300 ${sourceType === "book" ? "bg-accent-purple/20 text-accent-purple shadow-none" : "text-text-muted hover:text-text-primary"}`}>Learning Space Book</button>
                </div>
                {sourceType === "book" ? (
                  <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="w-full bg-bg-card border border-border-primary rounded-xl p-3 text-sm text-text-primary outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all cursor-pointer">
                    <option value="">Select a book...</option>
                    {availableBooks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full bg-bg-card border border-border-primary rounded-xl p-3 text-sm text-text-primary outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all cursor-pointer font-medium truncate">
                    <optgroup label="Your Weaknesses">
                      {profile.weaknesses.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    <optgroup label="Your Strengths">
                      {profile.strengths.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    <optgroup label="General Knowledge">
                      <option value="Random Mix">Random Mix</option>
                      <option value="General Science">General Science</option>
                      <option value="Computer History">Computer History</option>
                      <option value="Space Exploration">Space Exploration</option>
                      <option value="World Geography">World Geography</option>
                    </optgroup>
                  </select>
                )}
              </div>
              
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex justify-between items-center">
                  <span className="flex items-center gap-2"><Target className="w-4 h-4"/> Question Count</span>
                  <span className="text-accent-amber font-black text-base bg-accent-amber/10 px-2 py-0.5 rounded-md border border-accent-amber/20">{count}</span>
                </label>
                <input type="range" min="3" max="20" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="w-full accent-amber-500 h-2 bg-bg-card rounded-lg appearance-none cursor-pointer border border-border-primary" />
              </div>
            </div>
            
            <div className="px-4 sm:px-8 pb-5 pt-4 space-y-5">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider">
                <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20"><Shield className="w-3.5 h-3.5" /> {difficulty === 'easy' ? 2 : 1} Shield</span>
                <span className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20"><Snowflake className="w-3.5 h-3.5" /> {difficulty === 'easy' ? 2 : 1} Freeze</span>
                <span className="flex items-center gap-1.5 bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-500/20"><SplitSquareHorizontal className="w-3.5 h-3.5" /> {difficulty === 'easy' ? 2 : 1} 50/50</span>
              </div>
              <Button onClick={startQuiz} disabled={sourceType === "book" && !bookId} size="lg" className="w-full text-xs sm:text-sm h-10 sm:h-12 rounded-xl font-black tracking-widest uppercase bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:via-rose-400 hover:to-purple-500 shadow-none hover:shadow-none hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none relative overflow-hidden group" isLoading={generating}>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center"><Swords className="w-4 h-4 mr-2" /> Enter Arena</span>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── RESULT PHASE ───
  if (phase === "result") {
    const isVictory = playerHp > 0 && bossHp <= 0;
    const score = answers.filter((a, i) => a === quizQuestions[i]?.correctAnswer).length;
    
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6 pt-8">
        <Card variant="glass" className="overflow-hidden border-2 relative">
          <div className={`absolute inset-0 opacity-20 ${isVictory ? "bg-emerald-500" : "bg-rose-500"}`} />
          <div className="relative p-6 sm:p-8 text-center">
            {isVictory ? (
              <Trophy className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-amber-400 drop-shadow-none mb-4" />
            ) : (
              <Skull className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-rose-500 drop-shadow-none mb-4" />
            )}
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-2">
              {isVictory ? "Concept Defeated!" : "You Died"}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary">
              Final Score: <span className="font-bold text-text-primary">{score} / {quizQuestions.length}</span>
            </p>
            
            <div className="flex justify-center gap-6 mt-6">
              <div className="bg-bg-tertiary/50 p-4 rounded-xl min-w-[100px] backdrop-">
                <p className="text-2xl font-black text-amber-400">+{xp}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted mt-1">XP Earned</p>
              </div>
              <div className="bg-bg-tertiary/50 p-4 rounded-xl min-w-[100px] backdrop-">
                <p className="text-2xl font-black text-rose-400">{Math.round(100 - playerHp)}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted mt-1">Dmg Taken</p>
              </div>
            </div>
          </div>
        </Card>

        {report ? (
          <div className="mt-8 mb-6 border border-border-primary rounded-2xl bg-bg-glass backdrop- overflow-hidden shadow-none shadow-none">
            <div className="px-5 py-3 border-b border-border-primary bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-accent-purple" />
              <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Debrief Report</h2>
            </div>
            <div className="p-5 sm:p-6 prose-sm prose-invert prose-emerald prose-headings:font-black prose-headings:tracking-tight prose-a:text-accent-blue max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{report}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <Button onClick={generateReport} disabled={generatingReport} className="w-full h-12 text-sm font-bold uppercase tracking-widest" size="lg">
            {generatingReport ? <>Analyzing Brainwaves... <ArrowRight className="w-4 h-4 ml-2 animate-spin" /></> : <>Generate Full Debrief Report <Sparkles className="w-4 h-4 ml-2" /></>}
          </Button>
        )}

        <Button onClick={() => setPhase("lobby")} variant="secondary" className="w-full h-12 text-sm font-bold uppercase tracking-widest mt-2">
          <RotateCcw className="w-4 h-4 mr-2" /> Play Again
        </Button>
      </motion.div>
    );
  }

  // ─── BATTLE PHASE ───
  const q = quizQuestions[currentQ];
  if (!q) return null;

  return (
    <div className="relative max-w-6xl mx-auto min-h-[calc(100vh-6rem)] lg:min-h-[calc(100vh-7rem)] flex flex-col pt-2 pb-6 px-0 md:px-2">


      <motion.div 
        animate={screenShake ? { x: [-15, 15, -15, 15, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col relative z-10"
      >
        
        {/* Top HUD: HP Bars */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 mb-4 bg-bg-glass p-3 sm:p-4 rounded-2xl backdrop- border border-border-primary shadow-none shadow-none">
          
          {/* Player Stats */}
          <div className="flex-1">
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-emerald-500/30 shadow-none">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-black text-[10px] sm:text-xs uppercase tracking-wider text-emerald-100">Student</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-emerald-400/70">HP: {Math.round(playerHp)} / 100</p>
                </div>
              </div>
              <div className="text-right flex flex-col justify-center">
                <p className="font-black text-amber-400 text-lg sm:text-xl drop-shadow-none">{xp} <span className="text-[10px] sm:text-xs">XP</span></p>
                <div className="flex gap-1 justify-end mt-0.5">
                  {streak > 1 && <Badge variant="warning" className="text-[8px] font-black uppercase tracking-widest py-0 px-1 sm:px-1.5 animate-pulse bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-none">{streak}x</Badge>}
                  {combo > 1 && <Badge variant="purple" className="text-[8px] font-black uppercase tracking-widest py-0 px-1 sm:px-1.5 animate-pulse bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-none">{combo}x</Badge>}
                </div>
              </div>
            </div>
            <div className="h-3 sm:h-4 bg-bg-tertiary rounded-full overflow-hidden border border-border-primary p-0.5 shadow-none relative">
              <motion.div 
                animate={{ width: `${playerHp}%` }} 
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-none relative overflow-hidden" 
              >
                <div className="absolute inset-0 bg-bg-secondary animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </motion.div>
            </div>
          </div>

          <div className="text-xl sm:text-3xl font-black text-text-muted/30 italic px-2 sm:px-4 drop-shadow-none text-center">VS</div>

          {/* Boss Stats */}
          <div className="flex-1">
            <div className="flex justify-between mb-2 flex-row-reverse">
              <div className="flex items-center gap-2 sm:gap-3 flex-row-reverse">
                <motion.div 
                  animate={bossHit ? { scale: [1, 1.3, 1], filter: ["brightness(1)", "brightness(3)", "brightness(1)"] } : {}}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-bl from-rose-500/20 to-orange-500/20 flex items-center justify-center border border-rose-500/50 shadow-none"
                >
                  <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                </motion.div>
                <div className="text-right">
                  <p className="font-black text-[10px] sm:text-xs text-rose-300 uppercase tracking-wider">Boss</p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-rose-500/70">HP: {Math.round(bossHp)} / 100</p>
                </div>
              </div>
              <div className="flex flex-col justify-center max-w-[60%]">
                <Badge variant="danger" className="uppercase font-black tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0 sm:px-2 sm:py-0.5 text-[8px] sm:text-[10px] shadow-none truncate">{q.topic}</Badge>
              </div>
            </div>
            <div className="h-3 sm:h-4 bg-bg-tertiary rounded-full overflow-hidden border border-border-primary p-0.5 shadow-none relative transform rotate-180">
              <motion.div 
                animate={{ width: `${bossHp}%` }} 
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full shadow-none relative overflow-hidden" 
              >
                <div className="absolute inset-0 bg-bg-secondary animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Arena Area */}
        <div className="flex-1 flex flex-col md:flex-row gap-2 md:gap-6 mt-2">
          
          {/* Powerups (Sidebar on desktop, bottom row on mobile) */}
          <div className="w-full md:w-20 flex flex-row md:flex-col gap-2 shrink-0 order-2 md:order-1 justify-center">
            <button 
              onClick={() => handlePowerup("fiftyFifty")} 
              disabled={powerups.fiftyFifty === 0 || showFeedback}
              className={`flex-1 md:w-full md:flex-none aspect-auto md:aspect-square py-2 md:py-0 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 border border-border-primary transition-all duration-300 relative overflow-hidden group ${powerups.fiftyFifty > 0 ? "bg-bg-glass backdrop- text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 hover:shadow-none md:hover:scale-105" : "bg-bg-secondary opacity-30 grayscale"}`}
            >
              {powerups.fiftyFifty > 0 && <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
              <SplitSquareHorizontal className="w-5 h-5 md:w-6 md:h-6 relative z-10" />
              <span className="text-[10px] font-black tracking-widest relative z-10">{powerups.fiftyFifty}</span>
            </button>
            
            <button 
              onClick={() => handlePowerup("freeze")} 
              disabled={powerups.freeze === 0 || showFeedback || frozen}
              className={`flex-1 md:w-full md:flex-none aspect-auto md:aspect-square py-2 md:py-0 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 border border-border-primary transition-all duration-300 relative overflow-hidden group ${powerups.freeze > 0 ? "bg-bg-glass backdrop- text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-none md:hover:scale-105" : "bg-bg-secondary opacity-30 grayscale"}`}
            >
              {powerups.freeze > 0 && <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
              <Snowflake className={`w-5 h-5 md:w-6 md:h-6 relative z-10 ${frozen ? 'animate-spin-slow' : ''}`} />
              <span className="text-[10px] font-black tracking-widest relative z-10">{powerups.freeze}</span>
            </button>
            
            <button 
              onClick={() => handlePowerup("shield")} 
              disabled={powerups.shield === 0 || showFeedback || shieldActive}
              className={`flex-1 md:w-full md:flex-none aspect-auto md:aspect-square py-2 md:py-0 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 border border-border-primary transition-all duration-300 relative overflow-hidden group ${powerups.shield > 0 ? "bg-bg-glass backdrop- text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-none md:hover:scale-105" : "bg-bg-secondary opacity-30 grayscale"}`}
            >
              {powerups.shield > 0 && <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
              <Shield className={`w-5 h-5 md:w-6 md:h-6 relative z-10 ${shieldActive ? 'animate-pulse text-blue-300 drop-shadow-none' : ''}`} />
              <span className="text-[10px] font-black tracking-widest relative z-10">{powerups.shield}</span>
            </button>
          </div>

          {/* Center: Question & Answers */}
          <div className="flex-1 flex flex-col order-1 md:order-2">
            
            <div className="flex-1 pr-0 md:pr-4 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col justify-evenly h-full pb-4">
                
                <div className="text-center mb-4 md:mb-5 mt-5 md:mt-6 relative flex flex-col items-center justify-center">
                  {/* Timer Circle */}
                  <div className={`absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 md:-top-6 md:w-12 md:h-12 rounded-full border-[3px] flex items-center justify-center bg-bg-primary backdrop- font-black text-sm md:text-base z-20 transition-all duration-300 shadow-none ${timer > 10 ? "text-emerald-400 border-emerald-500/50 shadow-none" : timer > 5 ? "text-amber-400 border-amber-500/80 shadow-none animate-pulse" : "text-rose-500 border-rose-500 shadow-none animate-bounce"}`}>
                    {frozen ? <Snowflake className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 animate-spin-slow" /> : timer}
                  </div>
                  
                  <Card variant="glass" className="w-full pt-6 pb-4 px-4 md:pt-8 md:pb-5 md:px-6 bg-bg-glass backdrop- border border-border-primary relative shadow-none shadow-none rounded-2xl md:rounded-3xl">
                    {shieldActive && <div className="absolute inset-0 border-[3px] border-blue-500/50 rounded-2xl md:rounded-3xl animate-pulse pointer-events-none shadow-none" />}
                    {frozen && <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none shadow-none rounded-2xl md:rounded-3xl" />}
                    <h2 className="text-sm md:text-base font-bold leading-relaxed text-text-primary drop-shadow-none">{q.question}</h2>
                  </Card>
                </div>

                {/* Answers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-2">
                  {q.options.map((opt, i) => {
                    const isEliminated = eliminatedOptions.includes(i);
                    
                    let styles = "bg-bg-glass backdrop- border border-border-primary hover:border-accent-blue/50 hover:bg-accent-blue/10 hover:shadow-none";
                    if (showFeedback) {
                      if (i === q.correctAnswer) styles = "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-none z-10 scale-[1.03]";
                      else if (i === selected && i !== q.correctAnswer) styles = "bg-rose-500/20 border-rose-500 text-rose-300 shadow-none z-10 scale-[1.03]";
                      else styles = "bg-bg-secondary border-transparent opacity-30 scale-[0.98]";
                    } else if (i === selected) {
                      styles = "bg-accent-blue/20 border-accent-blue text-accent-blue shadow-none scale-[1.03]";
                    } else if (isEliminated) {
                      styles = "bg-bg-primary/10 border-transparent opacity-10 pointer-events-none scale-[0.98]";
                    }

                    return (
                      <button key={i} onClick={() => !showFeedback && !isEliminated && setSelected(i)}
                        disabled={showFeedback || isEliminated}
                        className={`relative w-full text-left p-3 md:p-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 cursor-pointer group ${styles}`}>
                        
                        {i === selected && !showFeedback && <div className="absolute inset-0 bg-accent-blue/10 rounded-xl md:rounded-2xl animate-pulse pointer-events-none" />}
                        
                        <div className="flex items-center relative z-10">
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-[10px] md:text-xs mr-3 transition-colors shrink-0 ${i === selected && !showFeedback ? 'bg-accent-blue text-text-primary shadow-none' : 'bg-bg-tertiary text-text-secondary'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1 leading-tight text-text-primary text-xs sm:text-sm">{opt}</span>
                          {showFeedback && i === q.correctAnswer && <CheckCircle2 className="w-5 h-5 md:w-5 md:h-5 ml-2 text-emerald-400 drop-shadow-none" />}
                          {showFeedback && i === selected && i !== q.correctAnswer && <XCircle className="w-5 h-5 md:w-5 md:h-5 ml-2 text-rose-400 drop-shadow-none" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Action / Feedback Area (Sticks below on mobile, inline on desktop) */}
            <div className="mt-2 shrink-0 order-3 z-20">
              {!showFeedback ? (
                 <div className="flex justify-center items-center pb-2 mt-2">
                   <Button onClick={() => handleAnswer(selected)} disabled={selected === null} size="lg" className="w-full sm:w-64 h-10 sm:h-12 text-sm sm:text-base font-black uppercase tracking-widest rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple hover:scale-[1.02] shadow-none hover:shadow-none transition-all duration-300 relative overflow-hidden group">
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer opacity-0 group-hover:opacity-100" />
                     <span className="relative z-10 flex items-center"><Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" /> Strike</span>
                   </Button>
                 </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                  className={`p-3 sm:p-4 rounded-xl md:rounded-2xl border backdrop- shadow-none ${lastCorrect ? "bg-emerald-950/40 border-emerald-500/30 shadow-none" : "bg-rose-950/40 border-rose-500/30 shadow-none"}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-center h-full gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 sm:gap-3 font-black text-sm sm:text-base mb-2 uppercase tracking-widest">
                        {lastCorrect ? (
                          <><span className="text-emerald-400 drop-shadow-none">Critical Hit!</span> <Badge variant="success" className="text-[10px] sm:text-xs px-2 py-0.5 font-black bg-emerald-500/20 text-emerald-400 border-emerald-500/50">+{100 * combo + Math.max(0, timer * 2)} XP</Badge></>
                        ) : (
                          <><span className="text-rose-400 drop-shadow-none">Damage Taken!</span> {shieldActive && <Badge variant="info" className="text-[10px] sm:text-xs px-2 py-0.5 font-black bg-blue-500/20 text-blue-400 border-blue-500/50">Blocked by Shield</Badge>}</>
                        )}
                      </div>
                      
                      {!lastCorrect && (
                        <div className="space-y-1.5 text-[11px] sm:text-xs max-w-3xl leading-relaxed">
                          <p className="text-text-muted"><strong className="text-rose-400 font-black uppercase tracking-wider text-[9px] sm:text-[10px] mr-2">Your trap:</strong> {q.whyReasonable}</p>
                          <p className="text-text-primary"><strong className="text-emerald-400 font-black uppercase tracking-wider text-[9px] sm:text-[10px] mr-2">The reality:</strong> {q.explanation}</p>
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={nextRound} size="sm" className="w-full sm:w-auto h-10 px-5 rounded-xl font-black text-xs uppercase tracking-widest shrink-0 bg-bg-tertiary hover:bg-bg-secondary border border-border-hover md:hover:scale-105 transition-all duration-300 shadow-none">
                      {playerHp <= 0 || bossHp <= 0 ? "Finish" : "Next Round"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
