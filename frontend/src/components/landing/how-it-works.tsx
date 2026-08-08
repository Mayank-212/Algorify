"use client";

import { motion } from "framer-motion";
import { BookOpen, Brain, BarChart3, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: BookOpen,
    title: "You Learn",
    description: "Chat with the AI tutor, take quizzes, and study at your pace.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "02",
    icon: Brain,
    title: "AI Observes",
    description: "Your Learning Twin tracks confidence, mistakes, style, and speed.",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "03",
    icon: Sparkles,
    title: "Twin Adapts",
    description: "Future explanations, quizzes, and plans are personalized for you.",
    color: "from-amber-500 to-orange-500",
  },
  {
    step: "04",
    icon: BarChart3,
    title: "You Excel",
    description: "Watch your mastery grow with data-driven insights and recommendations.",
    color: "from-emerald-500 to-teal-500",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-purple/5 to-transparent" />
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-accent-cyan uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
            The <span className="gradient-text">AI Learning Loop</span>
          </h2>
          <p className="text-text-muted max-w-xl mx-auto text-lg">
            A continuous cycle that makes you better with every session.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative"
            >
              <div className="glass-card p-6 h-full text-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-4 shadow-none`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-xs font-mono text-text-muted">STEP {s.step}</span>
                <h3 className="text-lg font-semibold mt-1 mb-2">{s.title}</h3>
                <p className="text-sm text-text-muted">{s.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 text-text-muted">→</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
