import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  user: any | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any | null }>;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Listener primeiro, apenas atualizações síncronas
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Evitar deadlocks: adiar chamadas ao Supabase
      if (event === 'SIGNED_IN' && session?.user) {
        setTimeout(() => {
          supabase.functions
            .invoke('check-subscription')
            .catch((error) => {
              console.error('Error checking subscription after login:', error);
            });
        }, 0);
      }
    });

    // 2) Depois verificar sessão existente
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName }
        }
      });

      if (error) {
        toast.error("Erro ao criar conta "+ error.message);
        return { error };
      }

      toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      return { error: null };
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao criar conta.');
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    const resp = await supabase.auth.signInWithPassword({ email, password });
    if (resp.error) toast.error(resp.error.message);
    return { error: resp.error ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
