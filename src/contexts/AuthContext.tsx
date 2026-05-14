import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "social_work" | "education" | "counselling" | "empowerment" | "aftercare" | "alumni";

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
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user role from database
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user role:', error);
      return null;
    }
    return data.role as UserRole;
  };

  // Fetch user profile
  const fetchUserProfile = async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data.username;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);

        if (session?.user) {
          // Defer fetching user data
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            const username = await fetchUserProfile(session.user.id);

            if (role && username) {
              setUser({
                id: session.user.id,
                username,
                role,
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        const username = await fetchUserProfile(session.user.id);

        if (role && username) {
          setUser({
            id: session.user.id,
            username,
            role,
          });
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const role = await fetchUserRole(data.user.id);
        const username = await fetchUserProfile(data.user.id);

        if (role && username) {
          setUser({
            id: data.user.id,
            username,
            role,
          });
          return { success: true };
        }

        return { success: false, error: "User role not found" };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Wait a bit for the session/trigger to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }

      return { success: false, error: "Sign up failed" };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signUp,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
