import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, cloudStorage, CloudSyncStatus } from '../services/supabase';
import { fsService } from '../services/fsService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  cloudStatus: CloudSyncStatus;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: AuthError | null; user: User | null; session: Session | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfileName: (fullName: string) => Promise<{ error: AuthError | null }>;
  continueAsGuest: () => void;
  migrateGuestFilesToCloud: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('webos_auth_mode') === 'guest';
  });
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => {
    return cloudStorage.getStatus();
  });

  // Track initial auth state and subscription
  useEffect(() => {
    let mounted = true;

    // Subscribe to cloudStorage status updates
    const unsubscribeCloud = cloudStorage.subscribeStatus((status) => {
      if (mounted) {
        setCloudStatus(status);
      }
    });

    // Get current active session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error('Supabase getSession error:', error);
      }

      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        setIsGuest(false);
        localStorage.removeItem('webos_auth_mode');
      } else {
        const storedMode = localStorage.getItem('webos_auth_mode');
        if (storedMode === 'guest') {
          setIsGuest(true);
        }
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsGuest(false);
        localStorage.removeItem('webos_auth_mode');

        // Sync files on sign in
        if (event === 'SIGNED_IN') {
          try {
            await syncUserFilesFromCloud(currentSession.user.id);
          } catch (err) {
            console.error('Error syncing cloud files on sign-in:', err);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsGuest(true);
        localStorage.setItem('webos_auth_mode', 'guest');
      }
    });

    return () => {
      mounted = false;
      unsubscribeCloud();
      subscription.unsubscribe();
    };
  }, []);

  // Sync files from Supabase down to local virtual filesystem
  const syncUserFilesFromCloud = async (userId: string) => {
    try {
      const filesMap = await cloudStorage.loadUserFiles(userId);
      if (filesMap && Object.keys(filesMap).length > 0) {
        for (const file of Object.values(filesMap)) {
          try {
            const existing = fsService.getNodeByPath(file.path);
            if (!existing) {
              fsService.createFile(file.path, file.content || '', file.type);
            }
          } catch {
            // ignore individual conflict
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync files from cloud:', err);
    }
  };

  // User Actions
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setIsGuest(false);
      localStorage.removeItem('webos_auth_mode');
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim() || 'WebOS User',
        },
      },
    });

    if (error) {
      return {
        error,
        user: null,
        session: null,
        needsEmailConfirmation: false,
      };
    }

    const needsEmailConfirmation = Boolean(data.user && !data.session);

    if (data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      setIsGuest(false);
      localStorage.removeItem('webos_auth_mode');
    }

    return {
      error: null,
      user: data.user,
      session: data.session,
      needsEmailConfirmation,
    };
  };

  const resendConfirmationEmail = async (email: string) => {
    const cleanEmail = email.trim();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const updateProfileName = async (fullName: string) => {
    if (!user) return { error: null };
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    return { error };
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
  };

  const migrateGuestFilesToCloud = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const allNodes = fsService.getState().nodes;
    const migrated = await cloudStorage.migrateLocalFilesToCloud(user.id, allNodes);
    return migrated;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGuest,
        cloudStatus,
        signIn,
        signUp,
        signOut,
        resendConfirmationEmail,
        updatePassword,
        updateProfileName,
        continueAsGuest,
        migrateGuestFilesToCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
