import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

// ── Types ────────────────────────────────────────────────────────────────────

type UserRole =
  | "admin" | "social_work" | "education" | "counselling"
  | "empowerment" | "aftercare" | "alumni"
  | "intern_social_work" | "intern_counselling";

interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  extendSession: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  // Session warning state consumed by the modal
  showSessionWarning: boolean;
  sessionWarningSecondsLeft: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CACHED_USER_KEY = "cms_auth_user";

/** Milliseconds of inactivity before showing the warning */
const IDLE_TIMEOUT_MS = 28 * 60 * 1000;        // 28 minutes
/** Milliseconds after the warning before auto-logout */
const WARNING_DURATION_MS = 2 * 60 * 1000;      // 2 minutes
/** Events that count as user activity */
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
];

const getInitialCachedUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialUser = getInitialCachedUser();
  const [user, setUser]       = useState<AuthUser | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  // If we already have a cached user, we can start with loading = false for instantaneous 0ms rendering
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionWarningSecondsLeft, setSessionWarningSecondsLeft] = useState(120);

  const navigate = useNavigate();

  // Refs so callbacks don't close over stale state
  const idleTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const userRef         = useRef<AuthUser | null>(null);
  userRef.current = user;

  // Track in-flight buildUser promises to prevent redundant duplicate queries
  const inFlightBuildRef = useRef<Promise<AuthUser | null> | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !data) return null;
      return data.role as UserRole;
    } catch {
      return null;
    }
  };

  const fetchUserProfile = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle();
      if (error || !data) return null;
      return data.username;
    } catch {
      return null;
    }
  };

  const buildUser = async (userObjOrId: any): Promise<AuthUser | null> => {
    if (inFlightBuildRef.current) {
      return inFlightBuildRef.current;
    }

    const run = async (): Promise<AuthUser | null> => {
      try {
        const userId = typeof userObjOrId === 'string' ? userObjOrId : userObjOrId?.id;
        if (!userId) return null;

        const userObj = typeof userObjOrId === 'object' ? userObjOrId : null;

        // 1. Fast path: try the single unified RPC function (1 roundtrip instead of 2)
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc("get_current_user_profile");
          if (!rpcError && rpcData && rpcData.role) {
            const authUser: AuthUser = {
              id: rpcData.id || userId,
              username: rpcData.username || userObj?.user_metadata?.username || userObj?.email || "User",
              role: rpcData.role as UserRole,
            };
            localStorage.setItem(CACHED_USER_KEY, JSON.stringify(authUser));
            return authUser;
          }
        } catch {
          // Fallback to table queries below
        }

        // 2. Parallel fallback queries
        const [role, username] = await Promise.all([
          fetchUserRole(userId),
          fetchUserProfile(userId),
        ]);

        const resolvedRole = role || userObj?.user_metadata?.role || "social_work";
        const resolvedUsername = username || userObj?.user_metadata?.username || userObj?.email || "User";

        const authUser: AuthUser = {
          id: userId,
          username: resolvedUsername,
          role: resolvedRole as UserRole,
        };

        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(authUser));
        return authUser;
      } catch (err) {
        console.warn("Failed to build user profile:", err);
        if (userObjOrId && typeof userObjOrId === 'object' && userObjOrId.id) {
          const fallbackUser: AuthUser = {
            id: userObjOrId.id,
            username: userObjOrId.user_metadata?.username || userObjOrId.email || "User",
            role: (userObjOrId.user_metadata?.role as UserRole) || "social_work",
          };
          localStorage.setItem(CACHED_USER_KEY, JSON.stringify(fallbackUser));
          return fallbackUser;
        }
        return null;
      }
    };

    inFlightBuildRef.current = run().finally(() => {
      inFlightBuildRef.current = null;
    });

    return inFlightBuildRef.current;
  };

  // ── Idle / warning timer ────────────────────────────────────────────────────

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current)    clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current)    clearInterval(countdownRef.current);
  }, []);

  const doLogout = useCallback(async () => {
    clearAllTimers();
    setShowSessionWarning(false);
    localStorage.removeItem(CACHED_USER_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    navigate("/login");
  }, [clearAllTimers, navigate]);

  /** Start / restart the idle countdown from scratch */
  const resetIdleTimer = useCallback(() => {
    // Only run when there is an active user
    if (!userRef.current) return;

    clearAllTimers();
    setShowSessionWarning(false);

    idleTimerRef.current = setTimeout(() => {
      // Show warning — start countdown
      setShowSessionWarning(true);
      setSessionWarningSecondsLeft(WARNING_DURATION_MS / 1000);

      countdownRef.current = setInterval(() => {
        setSessionWarningSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      warningTimerRef.current = setTimeout(() => {
        doLogout();
      }, WARNING_DURATION_MS);
    }, IDLE_TIMEOUT_MS);
  }, [clearAllTimers, doLogout]);

  /** Called by the "Stay logged in" button in the modal */
  const extendSession = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  // ── Activity listeners ──────────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => resetIdleTimer();
    ACTIVITY_EVENTS.forEach(e => document.addEventListener(e, handler, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach(e => document.removeEventListener(e, handler));
  }, [resetIdleTimer]);

  // ── Auth state ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: Never leave user stuck on blank loading screen if network stalls
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 1200);

    // Subscribe to auth state changes (handles INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      try {
        if (newSession?.user) {
          const built = await buildUser(newSession.user);
          if (isMounted) {
            setUser(built);
            if (built) resetIdleTimer();
          }
        } else {
          setUser(null);
          localStorage.removeItem(CACHED_USER_KEY);
          clearAllTimers();
          setShowSessionWarning(false);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────────────

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };

      if (data.user) {
        const built = await buildUser(data.user);
        if (!built) return { success: false, error: "User role not found" };
        setUser(built);
        resetIdleTimer();
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    role: UserRole,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        await new Promise(r => setTimeout(r, 500));
        return { success: true };
      }
      return { success: false, error: "Sign up failed" };
    } catch {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await doLogout();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signUp,
        logout,
        extendSession,
        isAuthenticated: !!user,
        loading,
        showSessionWarning,
        sessionWarningSecondsLeft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
