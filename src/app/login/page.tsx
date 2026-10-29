"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid username or password");
        setLoading(false);
        return;
      }

      // Successful login
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError("Connection error during sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Brand Card matching overall system UI */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl border border-slate-200 bg-white p-1 shadow-xs flex items-center justify-center">
            <img src="/logo.png" alt="JSS Enterprise Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="font-extrabold text-slate-900 text-lg tracking-wide leading-none uppercase">
            JSS ENTERPRISE
          </h1>
          <p className="text-slate-400 text-[10px] tracking-wider font-semibold uppercase mt-1">
            Precision | Power | Progress
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Admin Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access the billing portal
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            JSS Enterprise Billing Portal &bull; Precision &bull; Power &bull; Progress
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* ── TOP NAVIGATION ── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-slate-200 bg-white p-0.5 shadow-xs group-hover:border-amber-400 transition-colors">
                <img src="/logo.png" alt="JSS Enterprise Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-wide leading-none group-hover:text-amber-600 transition-colors">
                  JSS ENTERPRISE
                </h1>
                <p className="text-slate-400 text-[9px] sm:text-[10px] tracking-wider font-semibold mt-0.5 uppercase">
                  Precision | Power | Progress
                </p>
              </div>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── CENTER LOGIN FORM ── */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-slate-500 text-xs">Loading admin portal...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      {/* ── BOTTOM FOOTER ── */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} JSS Enterprise. All rights reserved.
      </footer>
    </div>
  );
}
