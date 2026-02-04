import { supabase } from "@/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("🔵 AuthContext: Auth state changed event:", event);
        console.log(
          "🔵 AuthContext: Current session after event:",
          currentSession ? "exists" : "null",
        );
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      },
    );

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("🔵 AuthContext: signOut called");
      console.log(
        "🔵 AuthContext: Current session before logout:",
        session ? "exists" : "null",
      );

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("🔵 AuthContext: Signout error from Supabase:", error);
        throw error;
      }

      console.log("🔵 AuthContext: Supabase signOut succeeded");

      // Force clear the local state immediately
      console.log("🔵 AuthContext: Clearing local session and user state");
      setSession(null);
      setUser(null);

      console.log("🔵 AuthContext: Session and user state cleared");
      console.log("🔵 AuthContext: Logout complete");
    } catch (err) {
      console.error("🔵 AuthContext: Error signing out:", err);
      // Even if there's an error, clear the local state
      setSession(null);
      setUser(null);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
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
