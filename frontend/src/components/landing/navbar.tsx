"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border-primary bg-bg-primary/80 backdrop-"
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Algorify</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">How It Works</a>
          <Link href="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-text-primary p-2" aria-label="Toggle menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border-primary bg-bg-primary/95 backdrop-"
        >
          <div className="px-4 py-4 flex flex-col gap-3">
            <a href="#features" className="text-sm text-text-muted py-2" onClick={() => setOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-sm text-text-muted py-2" onClick={() => setOpen(false)}>How It Works</a>
            <Link href="/login"><Button variant="ghost" size="sm" className="w-full justify-start">Log In</Button></Link>
            <Link href="/dashboard"><Button size="sm" className="w-full">Get Started</Button></Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
