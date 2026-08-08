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
  
  const [weeklyHours, setWeeklyHours] = useState(10);

  // Generate initial plan on load
  useEffect(() => {
    if (plan.length === 0) {
      generatePlan(true);
    }
  }, []);

  const generatePlan = async (isInitial = false) => {
    if (!isInitial && plan.length > 0) {
      if (!window.confirm("Are you sure you want to generate a new 7-day plan? This will overwrite your current schedule.")) {
        return;
      }
    }
    
    setGenerating(true);
    
    // Simulate AI Generation time
    await new Promise(r => setTimeout(r, 1200));
    
    const weaknesses = profile.weaknesses.length > 0 ? profile.weaknesses : ["General Concepts"];
    const strengths = profile.strengths.length > 0 ? profile.strengths : ["Foundations"];
    const mistakes = profile.recentMistakes.slice(0, 3);
    
    // Total minutes available for the week
    const totalMinutes = weeklyHours * 60;
    
    // Distribute minutes across 7 days based on learning load (Mon-Sun)
    // 20%, 10%, 20%, 10%, 15%, 15%, 10%
    const distribution = [0.2, 0.1, 0.2, 0.1, 0.15, 0.15, 0.1];
    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    const generatedDays: PlanDay[] = weekDays.map((day, idx) => {
       const duration = Math.round(totalMinutes * distribution[idx]);
       let type: "review" | "practice" | "new" = "practice";
       let focus = "";
       let reason = "";
       
       if (idx === 0 || idx === 2) {
         type = "new";
         focus = weaknesses[idx === 0 ? 0 : (weaknesses.length > 1 ? 1 : 0)];
         reason = `Deep dive to tackle your weakness: ${focus}.`;
       } else if (idx === 1 || idx === 4) {
         type = "review";
         focus = mistakes.length > 0 ? mistakes[0].topic : strengths[0];
         reason = mistakes.length > 0 ? `Reviewing recent misconception: ${mistakes[0].misconception}` : `Consolidating your core strengths.`;
       } else if (idx === 5) {
         type = "practice";
         focus = "Play Arena: Mix";
         reason = "Weekend speed test to build your XP.";
       } else {
         type = "practice";
         focus = strengths[1] || strengths[0] || "General Knowledge";
         reason = "Light practice to maintain momentum.";
       }
       
       return {
         day,
         focus,
         duration,
         type,
         reason,
         completed: false
       };
    });
    
    setPlan(generatedDays);
    setGenerating(false);
  };

  const toggleDay = (idx: number) => {
    setPlan(p => {
      const newPlan = [...p];
      const day = { ...newPlan[idx] };
      day.completed = !day.completed;
      newPlan[idx] = day;
      return newPlan;
    });
  };

  const displayStreak = profile.streakDays + plan.filter(d => d.completed).length;

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
                <strong className="text-text-primary block mb-1 text-xs uppercase tracking-widest">Active Weaknesses</strong>
                {profile.weaknesses.length > 0 ? (
                  <ul className="list-disc pl-4 text-text-muted space-y-1">
                    {profile.weaknesses.map(w => <li key={w}>{w}</li>)}
                  </ul>
                ) : <p className="text-text-muted italic">No weaknesses detected yet.</p>}
              </div>

              <div className="pt-2">
                <strong className="text-text-primary block mb-1 text-xs uppercase tracking-widest">Mastered Strengths</strong>
                {profile.strengths.length > 0 ? (
                  <ul className="list-disc pl-4 text-text-muted space-y-1">
                    {profile.strengths.map(s => <li key={s}>{s}</li>)}
                  </ul>
                ) : <p className="text-text-muted italic">Complete Play Arena boss battles to record mastery.</p>}
              </div>
              
              <div className="pt-4 border-t border-border-primary/50">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex justify-between items-center">
                  <span>Weekly Study Goal</span>
                  <span className="text-accent-blue font-black text-base">{weeklyHours}h</span>
                </label>
                <input 
                  type="range" 
                  min="2" max="40" 
                  value={weeklyHours} 
                  onChange={(e) => setWeeklyHours(parseInt(e.target.value))} 
                  className="w-full h-2 bg-bg-card rounded-lg appearance-none cursor-pointer border border-border-primary mb-4" 
                />
                
                <button onClick={() => generatePlan(false)} disabled={generating} className="w-full py-3 bg-gradient-to-r from-accent-cyan to-accent-purple text-white shadow-none rounded-lg font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] flex items-center justify-center gap-2">
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Recalculating</> : <><Sparkles className="w-4 h-4" /> Generate 7-Day Plan</>}
                </button>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-6 border-2 border-border-primary bg-bg-tertiary/20 text-center">
            <Flame className="w-10 h-10 text-accent-purple mx-auto mb-2" />
            <h3 className="font-bold text-lg mb-1">Consistency Tracker</h3>
            <p className="text-4xl font-black text-text-primary mb-1">{displayStreak} Days</p>
            <p className="text-sm text-text-muted">Current Login Streak</p>
          </Card>
        </div>

        {/* Right: The Schedule */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-accent-cyan" /> 7-Day Recommended Schedule</h3>
          
          {generating ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border-primary rounded-2xl bg-bg-tertiary/10 text-text-muted gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
              <p className="font-medium">Algorify is constructing your optimal weekly path...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plan.map((day, idx) => (
                <Card 
                  key={day.day} 
                  variant="glass" 
                  onClick={() => toggleDay(idx)}
                  className={`p-0 overflow-hidden cursor-pointer transition-all border-2 ${day.completed ? "border-accent-cyan/50 bg-bg-tertiary/30 shadow-none" : "border-border-primary hover:border-accent-cyan/50"}`}
                >
                  <div className="flex">
                    <div className={`w-2 ${day.completed ? "bg-accent-cyan" : day.type === "review" ? "bg-accent-purple" : day.type === "new" ? "bg-accent-cyan" : "bg-bg-tertiary"}`} />
                    <div className="p-4 flex-1 flex items-center gap-4">
                      <div className="w-16 text-center shrink-0">
                        <strong className={`block text-lg ${day.completed ? "text-text-muted" : "text-text-primary"}`}>{day.day.substring(0,3)}</strong>
                        <span className="text-xs text-text-muted uppercase font-bold">{day.type}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg ${day.completed ? "line-through text-text-muted" : ""}`}>{day.focus}</h4>
                        <p className="text-sm text-text-muted mt-1">{day.reason}</p>
                      </div>

                      <div className="shrink-0 flex items-center gap-4 text-right">
                        <div className="text-xs font-bold text-text-muted flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {Math.max(10, day.duration)}m
                        </div>
                        {day.completed ? (
                          <CheckCircle2 className="w-8 h-8 text-accent-cyan drop-shadow-none" />
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
