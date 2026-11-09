import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Clock, LogOut, RefreshCw } from "lucide-react";

/**
 * Renders a full-screen overlay warning the user their session is about to expire.
 * Consumed by App.tsx — shown whenever `showSessionWarning` is true in AuthContext.
 */
export function SessionWarningModal() {
  const { showSessionWarning, sessionWarningSecondsLeft, extendSession, logout } = useAuth();

  if (!showSessionWarning) return null;

  const minutes = Math.floor(sessionWarningSecondsLeft / 60);
  const seconds = sessionWarningSecondsLeft % 60;
  const timeStr = minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, "0")}`
    : `${seconds}s`;

  // Colour shifts to red as time runs out
  const urgent = sessionWarningSecondsLeft <= 30;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 flex flex-col items-center gap-3 text-center ${urgent ? "bg-red-50" : "bg-amber-50"}`}>
          <div className={`p-3 rounded-full ${urgent ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle className={`h-6 w-6 ${urgent ? "text-red-600" : "text-amber-600"}`} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Session Expiring Soon</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              You've been inactive. Your session will end automatically.
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="px-6 py-5 flex flex-col items-center gap-4">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-xl font-mono text-3xl font-extrabold tracking-widest
            ${urgent ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
            <Clock className="h-6 w-6 flex-shrink-0" />
            {timeStr}
          </div>

          <p className="text-xs text-slate-400 text-center">
            Click <span className="font-semibold text-slate-600">Stay Logged In</span> to continue your session,
            or you will be logged out automatically.
          </p>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={extendSession}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Stay Logged In
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
