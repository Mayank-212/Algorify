"use client";

import { motion } from "framer-motion";
import { Brain, Target, BarChart3, BookOpen, Calendar, Zap, MessageSquare, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Learning Twin",
    description: "A digital profile that mirrors how you learn — tracking confidence, style, and pace in real time.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: MessageSquare,
    title: "Adaptive AI Tutor",
    description: "Get explanations tailored to your learning style. Simple, detailed, analogies — it knows what works for you.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Target,
    title: "Smart Quiz Engine",
    description: "Quizzes adapt to your weak spots and previous mistakes. Every question is personalized.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Calendar,
    title: "AI Study Planner",
    description: "Enter your exam date and available hours. Get a study schedule optimized for your needs.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Visualize mastery, track streaks, and identify improvement trends across all subjects.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    icon: Zap,
    title: "Real-Time Adaptation",
    description: "After every interaction, your Learning Twin updates — making future sessions even more effective.",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Features() {
  return (
    <section id="features" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-accent-purple uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            Everything you need to{" "}
            <span className="gradient-text">learn smarter</span>
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto text-lg">
            Not just another chatbot. A complete AI learning ecosystem that understands you.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="glass-card p-6 group"
            >
              <div className={`${feature.bg} ${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
