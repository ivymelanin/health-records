
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

export type UserRole =
  | 'admin'
  | 'healthcare_worker'
  | null;

type AuthContextType = {
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [role, setRole] =
    useState<UserRole>(null);

  const [loading, setLoading] =
    useState(true);

  const loadProfile = async (
    currentSession: Session | null
  ) => {
    if (!currentSession?.user) {
      setRole(null);
      return;
    }

    try {
      const { data, error } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .maybeSingle();

      if (error) {
        console.error(
          'PROFILE ROLE ERROR:',
          error.message
        );

        setRole(null);
        return;
      }

      if (!data) {
        console.warn(
          'No profile found for user:',
          currentSession.user.id
        );

        setRole(null);
        return;
      }

      const userRole = data.role;

      if (
        userRole === 'admin' ||
        userRole === 'healthcare_worker'
      ) {
        setRole(userRole);
      } else {
        console.warn(
          'Unknown user role:',
          userRole
        );

        setRole(null);
      }
    } catch (error) {
      console.error(
        'LOAD PROFILE ERROR:',
        error
      );

      setRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            'GET SESSION ERROR:',
            error.message
          );

          setSession(null);
          setRole(null);
          return;
        }

        console.log(
          'INITIAL SESSION:',
          !!data.session
        );

        setSession(data.session);

        await loadProfile(data.session);
      } catch (error) {
        console.error(
          'SESSION ERROR:',
          error
        );

        if (mounted) {
          setSession(null);
          setRole(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log(
          'AUTH EVENT:',
          event
        );

        console.log(
          'AUTH SESSION:',
          !!newSession
        );

        if (!mounted) return;

        setSession(newSession);

        if (newSession) {
          await loadProfile(newSession);
        } else {
          setRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const {
      error,
    } = await supabase.auth.signOut();

    if (error) {
      console.error(
        'SIGN OUT ERROR:',
        error.message
      );

      return;
    }

    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        role,
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

