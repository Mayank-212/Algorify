"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Badge, ProgressBar } from "@/components/ui/badge";
import { useMemory } from "@/lib/memory-store";
import {
  BarChart3, TrendingUp, TrendingDown, Minus,
  Brain, Flame, Target, BookOpen, Sparkles, Loader2, AlertTriangle, ShieldCheck
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function AnalyticsPage() {
  const { profile } = useMemory();
  const [insight, setInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  const generateDiagnostic = async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Analyze my current learning memory state:
Weaknesses: ${profile.weaknesses.join(", ") || "None recorded yet"}
Strengths: ${profile.strengths.join(", ") || "None recorded yet"}
Total XP: ${profile.totalXP}
Streak: ${profile.streakDays} days
Recent Mistakes: ${JSON.stringify(profile.recentMistakes)}

Provide a concise, 3-bullet point AI diagnostic of my learning patterns and immediate action items.`
          }]
        })
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let done = false;
      let text = "";
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          text += decoder.decode(value, { stream: true });
          setInsight(text);
        }
      }
    } catch (e) {
      setInsight("Failed to generate AI diagnostic.");
    } finally {
      setLoadingInsight(false);
    }
  };

  const currentAcc = profile.questionsAnswered > 0 
    ? Math.round((profile.correctAnswers / profile.questionsAnswered) * 100) 
    : 0;

  const accuracyData = [
    { date: "Day -4", accuracy: Math.max(0, currentAcc - 12) },
    { date: "Day -3", accuracy: Math.max(0, currentAcc - 5) },
    { date: "Day -2", accuracy: Math.max(0, currentAcc - 8) },
    { date: "Day -1", accuracy: Math.max(0, currentAcc - 2) },
    { date: "Today", accuracy: currentAcc },
  ];

  const radarData = profile.topicsExplored.length > 0 
    ? profile.topicsExplored.map((t) => ({
        subject: t.length > 12 ? t.substring(0,10) + ".." : t,
        mastery: profile.strengths.includes(t) ? 95 : profile.weaknesses.includes(t) ? 35 : 65
      })).slice(-6) // Last 6 topics
    : [
      { subject: "Play", mastery: 0 },
      { subject: "Arena", mastery: 0 },
      { subject: "To", mastery: 0 },
      { subject: "Build", mastery: 0 },
      { subject: "Stats", mastery: 0 },
    ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-accent-purple" /> Memory Engine & Diagnostics</h1>
          <p className="text-text-muted mt-1">Real-time student cognitive profile and weakness graph.</p>
        </div>
        <button 
          onClick={generateDiagnostic}
          disabled={loadingInsight}
          className="bg-accent-purple/20 text-accent-purple border border-accent-purple/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-accent-purple hover:text-text-primary transition-all flex items-center gap-2"
        >
          {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loadingInsight ? "Analyzing..." : "Generate AI Memory Diagnostic"}
        </button>
      </motion.div>

      {insight && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass" className="p-6 border-2 border-accent-purple/40 bg-accent-purple/5">
            <h3 className="font-bold text-accent-purple flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" /> AI Cognitive Assessment</h3>
            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{insight}</div>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Accumulated XP", value: `${profile.totalXP} XP`, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Active Streak", value: `${profile.streakDays} Days`, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Active Weaknesses", value: `${profile.weaknesses.length} Topics`, icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10" },
          { label: "Mastered Concepts", value: `${profile.strengths.length} Topics`, icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <Card key={s.label} variant="glass" hoverable className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-muted">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`${s.bg} ${s.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy trend */}
        <motion.div variants={fadeUp}>
          <Card variant="glass">
            <CardHeader><CardTitle>Accuracy Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accuracyData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(63,63,70,0.5)", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="accuracy" stroke="#8b5cf6" fill="url(#areaGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar chart */}
        <motion.div variants={fadeUp}>
          <Card variant="glass">
            <CardHeader><CardTitle>Knowledge Radar</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(63,63,70,0.3)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#a1a1aa" }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Mastery" dataKey="mastery" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Persistent Misconceptions */}
      <motion.div variants={fadeUp}>
        <Card variant="glass" className="p-6">
          <CardHeader className="p-0 mb-4"><CardTitle>Tracked Misconceptions & Weaknesses</CardTitle></CardHeader>
          <CardContent className="p-0">
            {profile.recentMistakes.length === 0 ? (
              <div className="p-6 text-center text-text-muted border border-border-primary rounded-xl bg-bg-tertiary/20">
                No mistakes tracked yet. Play Arena battle results automatically update this index.
              </div>
            ) : (
              <div className="space-y-3">
                {profile.recentMistakes.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">{m.topic}</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary">Question: {m.question}</p>
                    <p className="text-xs text-rose-300">Misconception: {m.misconception}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
