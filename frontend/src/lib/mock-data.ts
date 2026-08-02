import type {
  LearningTwin,
  TopicMastery,
  DailyActivity,
  StudySession,
  ChatMessage,
} from "@/types";

export const mockLearningTwin: LearningTwin = {
  id: "lt-001",
  userId: "user-001",
  learningStyle: "visual",
  confidence: 72,
  weakTopics: ["Calculus Integration", "Organic Chemistry", "Electromagnetism"],
  strongTopics: ["Algebra", "Mechanics", "Data Structures"],
  recentMistakes: [
    {
      id: "m1",
      topic: "Calculus Integration",
      question: "Evaluate ∫ x²·eˣ dx",
      wrongAnswer: "x²eˣ - 2xeˣ",
      correctAnswer: "x²eˣ - 2xeˣ + 2eˣ + C",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "m2",
      topic: "Organic Chemistry",
      question: "What is the product of Friedel-Crafts acylation?",
      wrongAnswer: "Alkylbenzene",
      correctAnswer: "Aryl ketone",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  studyHoursPerDay: 4,
  currentLevel: "intermediate",
  preferredExplanationStyle: "analogies",
  totalQuizzesTaken: 28,
  averageAccuracy: 74,
  streakDays: 12,
  lastActiveAt: new Date().toISOString(),
  totalStudyMinutes: 4800,
  subjectsOfInterest: ["Mathematics", "Physics", "Chemistry", "Computer Science"],
};

export const mockTopicMastery: TopicMastery[] = [
  { topic: "Algebra", mastery: 92, questionsAttempted: 45, questionsCorrect: 41, lastPracticed: "2026-07-31", trend: "stable" },
  { topic: "Mechanics", mastery: 88, questionsAttempted: 38, questionsCorrect: 33, lastPracticed: "2026-07-30", trend: "improving" },
  { topic: "Data Structures", mastery: 85, questionsAttempted: 32, questionsCorrect: 27, lastPracticed: "2026-07-31", trend: "improving" },
  { topic: "Trigonometry", mastery: 78, questionsAttempted: 28, questionsCorrect: 22, lastPracticed: "2026-07-29", trend: "stable" },
  { topic: "Thermodynamics", mastery: 65, questionsAttempted: 22, questionsCorrect: 14, lastPracticed: "2026-07-28", trend: "improving" },
  { topic: "Electromagnetism", mastery: 45, questionsAttempted: 18, questionsCorrect: 8, lastPracticed: "2026-07-31", trend: "declining" },
  { topic: "Calculus Integration", mastery: 38, questionsAttempted: 25, questionsCorrect: 9, lastPracticed: "2026-07-31", trend: "improving" },
  { topic: "Organic Chemistry", mastery: 32, questionsAttempted: 20, questionsCorrect: 6, lastPracticed: "2026-07-30", trend: "declining" },
];

export const mockDailyActivity: DailyActivity[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    date: date.toISOString().split("T")[0],
    studyMinutes: Math.floor(Math.random() * 120) + 30,
    quizzesTaken: Math.floor(Math.random() * 4) + 1,
    questionsAnswered: Math.floor(Math.random() * 20) + 5,
    accuracy: Math.floor(Math.random() * 30) + 60,
  };
});

export const mockTodayPlan: StudySession[] = [
  { id: "s1", date: "2026-08-01", subject: "Mathematics", topic: "Calculus Integration", durationMinutes: 45, priority: "high", completed: true },
  { id: "s2", date: "2026-08-01", subject: "Physics", topic: "Electromagnetism", durationMinutes: 30, priority: "high", completed: false },
  { id: "s3", date: "2026-08-01", subject: "Chemistry", topic: "Organic Reactions", durationMinutes: 40, priority: "medium", completed: false },
  { id: "s4", date: "2026-08-01", subject: "Computer Science", topic: "Graph Algorithms", durationMinutes: 35, priority: "low", completed: false },
];

export const mockChatHistory: ChatMessage[] = [
  {
    id: "c1",
    role: "assistant",
    content: "Hello! I'm your AI Learning Twin. 🧠 I've analyzed your learning profile and I see you're working on strengthening your Calculus skills. What would you like to explore today?",
    timestamp: new Date(Date.now() - 300000).toISOString(),
  },
];

export const suggestedQuestions = [
  "Explain integration by parts with a real-world analogy",
  "Why do I keep making mistakes in organic chemistry reactions?",
  "Give me a quick quiz on electromagnetism",
  "Help me understand Kirchhoff's laws visually",
  "What topics should I focus on for my exam next week?",
];
