import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, AlertCircle, Mail } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err: any) {
      setError(err?.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/login_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      {/* Content above overlay */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Branding block above the card */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/mwangaza_logo.png"
            alt="Mwangaza Logo"
            className="h-20 w-auto object-contain drop-shadow-lg"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight leading-tight drop-shadow-md">
              Information Management System
            </h1>
          </div>
        </div>

      {/* Dark glassmorphism card */}
      <div
        className="w-full rounded-2xl p-8 space-y-6"
        style={{
          background: "rgba(10, 20, 50, 0.65)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(56, 189, 248, 0.18)",
          boxShadow: "0 8px 48px 0 rgba(0,200,255,0.10), 0 2px 16px 0 rgba(0,0,0,0.5)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-sky-200">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-sky-300/50 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3)",
                }}
                onFocus={e => (e.target.style.border = "1px solid rgba(56,189,248,0.7)")}
                onBlur={e => (e.target.style.border = "1px solid rgba(56,189,248,0.25)")}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-sky-200">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-sky-400" />
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-sky-300/50 outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.3)",
                }}
                onFocus={e => (e.target.style.border = "1px solid rgba(56,189,248,0.7)")}
                onBlur={e => (e.target.style.border = "1px solid rgba(56,189,248,0.25)")}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-bold text-white tracking-wide transition-all duration-300 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)",
              boxShadow: "0 0 20px rgba(14,165,233,0.4), 0 2px 8px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={e => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 32px rgba(14,165,233,0.7), 0 2px 8px rgba(0,0,0,0.3)")}
            onMouseLeave={e => ((e.target as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(14,165,233,0.4), 0 2px 8px rgba(0,0,0,0.3)")}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
