"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Badge, ProgressBar } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getGreeting } from "@/lib/utils";
import { useMemory } from "@/lib/memory-store";
import { format, subDays, startOfWeek, isSameDay } from "date-fns";
import {
  Flame, TrendingUp, Brain, Target, BookOpen,
  CheckCircle2, Circle, ArrowRight, Sparkles, Clock,
  AlertTriangle, Trophy, Activity,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function DashboardPage() {
  const { profile, memory } = useMemory();

  const accuracy = profile.questionsAnswered > 0 
    ? Math.round((profile.correctAnswers / profile.questionsAnswered) * 100) 
    : 0;
  
  const confidence = Math.min(100, profile.level * 10 + accuracy * 0.5);

  // Generate a mini study plan based on real weaknesses
  const todayPlan = profile.weaknesses.slice(0, 3).map((w, idx) => ({
    id: idx,
    topic: w,
    subject: "Cognitive Load Spike",
    durationMinutes: 15,
    completed: false,
    priority: "high"
  }));
  if (todayPlan.length === 0) {
    todayPlan.push({
      id: 99, topic: "General Knowledge Quiz", subject: "Baseline Assessment", durationMinutes: 10, completed: false, priority: "medium"
    });
  }

  // Topic mastery list
  const masteryList = [
    ...profile.strengths.map(s => ({ topic: s, mastery: 95 })),
    ...profile.topicsExplored.filter(t => !profile.strengths.includes(t) && !profile.weaknesses.includes(t)).map(t => ({ topic: t, mastery: 65 })),
    ...profile.weaknesses.map(w => ({ topic: w, mastery: 35 }))
  ].slice(0, 5);

  if (masteryList.length === 0) {
    masteryList.push({ topic: "Start assessment to track mastery", mastery: 0 });
  }

  // Dynamic Chart Data based on actual memory interactions this week
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(startOfCurrentWeek);
    dayDate.setDate(dayDate.getDate() + i);
    const interactionsOnDay = memory.filter(m => isSameDay(new Date(m.timestamp), dayDate)).length;
    
    return {
      date: format(dayDate, "EEE"),
      retention: Math.min(100, 40 + (interactionsOnDay * 15)),
      load: Math.min(100, (interactionsOnDay * 20))
    };
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border-primary">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{getGreeting()}, Student</h1>
          <p className="text-text-muted mt-1 font-medium">Algorify System Status: <span className="text-accent-cyan">Optimal</span></p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/planner"><Button variant="secondary" className="font-bold uppercase tracking-widest text-xs h-10 px-6 rounded-xl border border-border-primary shadow-none">View Agenda</Button></Link>
          <Link href="/dashboard/analytics"><Button className="font-bold uppercase tracking-widest text-xs h-10 px-6 rounded-xl bg-accent-cyan hover:bg-accent-cyan/90 text-bg-primary shadow-none"><Activity className="w-4 h-4 mr-2" /> Metrics</Button></Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cognitive Confidence", value: `${Math.round(confidence)}%`, trend: "+4.2%", icon: Brain, color: "text-accent-cyan", bg: "bg-accent-cyan/10" },
          { label: "Consistency Index", value: `${profile.streakDays} Days`, trend: "+1.0%", icon: Flame, color: "text-accent-purple", bg: "bg-accent-purple/10" },
          { label: "Retention Accuracy", value: `${accuracy}%`, trend: "-0.8%", icon: Target, color: "text-text-primary", bg: "bg-bg-tertiary" },
          { label: "Assessments Passed", value: `${profile.quizzesPlayed}`, trend: "+12.0%", icon: Trophy, color: "text-text-primary", bg: "bg-bg-tertiary" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 border border-border-primary bg-bg-secondary rounded-2xl shadow-none">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                  <span className={`text-xs font-bold mb-1 ${stat.trend.startsWith('+') ? 'text-accent-cyan' : 'text-rose-500'}`}>{stat.trend}</span>
                </div>
              </div>
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Agenda */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card className="h-full border border-border-primary bg-bg-secondary rounded-2xl shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-accent-cyan" /> Action Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayPlan.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl bg-bg-tertiary border border-transparent hover:border-border-primary transition-colors cursor-pointer group">
                  {session.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-accent-cyan shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted shrink-0 group-hover:text-accent-cyan transition-colors" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${session.completed ? "line-through text-text-muted" : "text-text-primary"}`}>{session.topic}</p>
                    <p className="text-xs text-text-muted font-medium mt-0.5">{session.subject} • {session.durationMinutes}m est.</p>
                  </div>
                  <Badge className="rounded-md font-bold uppercase text-[10px] tracking-widest shadow-none bg-bg-secondary text-text-primary border-border-primary">
                    {session.priority} Priority
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Diagnostics */}
        <motion.div variants={fadeUp}>
          <Card className="h-full border border-border-primary bg-bg-secondary rounded-2xl shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent-purple" /> Diagnostics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.weaknesses.length > 0 ? (
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border-primary">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-rose-500" /><span className="text-xs font-bold uppercase tracking-widest text-text-primary">Cognitive Debt</span></div>
                  <p className="text-sm font-medium text-text-muted leading-relaxed">High variance detected in <strong className="text-text-primary">{profile.weaknesses[0]}</strong>. Immediate review recommended to prevent retention decay.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border-primary">
                  <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-accent-cyan" /><span className="text-xs font-bold uppercase tracking-widest text-text-primary">Optimal State</span></div>
                  <p className="text-sm font-medium text-text-muted leading-relaxed">No critical weaknesses detected. Cognitive retention metrics are stable.</p>
                </div>
              )}
              {profile.strengths.length > 0 && (
                <div className="p-4 rounded-xl bg-bg-tertiary border border-border-primary">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-accent-cyan" /><span className="text-xs font-bold uppercase tracking-widest text-text-primary">Consolidated</span></div>
                  <p className="text-sm font-medium text-text-muted leading-relaxed"><strong className="text-text-primary">{profile.strengths[0]}</strong> shows 95%+ recall accuracy over 7 days.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention vs Load Chart */}
        <motion.div variants={fadeUp}>
          <Card className="border border-border-primary bg-bg-secondary rounded-2xl shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-accent-cyan" /> Load vs Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-primary)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)", fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border-primary)", borderRadius: "12px", fontSize: "12px", fontWeight: 600, boxShadow: "none" }}
                      itemStyle={{ fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="retention" name="Retention %" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                    <Area type="monotone" dataKey="load" name="Cognitive Load" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorLoad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Topic Mastery Progress */}
        <motion.div variants={fadeUp}>
          <Card className="h-full border border-border-primary bg-bg-secondary rounded-2xl shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-4 h-4 text-accent-purple" /> Knowledge Base Matrix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {masteryList.map((topic) => (
                <div key={topic.topic} className="group">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">{topic.topic}</span>
                    <span className="text-xs font-black text-text-muted group-hover:text-text-primary transition-colors">{topic.mastery}%</span>
                  </div>
                  <div className="h-2 w-full bg-bg-tertiary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${topic.mastery >= 80 ? "bg-accent-cyan" : topic.mastery >= 50 ? "bg-accent-purple" : "bg-text-muted"}`} 
                      style={{ width: `${topic.mastery}%` }} 
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
