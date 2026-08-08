"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { useMemory } from "@/lib/memory-store";
import {
  Brain, Flame, Target, Sparkles, Loader2, AlertTriangle, ShieldCheck,
  Activity, Database, Network
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

Provide a concise, highly professional 3-bullet point AI diagnostic of my cognitive retention patterns and immediate action items using data science terminology.`
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

  const retentionData = [
    { date: "Day -6", decay: 45, retention: Math.max(0, currentAcc - 12) },
    { date: "Day -5", decay: 35, retention: Math.max(0, currentAcc - 8) },
    { date: "Day -4", decay: 40, retention: Math.max(0, currentAcc - 15) },
    { date: "Day -3", decay: 20, retention: Math.max(0, currentAcc - 5) },
    { date: "Day -2", decay: 25, retention: Math.max(0, currentAcc - 8) },
    { date: "Day -1", decay: 10, retention: Math.max(0, currentAcc - 2) },
    { date: "Today", decay: 5, retention: currentAcc },
  ];

  const radarData = profile.topicsExplored.length > 0 
    ? profile.topicsExplored.map((t) => ({
        subject: t.length > 12 ? t.substring(0,10) + ".." : t,
        mastery: profile.strengths.includes(t) ? 95 : profile.weaknesses.includes(t) ? 35 : 65
      })).slice(-6) 
    : [
      { subject: "Baseline", mastery: 20 },
      { subject: "Logic", mastery: 40 },
      { subject: "Recall", mastery: 60 },
      { subject: "Analysis", mastery: 30 },
      { subject: "Synthesis", mastery: 50 },
    ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border-primary">
        <div>
          <h1 className="text-3xl font-black tracking-tight"><Database className="w-8 h-8 text-accent-purple inline mr-2 mb-1" /> Memory Engine</h1>
          <p className="text-text-muted mt-1 font-medium">Cognitive retention analytics and knowledge graph.</p>
        </div>
        <button 
          onClick={generateDiagnostic}
          disabled={loadingInsight}
          className="bg-bg-primary border border-border-primary text-text-primary px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black hover:border-accent-purple hover:text-accent-purple transition-all flex items-center gap-2"
        >
          {loadingInsight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
          {loadingInsight ? "Compiling..." : "Run AI Diagnostic"}
        </button>
      </motion.div>

      {insight && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 border border-accent-purple/30 bg-accent-purple/5 rounded-2xl shadow-none">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent-purple flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4" /> AI Cognitive Assessment</h3>
            <div className="text-sm font-medium text-text-primary leading-relaxed whitespace-pre-line">{insight}</div>
          </Card>
        </motion.div>
      )}

      {/* Summary Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Memory Index", value: `${profile.totalXP}`, trend: "Growing", icon: Brain, color: "text-accent-purple" },
          { label: "Retention Rate", value: `${currentAcc}%`, trend: "Stable", icon: ShieldCheck, color: "text-accent-cyan" },
          { label: "Cognitive Debt", value: `${profile.weaknesses.length}`, trend: "Nodes", icon: AlertTriangle, color: "text-rose-500" },
          { label: "Consolidated Nodes", value: `${profile.strengths.length}`, trend: "Nodes", icon: Target, color: "text-text-primary" },
        ].map((s) => (
          <Card key={s.label} className="p-5 border border-border-primary bg-bg-secondary rounded-2xl shadow-none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{s.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black tracking-tight">{s.value}</p>
                  <span className="text-[10px] font-bold text-text-muted uppercase">{s.trend}</span>
                </div>
              </div>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention vs Decay chart */}
        <motion.div variants={fadeUp}>
          <Card className="border border-border-primary bg-bg-secondary rounded-2xl shadow-none h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-accent-cyan" /> Retention vs Decay Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={retentionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRetentionArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDecayArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-primary)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, boxShadow: "none" }} />
                    <Area type="monotone" dataKey="retention" name="Retention %" stroke="#06b6d4" strokeWidth={2} fill="url(#colorRetentionArea)" />
                    <Area type="monotone" dataKey="decay" name="Decay Rate %" stroke="#f43f5e" strokeWidth={2} fill="url(#colorDecayArea)" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar chart */}
        <motion.div variants={fadeUp}>
          <Card className="border border-border-primary bg-bg-secondary rounded-2xl shadow-none h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Network className="w-4 h-4 text-accent-purple" /> Cognitive Vector Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="var(--color-border-primary)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--color-text-primary)", fontWeight: 700 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Mastery Level" dataKey="mastery" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.15} />
                    <Tooltip contentStyle={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-primary)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, boxShadow: "none" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Persistent Misconceptions Table */}
      <motion.div variants={fadeUp}>
        <Card className="border border-border-primary bg-bg-secondary rounded-2xl shadow-none p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest">Cognitive Debt & Misconception Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {profile.recentMistakes.length === 0 ? (
              <div className="p-6 text-center text-sm font-medium text-text-muted border border-border-primary rounded-xl bg-bg-tertiary">
                No cognitive debt recorded. Matrix is optimal.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-text-muted border-b border-border-primary">
                    <tr>
                      <th className="pb-3 font-bold">Node (Topic)</th>
                      <th className="pb-3 font-bold">Assessment Context</th>
                      <th className="pb-3 font-bold">Identified Misconception</th>
                      <th className="pb-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary">
                    {profile.recentMistakes.map((m, idx) => (
                      <tr key={idx} className="group hover:bg-bg-tertiary transition-colors">
                        <td className="py-4 pr-4 font-bold text-text-primary">{m.topic}</td>
                        <td className="py-4 pr-4 text-text-muted font-medium max-w-[200px] truncate">{m.question}</td>
                        <td className="py-4 pr-4 text-rose-500 font-medium">{m.misconception}</td>
                        <td className="py-4 text-right">
                          <span className="inline-block px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 rounded border border-rose-500/20">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
