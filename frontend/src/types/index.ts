// ============================================
// AI Learning Twin - Core Type Definitions
// ============================================

export interface LearningTwin {
  id: string;
  userId: string;
  learningStyle: LearningStyle;
  confidence: number; // 0-100
  weakTopics: string[];
  strongTopics: string[];
  recentMistakes: Mistake[];
  studyHoursPerDay: number;
  currentLevel: Level;
  preferredExplanationStyle: ExplanationStyle;
  totalQuizzesTaken: number;
  averageAccuracy: number;
  streakDays: number;
  lastActiveAt: string;
  totalStudyMinutes: number;
  subjectsOfInterest: string[];
}

export type LearningStyle = 'visual' | 'verbal' | 'kinesthetic' | 'reading';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type ExplanationStyle = 'simple' | 'detailed' | 'analogies' | 'examples';

export interface Mistake {
  id: string;
  topic: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  misconception?: string;
  whyReasonable?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  answers: QuizAnswer[];
  recommendations: string[];
  timestamp: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

export interface StudyPlan {
  id: string;
  examDate: string;
  availableHoursPerDay: number;
  subjects: string[];
  schedule: StudySession[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface TopicMastery {
  topic: string;
  mastery: number; // 0-100
  questionsAttempted: number;
  questionsCorrect: number;
  lastPracticed: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface DailyActivity {
  date: string;
  studyMinutes: number;
  quizzesTaken: number;
  questionsAnswered: number;
  accuracy: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}
