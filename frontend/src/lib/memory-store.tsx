"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "./supabase";
import type { ChatMessage } from "@/types";

export interface MemoryEntry {
  id: string;
  source: "tutor" | "quiz" | "space" | "cowriter" | "focus";
  type: "question" | "mistake" | "mastery" | "concept" | "interaction" | "focus_session";
  topic: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface StudentProfile {
  totalXP: number;
  level: number;
  streakDays: number;
  topicsExplored: string[];
  weaknesses: string[];
  strengths: string[];
  recentMistakes: { topic: string; question: string; misconception: string }[];
  quizzesPlayed: number;
  questionsAnswered: number;
  correctAnswers: number;
  tutorConversations: number;
  booksUploaded: number;
  lastActive: string;
  chatHistory: ChatMessage[];
  learningStyle: string;
  preferredExplanationStyle: string;
}

interface MemoryContextType {
  memory: MemoryEntry[];
  profile: StudentProfile;
  addMemory: (entry: Omit<MemoryEntry, "id" | "timestamp">) => void;
  addXP: (amount: number) => void;
  recordMistake: (topic: string, question: string, misconception: string) => void;
  recordMastery: (topic: string) => void;
  recordQuizResults: (totalQuestions: number, correct: number) => void;
  recordFocusSession: (minutes: number, mode: string) => void;
  getTopicMemory: (topic: string) => MemoryEntry[];
  getProfileSummary: () => string;
  updateChatHistory: (messages: ChatMessage[]) => void;
  clearChatHistory: () => void;
}

const initialStudentProfile: StudentProfile = {
  totalXP: 0,
  level: 1,
  streakDays: 0,
  topicsExplored: [],
  weaknesses: [],
  strengths: [],
  recentMistakes: [],
  quizzesPlayed: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  tutorConversations: 0,
  booksUploaded: 0,
  lastActive: new Date().toISOString(),
  chatHistory: [],
  learningStyle: "visual",
  preferredExplanationStyle: "analogies",
};

const MemoryContext = createContext<MemoryContextType | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memoryEvents, setMemoryEvents] = useState<MemoryEntry[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(initialStudentProfile);
  const [isStoreReady, setIsStoreReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("algorify_demo_mode") === "true") {
      setCurrentUserId("demo-123");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isActive = true;

    const initializeUserStore = async () => {
      if (!currentUserId) {
        if (isActive) {
          setStudentProfile(initialStudentProfile);
          setMemoryEvents([]);
          setIsStoreReady(true);
        }
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('student_data')
          .select('profile, memory')
          .eq('user_id', currentUserId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn("Could not retrieve existing student data profile.", error.message);
        }

        if (isActive && data) {
          if (data.profile) setStudentProfile(data.profile);
          if (data.memory) setMemoryEvents(data.memory);
        }
      } catch (error) {
        console.warn("Network degradation prevented student profile load.");
      } finally {
        if (isActive) setIsStoreReady(true);
      }
    };
    
    setIsStoreReady(false);
    initializeUserStore();

    return () => { isActive = false; };
  }, [currentUserId]);

  useEffect(() => {
    if (!isStoreReady || !currentUserId) return;
    
    const persistStateToCloud = async () => {
      const { error } = await supabase
        .from('student_data')
        .upsert({
          user_id: currentUserId,
          profile: studentProfile,
          memory: memoryEvents.slice(-200) // Keep payload manageable
        });
        
      if (error) {
        console.warn("Failed to synchronize local state to cloud.", error.message);
      }
    };
    
    const debounceTimer = setTimeout(persistStateToCloud, 2000);
    return () => clearTimeout(debounceTimer);
  }, [studentProfile, memoryEvents, currentUserId, isStoreReady]);

  const addMemory = useCallback((entry: Omit<MemoryEntry, "id" | "timestamp">) => {
    const newEntry: MemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    
    setMemoryEvents((prev) => [...prev, newEntry]);

    setStudentProfile((prevProfile) => {
      const hasExploredTopic = prevProfile.topicsExplored.includes(entry.topic);
      return {
        ...prevProfile,
        topicsExplored: hasExploredTopic ? prevProfile.topicsExplored : [...prevProfile.topicsExplored, entry.topic],
        lastActive: new Date().toISOString()
      };
    });
  }, []);

  const addXP = useCallback((amount: number) => {
    setStudentProfile((prev) => {
      const accumulatedXP = prev.totalXP + amount;
      const calculatedLevel = Math.floor(accumulatedXP / 500) + 1;
      return { ...prev, totalXP: accumulatedXP, level: calculatedLevel };
    });
  }, []);

  const recordMistake = useCallback((topic: string, question: string, misconception: string) => {
    setStudentProfile((prev) => {
      const recentErrors = [{ topic, question, misconception }, ...prev.recentMistakes].slice(0, 20);
      const uniqueWeaknesses = Array.from(new Set([...prev.weaknesses, topic]));
      
      return { ...prev, recentMistakes: recentErrors, weaknesses: uniqueWeaknesses };
    });
    
    addMemory({ 
      source: "quiz", 
      type: "mistake", 
      topic, 
      content: `Mistake: ${question} — Misconception: ${misconception}` 
    });
  }, [addMemory]);

  const recordMastery = useCallback((topic: string) => {
    setStudentProfile((prev) => {
      const uniqueStrengths = Array.from(new Set([...prev.strengths, topic]));
      const remainingWeaknesses = prev.weaknesses.filter((w) => w !== topic);
      
      return { ...prev, strengths: uniqueStrengths, weaknesses: remainingWeaknesses };
    });
    
    addMemory({ 
      source: "quiz", 
      type: "mastery", 
      topic, 
      content: `Mastered topic: ${topic}` 
    });
  }, [addMemory]);

  const recordFocusSession = useCallback((minutes: number, mode: string) => {
    addMemory({ 
      source: "focus", 
      type: "focus_session", 
      topic: "Zen Mode", 
      content: `Completed ${minutes} minutes of deep focus in ${mode} mode.` 
    });
    
    // Base 2 XP per minute of focus
    addXP(minutes * 2);
  }, [addMemory, addXP]);

  const recordQuizResults = useCallback((totalQuestions: number, correctAnswersCount: number) => {
    setStudentProfile((prev) => {
      const lastActive = new Date(prev.lastActive);
      const today = new Date();
      lastActive.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      const diffTime = Math.abs(today.getTime() - lastActive.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      let newStreak = prev.streakDays;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      } else if (newStreak === 0) {
        newStreak = 1;
      }
      
      return {
        ...prev,
        quizzesPlayed: prev.quizzesPlayed + 1,
        questionsAnswered: prev.questionsAnswered + totalQuestions,
        correctAnswers: prev.correctAnswers + correctAnswersCount,
        streakDays: newStreak,
      };
    });
  }, []);

  const getTopicMemory = useCallback((topic: string) => {
    return memoryEvents.filter((mem) => mem.topic.toLowerCase() === topic.toLowerCase());
  }, [memoryEvents]);

  const getProfileSummary = useCallback(() => {
    const topWeakness = studentProfile.weaknesses[0] || "None identified yet";
    const topStrength = studentProfile.strengths[0] || "None identified yet";
    return `Level ${studentProfile.level} Student (${studentProfile.totalXP} XP). Top Strength: ${topStrength}. Top Weakness: ${topWeakness}. Playing on a ${studentProfile.streakDays} day streak.`;
  }, [studentProfile]);

  const updateChatHistory = useCallback((messages: ChatMessage[]) => {
    setStudentProfile((prev) => ({
      ...prev,
      chatHistory: messages,
    }));
  }, []);

  const clearChatHistory = useCallback(() => {
    setStudentProfile((prev) => ({
      ...prev,
      chatHistory: [],
    }));
  }, []);

  return (
    <MemoryContext.Provider
      value={{
        memory: memoryEvents,
        profile: studentProfile,
        addMemory,
        addXP,
        recordMistake,
        recordMastery,
        recordQuizResults,
        recordFocusSession,
        getTopicMemory,
        getProfileSummary,
        updateChatHistory,
        clearChatHistory,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within a MemoryProvider. Ensure the component tree is wrapped correctly.");
  }
  return context;
}
