"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemory } from "@/lib/memory-store";
import { supabase } from "@/lib/supabase";
import { Trophy, Target, Flame, Brain, Medal, ChevronUp, ChevronDown } from "lucide-react";

type SortOption = "quizzes" | "accuracy" | "streak";

export default function LeaderboardPage() {
  const { profile } = useMemory();
  const [sortBy, setSortBy] = useState<SortOption>("accuracy");
  const [userName, setUserName] = useState("You");
  const [userId, setUserId] = useState("current-user");

  const [allPlayers, setAllPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "You");
        setUserId(session.user.id);
      }
    });

    // Fetch REAL users from Supabase
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // We select the id, user_id (if we need to match), and profile
        const { data, error } = await supabase
          .from("student_data")
          .select("user_id, profile");
          
        if (error) throw error;
        
        if (data) {
          const players = data.map((row: any) => {
            const p = row.profile || {};
            const qAnswered = p.questionsAnswered || 0;
            const cAnswers = p.correctAnswers || 0;
            const acc = qAnswered > 0 ? Math.round((cAnswers / qAnswered) * 100) : 0;
            
            return {
              id: row.user_id,
              name: row.user_id === userId ? userName : `Student ${row.user_id.substring(0, 4)}`, // Fallback name
              quizzesPlayed: p.quizzesPlayed || 0,
              avgAccuracy: acc,
              streakDays: p.streakDays || 0,
              level: p.level || 1,
            };
          });
          
          setAllPlayers(players);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [userId, userName]);

  const accuracy = profile.questionsAnswered > 0 
    ? Math.round((profile.correctAnswers / profile.questionsAnswered) * 100) 
    : 0;

  const sortedPlayers = useMemo(() => {
    // If the database only returned 1 person (us) due to RLS, make sure we show up at least.
    let list = [...allPlayers];
    if (list.length === 0) {
      list = [{
        id: userId,
        name: userName,
        quizzesPlayed: profile.quizzesPlayed,
        avgAccuracy: accuracy,
        streakDays: profile.streakDays,
        level: profile.level,
      }];
    }

    return list.sort((a, b) => {
      if (sortBy === "quizzes") return b.quizzesPlayed - a.quizzesPlayed;
      if (sortBy === "accuracy") return b.avgAccuracy - a.avgAccuracy;
      if (sortBy === "streak") return b.streakDays - a.streakDays;
      return 0;
    });
  }, [allPlayers, sortBy, profile, accuracy, userId, userName]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative pb-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 md:w-[30vw] md:h-[30vw] rounded-full bg-accent-amber/10  " />
        <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 md:w-[25vw] md:h-[25vw] rounded-full bg-accent-purple/10  " />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-primary pb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 drop-shadow-none">
            <Trophy className="w-8 h-8 text-amber-400" /> Global Leaderboard
          </h1>
          <p className="text-text-muted mt-2 font-medium">See how you stack up against top learners.</p>
        </div>

        <div className="w-full md:w-auto bg-bg-glass p-1.5 rounded-xl border border-border-primary shadow-none flex flex-col sm:flex-row gap-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary pl-2 sm:hidden pt-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-bg-card border border-border-primary rounded-lg p-3 text-sm text-text-primary outline-none focus:border-accent-amber focus:ring-1 focus:ring-accent-amber transition-all cursor-pointer font-bold uppercase tracking-wider"
          >
            <option value="accuracy">Average Accuracy</option>
            <option value="quizzes">Quizzes Taken</option>
            <option value="streak">Day Streak</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 mt-8">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-text-secondary border-b border-border-primary mb-4">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Student</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1"><Target className="w-3 h-3"/> Accuracy</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1"><Brain className="w-3 h-3"/> Quizzes</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1"><Flame className="w-3 h-3"/> Streak</div>
        </div>

        {loading ? (
          <div className="text-center text-text-muted py-10 font-bold tracking-widest uppercase text-sm">Syncing with database...</div>
        ) : sortedPlayers.map((player, index) => {
          const isCurrentUser = player.id === userId;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={player.id}
            >
              <Card 
                variant="glass" 
                className={`overflow-hidden transition-all duration-300 ${isCurrentUser ? "bg-accent-amber/10 border-accent-amber/30 shadow-none scale-[1.02]" : "bg-bg-glass hover:bg-bg-tertiary border-border-primary"}`}
              >
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4">
                    
                    {/* Rank */}
                    <div className="col-span-1 flex justify-center">
                      {index === 0 ? <Medal className="w-8 h-8 text-amber-400 drop-shadow-none" /> :
                       index === 1 ? <Medal className="w-8 h-8 text-gray-400 drop-shadow-none" /> :
                       index === 2 ? <Medal className="w-8 h-8 text-amber-700 drop-shadow-none" /> :
                       <span className={`text-xl font-black ${isCurrentUser ? "text-amber-400" : "text-text-muted"}`}>#{index + 1}</span>}
                    </div>

                    {/* Name & Level */}
                    <div className="col-span-5 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border shadow-none ${isCurrentUser ? "bg-gradient-to-br from-amber-400 to-rose-500 text-text-primary border-amber-300/50" : "bg-bg-tertiary text-text-primary border-border-primary"}`}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-bold text-base md:text-lg ${isCurrentUser ? "text-amber-400" : "text-text-primary"}`}>
                          {player.name} {isCurrentUser && <Badge variant="warning" className="ml-2 text-[10px] py-0">YOU</Badge>}
                        </p>
                        <p className="text-xs text-text-muted font-medium mt-0.5 flex items-center gap-1">
                          Lvl {player.level}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Only Divider */}
                    <div className="md:hidden border-t border-border-primary my-2 col-span-full" />

                    {/* Stats Grid (Mobile + Desktop) */}
                    <div className="col-span-full md:col-span-6 grid grid-cols-3 gap-2">
                      <div className={`flex flex-col items-center justify-center p-2 rounded-xl border ${sortBy === "accuracy" ? "bg-accent-amber/5 border-accent-amber/20" : "border-transparent"}`}>
                        <span className="text-[10px] font-bold text-text-muted uppercase md:hidden mb-1">Accuracy</span>
                        <span className={`font-black text-lg ${sortBy === "accuracy" ? "text-amber-400" : "text-text-primary"}`}>{player.avgAccuracy}%</span>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-2 rounded-xl border ${sortBy === "quizzes" ? "bg-accent-amber/5 border-accent-amber/20" : "border-transparent"}`}>
                        <span className="text-[10px] font-bold text-text-muted uppercase md:hidden mb-1">Quizzes</span>
                        <span className={`font-black text-lg ${sortBy === "quizzes" ? "text-amber-400" : "text-text-primary"}`}>{player.quizzesPlayed}</span>
                      </div>
                      <div className={`flex flex-col items-center justify-center p-2 rounded-xl border ${sortBy === "streak" ? "bg-accent-amber/5 border-accent-amber/20" : "border-transparent"}`}>
                        <span className="text-[10px] font-bold text-text-muted uppercase md:hidden mb-1">Streak</span>
                        <span className={`font-black text-lg flex items-center gap-1 ${sortBy === "streak" ? "text-amber-400" : "text-text-primary"}`}>
                          <Flame className={`w-4 h-4 ${player.streakDays > 0 ? "text-orange-500" : "text-text-muted"}`} />
                          {player.streakDays}
                        </span>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
