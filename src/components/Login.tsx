"use client";

import { useState } from "react";
import { ShieldCheck, UserCircle2, ArrowRight, Lock, Zap, Eye, EyeOff } from "lucide-react";

interface LoginProps {
  onLogin: (role: "commander" | "staff" | "guest") => void;
}

export function Login({ onLogin }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<"commander" | "staff" | "guest" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Default credentials
  const credentials: Record<string, { email: string; password: string }> = {
    staff: { email: "staff@crisisync.com", password: "staff123" },
    commander: { email: "commander@crisisync.com", password: "commander123" }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Guest login - no credentials required
    if (selectedRole === "guest") {
      onLogin("guest");
      return;
    }

    // Staff and Commander require credentials
    if (selectedRole && selectedRole in credentials) {
      const required = credentials[selectedRole];
      if (email.trim() === required.email && password === required.password) {
        onLogin(selectedRole);
        setEmail("");
        setPassword("");
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Main Card */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl border border-zinc-700/50 rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-700">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)] animate-pulse">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Crisis Sync</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">Emergency Response Coordination System</p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mt-4"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-4">
              {/* Guest */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("guest");
                  setLoginError("");
                }}
                className={`group w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedRole === "guest"
                    ? "bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-400/60 text-indigo-50 shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                    : "bg-zinc-950/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === "guest" ? "bg-indigo-600/50" : "bg-zinc-800/50"
                  }`}>
                    <UserCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Guest Access</span>
                    <span className="text-xs opacity-70">No credentials required</span>
                  </div>
                </div>
                {selectedRole === "guest" && <ArrowRight className="w-5 h-5 text-indigo-400 animate-pulse" />}
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("staff");
                  setLoginError("");
                }}
                className={`group w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedRole === "staff"
                    ? "bg-gradient-to-r from-amber-950/60 to-orange-950/60 border-amber-400/60 text-amber-50 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : "bg-zinc-950/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === "staff" ? "bg-amber-600/50" : "bg-zinc-800/50"
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Staff Member</span>
                    <span className="text-xs opacity-70">Operational access</span>
                  </div>
                </div>
                {selectedRole === "staff" && <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />}
              </button>

              {/* Commander */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("commander");
                  setLoginError("");
                }}
                className={`group w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedRole === "commander"
                    ? "bg-gradient-to-r from-red-950/60 to-rose-950/60 border-red-400/60 text-red-50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                    : "bg-zinc-950/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    selectedRole === "commander" ? "bg-red-600/50" : "bg-zinc-800/50"
                  }`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold block">Commander</span>
                    <span className="text-xs opacity-70">Full system control</span>
                  </div>
                </div>
                {selectedRole === "commander" && <ArrowRight className="w-5 h-5 text-red-400 animate-pulse" />}
              </button>
            </div>

            {/* Credentials Form - Only for Staff/Commander */}
            {selectedRole && selectedRole !== "guest" && (
              <div className="space-y-4 pt-6 border-t border-zinc-800 animate-in slide-in-from-top-2">
                <h3 className="text-sm font-semibold text-zinc-300 text-center">Enter Your Credentials</h3>
                
                {/* Email Input */}
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    placeholder={credentials[selectedRole].email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all"
                  />
                  <p className="text-xs text-zinc-500 mt-1">💡 Demo: {credentials[selectedRole].email}</p>
                </div>

                {/* Password Input */}
                <div>
                  <label className="text-xs text-zinc-400 mb-2 block uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">💡 Demo: {credentials[selectedRole].password}</p>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm text-center">
                    {loginError}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedRole}
              className="w-full bg-gradient-to-r from-white to-zinc-200 text-black font-bold rounded-2xl py-4 hover:from-zinc-100 hover:to-zinc-300 transition-all duration-300 disabled:opacity-50 disabled:hover:from-white disabled:hover:to-zinc-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:transform-none"
            >
              <div className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                {selectedRole === "guest" ? "Enter as Guest" : "Access System"}
              </div>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">Secure • Encrypted • Monitored</p>
          </div>
        </div>
      </div>
    </div>
  );
}
