import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            'AUTH SESSION ERROR:',
            error.message
          );

          setSession(null);
        } else {
          setSession(data.session);
        }
      } catch (error) {
        console.error(
          'AUTH SESSION ERROR:',
          error
        );

        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    setLoading(true);

    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        'SIGN OUT ERROR:',
        error.message
      );
    }

    setSession(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}