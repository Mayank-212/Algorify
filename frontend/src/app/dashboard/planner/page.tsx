"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useMemory } from "@/lib/memory-store";
import { Calendar, CheckCircle2, Clock, Brain, Loader2, Sparkles, Map, Target, Flame } from "lucide-react";

interface PlanDay {
  day: string;
  focus: string;
  duration: number;
  type: "review" | "practice" | "new";
  reason: string;
  completed: boolean;
}

export default function StudyPlannerPage() {
  const { profile } = useMemory();
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [generating, setGenerating] = useState(false);

  // Generate a totally customized plan on load if empty
  useEffect(() => {
    if (plan.length === 0) {
      generatePlan();
    }
  }, []);

  const generatePlan = async () => {
    setGenerating(true);
    
    // Simulate AI Generation time
    await new Promise(r => setTimeout(r, 1500));
    
    const weaknesses = profile.weaknesses.length > 0 ? profile.weaknesses : ["General Concepts"];
    const strengths = profile.strengths.length > 0 ? profile.strengths : ["Foundations"];
    const mistakes = profile.recentMistakes.slice(0, 3);
    
    const days: PlanDay[] = [
      {
        day: "Monday",
        focus: weaknesses[0] || "Core Review",
        duration: 45,
        type: "practice",
        reason: `Targeting your biggest weakness: ${weaknesses[0]}.`,
        completed: false
      },
      {
        day: "Tuesday",
        focus: mistakes.length > 0 ? mistakes[0].topic : strengths[0],
        duration: 30,
        type: "review",
        reason: mistakes.length > 0 ? `Reviewing recent misconception: ${mistakes[0].misconception}` : `Strengthening your core.`,
        completed: false
      },
      {
        day: "Wednesday",
        focus: weaknesses[1] || weaknesses[0] || "New Concepts",
        duration: 60,
        type: "new",
        reason: "Deep dive into complex theoretical concepts.",
        completed: false
      },
      {
        day: "Thursday",
        focus: "Play Arena: Mix",
        duration: 20,
        type: "practice",
        reason: "Speed test to build your streak and XP.",
        completed: false
      }
    ];
    
    setPlan(days);
    setGenerating(false);
  };

  const toggleDay = (idx: number) => {
    setPlan(p => p.map((d, i) => i === idx ? { ...d, completed: !d.completed } : d));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3"><Map className="w-8 h-8 text-accent-blue" /> Dynamic Study Planner</h1>
        <p className="text-text-muted mt-2 text-lg">Your Twin built this schedule directly from your memory graph and recent mistakes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Left: AI Context Analysis */}
        <div className="space-y-4">
          <Card variant="glass" className="p-6 border-2 border-border-primary bg-bg-tertiary/20">
            <h3 className="font-bold flex items-center gap-2 mb-4 text-lg"><Brain className="w-5 h-5 text-accent-purple" /> Twin Analysis</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <strong className="text-rose-400 block mb-1 text-xs uppercase tracking-widest">Active Weaknesses</strong>
                {profile.weaknesses.length > 0 ? (
                  <ul className="list-disc pl-4 text-text-muted space-y-1">
                    {profile.weaknesses.map(w => <li key={w}>{w}</li>)}
                  </ul>
                ) : <p className="text-text-muted italic">No weaknesses detected yet.</p>}
              </div>

              <div className="pt-2">
                <strong className="text-emerald-400 block mb-1 text-xs uppercase tracking-widest">Mastered Strengths</strong>
                {profile.strengths.length > 0 ? (
                  <ul className="list-disc pl-4 text-text-muted space-y-1">
                    {profile.strengths.map(s => <li key={s}>{s}</li>)}
                  </ul>
                ) : <p className="text-text-muted italic">Complete Play Arena boss battles to record mastery.</p>}
              </div>
              
              <div className="pt-4 border-t border-border-primary/50">
                <button onClick={generatePlan} disabled={generating} className="w-full py-2 bg-accent-blue/20 text-accent-blue hover:bg-accent-blue hover:text-text-primary rounded-lg font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Recalculating</> : <><Sparkles className="w-4 h-4" /> Rebuild Plan</>}
                </button>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6 border-2 border-border-primary bg-bg-tertiary/20 text-center">
            <Flame className="w-10 h-10 text-accent-amber mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Consistency Tracker</h3>
            <p className="text-3xl font-black text-accent-amber mb-1">{profile.streakDays} Days</p>
            <p className="text-sm text-text-muted">Current Login Streak</p>
          </Card>
        </div>

        {/* Right: The Schedule */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-400" /> Recommended Schedule</h3>
          
          {generating ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-primary rounded-2xl bg-bg-tertiary/10 text-text-muted gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
              <p className="font-medium">Analyzing brainwaves and performance data...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.map((day, idx) => (
                <Card 
                  key={day.day} 
                  variant="glass" 
                  onClick={() => toggleDay(idx)}
                  className={`p-0 overflow-hidden cursor-pointer transition-all border-2 ${day.completed ? "border-emerald-500/50 bg-emerald-950/10" : "border-border-primary hover:border-accent-blue/50"}`}
                >
                  <div className="flex">
                    <div className={`w-2 ${day.completed ? "bg-emerald-500" : day.type === "review" ? "bg-accent-amber" : day.type === "new" ? "bg-accent-purple" : "bg-accent-blue"}`} />
                    <div className="p-4 flex-1 flex items-center gap-4">
                      <div className="w-16 text-center shrink-0">
                        <strong className={`block text-lg ${day.completed ? "text-emerald-400" : "text-text-primary"}`}>{day.day.substring(0,3)}</strong>
                        <span className="text-xs text-text-muted uppercase font-bold">{day.type}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg ${day.completed ? "line-through text-emerald-400/50" : ""}`}>{day.focus}</h4>
                        <p className="text-sm text-text-muted mt-1">{day.reason}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-4 text-right">
                        <div className="text-xs font-bold text-text-muted flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {day.duration}m
                        </div>
                        {day.completed ? (
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-border-primary flex items-center justify-center">
                            <Target className="w-4 h-4 text-text-muted opacity-50" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
