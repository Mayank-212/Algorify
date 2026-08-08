"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 animated-gradient opacity-20" />
          <div className="absolute inset-0 bg-bg-primary/60 backdrop-" />
          <div className="relative z-10 px-8 py-16 md:px-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mx-auto mb-6 shadow-none">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to meet your{" "}
              <span className="gradient-text">Learning Twin</span>?
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto mb-8">
              Join thousands of students who are learning smarter, not harder.
              Your personalized AI companion is waiting.
            </p>
            <Link href="/dashboard">
              <Button size="xl">
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border-primary py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-accent-purple" />
          <span className="font-bold text-lg">Algorify</span>
        </div>
        <p className="text-sm text-text-muted">
          © {new Date().getFullYear()} Algorify. Built with ❤️ for the future of education.
        </p>
        <div className="flex gap-6 text-sm text-text-muted">
          <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
