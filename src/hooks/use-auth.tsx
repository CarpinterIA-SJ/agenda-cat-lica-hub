import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAppRoles } from "@/hooks/use-app-roles";
import type { AppRole } from "@/integrations/supabase/types";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface SignInResult {
  error: AuthError | null;
}

export type UserRole = "organizer" | "participant" | "admin";

interface AuthContextType {
  user:             User | null;
  session:          Session | null;
  loading:          boolean;
  role:             UserRole | null;
  setRole:          (role: UserRole | null) => void;
  appRoles:         AppRole[];
  isSuperAdmin:     boolean;
  isPlatformAdmin:  boolean;
  rolesLoading:     boolean;
  refreshRoles:     () => Promise<void>;
  signIn:           (email: string, password: string) => Promise<SignInResult>;
  signUp:           (email: string, password: string, fullName?: string) => Promise<SignInResult>;
  signOut:          () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

// ─── Contexto ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user:             null,
  session:          null,
  loading:          true,
  role:             null,
  setRole:          () => {},
  appRoles:         [],
  isSuperAdmin:     false,
  isPlatformAdmin:  false,
  rolesLoading:     false,
  refreshRoles:     async () => {},
  signIn:           async () => ({ error: null }),
  signUp:           async () => ({ error: null }),
  signOut:          async () => {},
  signInWithGoogle: async () => {},
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState]  = useState<UserRole | null>(
    () => localStorage.getItem("user_role") as UserRole | null,
  );

  const {
    roles: appRoles,
    loading: rolesLoading,
    isSuperAdmin,
    isPlatformAdmin,
    refresh: refreshRoles,
  } = useAppRoles(user?.id ?? null);

  const setRole = (newRole: UserRole | null) => {
    setRoleState(newRole);
    if (newRole) localStorage.setItem("user_role", newRole);
    else         localStorage.removeItem("user_role");
  };

  useEffect(() => {
    // Resolve a sessão atual (incluindo tokens de redirecionamento OAuth)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (_event === "SIGNED_OUT") {
        setRoleState(null);
        localStorage.removeItem("user_role");
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Funções de autenticação ───────────────────────────────

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
  ): Promise<SignInResult> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? "" },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Inicia o fluxo OAuth com Google.
   * Após a autenticação o Supabase redireciona para /login,
   * onde a LoginPage detecta o provider e roteia adequadamente.
   */
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, loading, role, setRole,
        appRoles, isSuperAdmin, isPlatformAdmin, rolesLoading, refreshRoles,
        signIn, signUp, signOut, signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
