import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';
import Loader from '../ui/Loader';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        // Clear any stale session data on error
        await supabase.auth.signOut();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (!session?.user) {
          setUser(null);
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { user } = await getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Error refreshing user:', error);
      await handleSignOut();
    }
  };

  const value = {
    user,
    isLoading,
    signOut: handleSignOut,
    refreshUser,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading authentication..." />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Loading authentication..." />
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return <>{children}</>;
};