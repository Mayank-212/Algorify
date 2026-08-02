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
  AlertTriangle, Trophy,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
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
    subject: "Review Needed",
    durationMinutes: 15,
    completed: false,
    priority: "high"
  }));
  if (todayPlan.length === 0) {
    todayPlan.push({
      id: 99, topic: "General Knowledge Quiz", subject: "Daily Practice", durationMinutes: 10, completed: false, priority: "medium"
    });
  }

  // Topic mastery list
  const masteryList = [
    ...profile.strengths.map(s => ({ topic: s, mastery: 95 })),
    ...profile.topicsExplored.filter(t => !profile.strengths.includes(t) && !profile.weaknesses.includes(t)).map(t => ({ topic: t, mastery: 65 })),
    ...profile.weaknesses.map(w => ({ topic: w, mastery: 35 }))
  ].slice(0, 5);

  if (masteryList.length === 0) {
    masteryList.push({ topic: "Start playing to track mastery!", mastery: 0 });
  }

  // Dynamic Chart Data based on actual memory interactions this week
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(startOfCurrentWeek);
    dayDate.setDate(dayDate.getDate() + i);
    
    // Count real interactions/memories created on this specific day
    const interactionsOnDay = memory.filter(m => isSameDay(new Date(m.timestamp), dayDate)).length;
    
    // Convert interactions to an XP proxy (e.g., 5 XP per interaction) or default to 0
    return {
      date: format(dayDate, "EEE"),
      xp: interactionsOnDay * 5
    };
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}, Student 👋</h1>
        <p className="text-text-muted mt-1">Your AI Learning Twin is ready. Here&apos;s your real-time learning snapshot.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Learning Score", value: `${Math.round(confidence)}%`, icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Day Streak", value: `${profile.streakDays}`, icon: Flame, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Avg Accuracy", value: `${accuracy}%`, icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Quizzes Taken", value: `${profile.quizzesPlayed}`, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((stat) => (
          <Card key={stat.label} variant="glass" hoverable className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Plan */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <Card variant="glass" className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-accent-cyan" /> Today&apos;s Study Plan</CardTitle>
              <Link href="/dashboard/planner"><Button variant="ghost" size="sm">View All <ArrowRight className="w-4 h-4" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayPlan.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-tertiary/30 border border-border-primary/50">
                  {session.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${session.completed ? "line-through text-text-muted" : ""}`}>{session.topic}</p>
                    <p className="text-xs text-text-muted">{session.subject} · {session.durationMinutes}min</p>
                  </div>
                  <Badge variant={session.priority === "high" ? "danger" : session.priority === "medium" ? "warning" : "default"}>
                    {session.priority}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Recommendations */}
        <motion.div variants={fadeUp}>
          <Card variant="glass" className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent-amber" /> AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.weaknesses.length > 0 ? (
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-rose-400" /><span className="text-xs font-medium text-rose-400">Focus Area</span></div>
                  <p className="text-sm">You are struggling with <b>{profile.weaknesses[0]}</b>. Consider reviewing it in Learning Space.</p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-blue-400" /><span className="text-xs font-medium text-blue-400">Looking Good</span></div>
                  <p className="text-sm">No active weaknesses found. Hit the Play Arena to test your limits!</p>
                </div>
              )}
              {profile.strengths.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-xs font-medium text-emerald-400">Improving</span></div>
                  <p className="text-sm"><b>{profile.strengths[0]}</b> is trending up — keep practicing!</p>
                </div>
              )}
              <Link href="/dashboard/analytics">
                <Button variant="secondary" className="w-full mt-2"><Brain className="w-4 h-4" /> Go To Memory Engine</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study chart */}
        <motion.div variants={fadeUp}>
          <Card variant="glass">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5 text-accent-blue" /> Weekly Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(63,63,70,0.3)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#71717a" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid rgba(63,63,70,0.5)", borderRadius: "12px", fontSize: "12px" }}
                      labelStyle={{ color: "#a1a1aa" }}
                    />
                    <Bar dataKey="xp" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Topic mastery */}
        <motion.div variants={fadeUp}>
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-accent-emerald" /> Topic Mastery</CardTitle>
              <Link href="/dashboard/analytics"><Button variant="ghost" size="sm">Details <ArrowRight className="w-4 h-4" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {masteryList.map((topic) => (
                <div key={topic.topic}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{topic.topic}</span>
                    <span className={`text-xs font-medium ${topic.mastery >= 80 ? "text-emerald-400" : topic.mastery >= 50 ? "text-amber-400" : "text-rose-400"}`}>{topic.mastery}%</span>
                  </div>
                  <ProgressBar value={topic.mastery} color={topic.mastery >= 80 ? "emerald" : topic.mastery >= 50 ? "amber" : "rose"} size="sm" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
