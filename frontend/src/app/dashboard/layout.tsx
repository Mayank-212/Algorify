"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  FileQuestion,
  Calendar,
  BarChart3,
  Brain,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Moon,
  Sun,
  Library,
  PenTool,
  Settings,
  Trophy,
  Headphones,
  User
} from "lucide-react";
import { Avatar } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tutor", label: "Algorify Mentor", icon: MessageSquare },
  { href: "/dashboard/quiz", label: "Play Arena", icon: FileQuestion },
  { href: "/dashboard/space", label: "Learning Space", icon: Library },
  { href: "/dashboard/cowriter", label: "Co-Writer", icon: PenTool },
  { href: "/dashboard/planner", label: "Study Planner", icon: Calendar },
  { href: "/dashboard/focus", label: "Zen Mode", icon: Headphones },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/analytics", label: "Memory Engine", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("algorify_demo_mode") === "true") {
      setUser({ email: "demo@algorify.ai", user_metadata: { full_name: localStorage.getItem("algorify_demo_name") || "Demo User" }, id: "demo-123" });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-bg-tertiary z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-border-primary bg-bg-secondary/95 backdrop- transition-all duration-300",
          collapsed ? "lg:w-[72px]" : "lg:w-64",
          sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("h-16 flex items-center border-b border-border-primary px-4", collapsed ? "justify-center" : "gap-3")}>
          <img src="/logo.png" alt="Algorify Logo" className="w-8 h-8 rounded-lg shrink-0 border border-border-primary shadow-none" />
          {!collapsed && <span className="font-bold text-lg">Algorify</span>}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-text-muted hover:text-text-primary"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 mx-3 mb-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary/50 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>

        {/* User */}
        <div className={cn("border-t border-border-primary p-4 flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 rounded-full bg-bg-tertiary border border-border-primary flex items-center justify-center shrink-0 text-text-muted">
            <User className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || "Student"}</p>
              <p className="text-xs text-text-muted truncate">{user?.email || "Connected"}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => {
              if (localStorage.getItem("algorify_demo_mode") === "true") {
                localStorage.removeItem("algorify_demo_mode");
                router.push("/auth");
              } else {
                supabase.auth.signOut();
              }
            }} className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors" aria-label="Log out">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border-primary flex items-center px-4 lg:px-6 bg-bg-primary/80 backdrop- shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 text-text-muted hover:text-text-primary"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
