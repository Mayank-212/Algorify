"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Brain, ArrowRight, ShieldCheck, Mail, Lock, Loader2, AlertCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear out any stale session from localStorage to ensure clean state
    localStorage.removeItem("algorify_currentUser");
    // We can also sign out from Supabase just in case
    supabase.auth.signOut();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        
        // Success
        if (data.user) {
          localStorage.setItem("algorify_currentUser", data.user.id);
          router.push("/dashboard");
        }
      } else {
        if (!name) {
          setError("Please enter your name.");
          setIsLoading(false);
          return;
        }
        
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        });
        if (authError) throw authError;
        
        if (data.session) {
          localStorage.setItem("algorify_currentUser", data.user!.id);
          router.push("/dashboard");
        } else {
          // Fallback bypass for Hackathon / Rate Limits
          localStorage.setItem("algorify_demo_mode", "true");
          localStorage.setItem("algorify_demo_name", name || "Student");
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      console.warn("Auth Error, falling back to local demo mode:", err.message);
      localStorage.setItem("algorify_demo_mode", "true");
      localStorage.setItem("algorify_demo_name", name || "Demo User");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google Login.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-bg-secondary/80 backdrop-blur-3xl border border-border-primary rounded-[2rem] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative z-10">
        
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Algorify Logo" className="w-16 h-16 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-white/10" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">Algorify Network</h1>
          <p className="text-text-muted text-sm font-medium">
            {isLogin ? "Sign in to access your decentralized learning twin." : "Create your personalized learning identity."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full h-12 bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full h-12 bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 text-sm text-white placeholder-white/20 outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                required
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={!email || !password || isLoading}
            className="w-full h-12 mt-2 rounded-xl font-black uppercase tracking-widest text-xs bg-gradient-to-r from-accent-blue to-accent-purple hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer opacity-0 group-hover:opacity-100" />
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? "Authenticate" : "Create Identity")} 
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </span>
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Or continue with</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full h-12 rounded-xl font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-xs font-bold text-text-muted hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-emerald-500/70 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Powered by Supabase Auth
        </div>

      </div>
    </div>
  );
}
