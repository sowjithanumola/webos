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
  isRecoveryMode: boolean;
  recoveryError: string | null;
  setIsRecoveryMode: (mode: boolean) => void;
  setRecoveryError: (error: string | null) => void;
  clearRecoveryState: () => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfileName: (fullName: string) => Promise<{ error: AuthError | null }>;
  continueAsGuest: () => void;
  migrateGuestFilesToCloud: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper to inspect initial URL for recovery route, parameters, or errors
const inspectRecoveryFromUrl = (): { isRecovery: boolean; error: string | null } => {
  if (typeof window === 'undefined') return { isRecovery: false, error: null };

  const pathname = window.location.pathname;
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(search);

  const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');
  const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
  const type = hashParams.get('type') || searchParams.get('type');

  const isResetRoute = pathname === '/reset-password' || pathname.endsWith('/reset-password') || pathname.includes('reset-password');
  const code = searchParams.get('code') || hashParams.get('code');
  const token = searchParams.get('token') || hashParams.get('token');
  const isRecoveryType =
    type === 'recovery' ||
    hash.includes('type=recovery') ||
    search.includes('type=recovery') ||
    hash.includes('access_token=') ||
    !!code ||
    !!token;

  let parsedError: string | null = null;
  if (errorDesc || errorCode) {
    if (errorCode === 'otp_expired') {
      parsedError = 'The password reset link has expired or has already been used. Please request a new link.';
    } else if (errorDesc) {
      parsedError = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
    } else {
      parsedError = 'This password reset link is invalid or expired. Please request a new link.';
    }

    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // ignore
    }
  }

  return {
    isRecovery: isResetRoute || isRecoveryType || !!parsedError,
    error: parsedError,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('webos_auth_mode') === 'guest';
  });
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('guest');

  // Recovery mode state
  const initialRecovery = inspectRecoveryFromUrl();
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(initialRecovery.isRecovery);
  const [recoveryError, setRecoveryError] = useState<string | null>(initialRecovery.error);

  // Sync cloud status
  useEffect(() => {
    const unsub = cloudStorage.subscribeStatus((status) => {
      setCloudStatus(status);
    });
    return unsub;
  }, []);

  // Initialize Supabase session and listen for auth changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: initSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('[Supabase Auth] Failed to fetch session:', error);
      }
      if (initSession) {
        setSession(initSession);
        setUser(initSession.user);
        setIsGuest(false);
        localStorage.removeItem('webos_auth_mode');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setRecoveryError(null);
      }

      setSession(newSession);
      setUser(newSession?.user || null);
      if (newSession?.user) {
        setIsGuest(false);
        localStorage.removeItem('webos_auth_mode');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearRecoveryState = useCallback(() => {
    setIsRecoveryMode(false);
    setRecoveryError(null);
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setIsGuest(false);
      localStorage.removeItem('webos_auth_mode');
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const cleanName = fullName.trim() || email.split('@')[0];
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (!error && data.user) {
      setUser(data.user);
      if (data.session) {
        setSession(data.session);
        setIsGuest(false);
        localStorage.removeItem('webos_auth_mode');
      }
    }

    return { error, user: data.user };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
  };

  const resetPassword = async (email: string) => {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    return { error };
  };

  const verifyRecoveryOtp = async (email: string, rawInput: string) => {
    let cleanToken = rawInput.trim();
    const cleanEmail = email.trim();

    // If user pasted a full URL (e.g. copied directly from the email link or address bar)
    if (
      cleanToken.startsWith('http://') ||
      cleanToken.startsWith('https://') ||
      cleanToken.includes('token=') ||
      cleanToken.includes('access_token=') ||
      cleanToken.includes('code=')
    ) {
      try {
        const urlStr = cleanToken.includes('://')
          ? cleanToken
          : `https://dummy.com/${cleanToken.startsWith('#') || cleanToken.startsWith('?') ? cleanToken : '?' + cleanToken}`;
        const parsed = new URL(urlStr);
        const searchP = new URLSearchParams(parsed.search);
        const hashP = new URLSearchParams(parsed.hash.replace(/^#/, ''));

        // Check for access_token in hash or query
        const accessToken = hashP.get('access_token') || searchP.get('access_token');
        const refreshToken = hashP.get('refresh_token') || searchP.get('refresh_token');
        if (accessToken) {
          const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (!sessionErr && sessionData.session) {
            setSession(sessionData.session);
            setUser(sessionData.user);
            setIsRecoveryMode(true);
            setRecoveryError(null);
            return { error: null };
          }
        }

        // Check for token, token_hash, or code
        const extracted =
          searchP.get('token') ||
          hashP.get('token') ||
          searchP.get('token_hash') ||
          hashP.get('token_hash') ||
          searchP.get('code');
        if (extracted) {
          cleanToken = extracted;
        }
      } catch {
        // Fall back to raw string
      }
    }

    // Method 1: Standard OTP with email (works for 6-digit codes and email tokens)
    let res = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'recovery',
    });

    // Method 2: If failed and token is a long hash (>10 chars), try token_hash directly
    if (res.error && cleanToken.length > 10) {
      const hashRes = await supabase.auth.verifyOtp({
        token_hash: cleanToken,
        type: 'recovery',
      });
      if (!hashRes.error && hashRes.data?.session) {
        res = hashRes;
      }
    }

    // Method 3: If token is a PKCE exchange code (>15 chars)
    if (res.error && cleanToken.length > 15) {
      try {
        const exchangeRes = await supabase.auth.exchangeCodeForSession(cleanToken);
        if (!exchangeRes.error && exchangeRes.data?.session) {
          setSession(exchangeRes.data.session);
          setUser(exchangeRes.data.user);
          setIsRecoveryMode(true);
          setRecoveryError(null);
          return { error: null };
        }
      } catch {
        // Continue with original error
      }
    }

    if (!res.error && res.data?.session) {
      setSession(res.data.session);
      setUser(res.data.user);
      setIsRecoveryMode(true);
      setRecoveryError(null);
    }
    return { error: res.error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (!error && data.user) {
      setUser(data.user);
    }
    return { error };
  };

  const updateProfileName = async (fullName: string) => {
    const cleanName = fullName.trim();
    const { data, error } = await supabase.auth.updateUser({
      data: {
        full_name: cleanName,
      },
    });
    if (!error && data.user) {
      setUser(data.user);
    }
    return { error };
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
  };

  const migrateGuestFilesToCloud = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const localNodes = fsService.getState().nodes;
    const migrated = await cloudStorage.migrateLocalFilesToCloud(user.id, localNodes);
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
        isRecoveryMode,
        recoveryError,
        setIsRecoveryMode,
        setRecoveryError,
        clearRecoveryState,
        signIn,
        signUp,
        signOut,
        resetPassword,
        verifyRecoveryOtp,
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
