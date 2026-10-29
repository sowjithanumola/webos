import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, firebaseStorage, CloudSyncStatus } from '../services/firebase';
import { fsService } from '../services/fsService';
import { setStorageUserId } from '../services/storage';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isGuest: boolean;
  cloudStatus: CloudSyncStatus;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null; user?: FirebaseUser }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user?: FirebaseUser }>;
  signInWithGoogle: () => Promise<{ error: Error | null; user?: FirebaseUser }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  migrateGuestFilesToCloud: () => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('webos_auth_mode') === 'guest';
  });
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>(() => {
    return firebaseStorage.getStatus();
  });

  // Track initial auth state and subscription
  useEffect(() => {
    let mounted = true;

    // Subscribe to firebaseStorage status updates
    const unsubscribeCloud = firebaseStorage.subscribeStatus((status) => {
      if (mounted) {
        setCloudStatus(status);
      }
    });

    // Listen to Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;

      if (currentUser) {
        setUser(currentUser);
        setIsGuest(false);
        localStorage.removeItem('webos_auth_mode');

        // 1. Isolate storage key namespace to this specific user ID
        setStorageUserId(currentUser.uid);

        // 2. Switch filesystem tree to this specific user ID
        fsService.switchUser(currentUser.uid);

        // 3. Upsert user profile & sync cloud files from Firestore
        try {
          await firebaseStorage.upsertUserProfile(currentUser);
          await syncUserFilesFromCloud(currentUser.uid);
        } catch (err) {
          console.warn('Initial cloud sync error:', err);
        }
      } else {
        setUser(null);
        const storedMode = localStorage.getItem('webos_auth_mode');
        if (storedMode === 'guest') {
          setIsGuest(true);
          setStorageUserId('guest');
          fsService.switchUser('guest');
        } else {
          setIsGuest(false);
          setStorageUserId(null);
          fsService.switchUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribeCloud();
      unsubscribeAuth();
    };
  }, []);

  // Sync files from Firestore down to local virtual filesystem for the active user
  const syncUserFilesFromCloud = async (userId: string) => {
    try {
      const filesMap = await firebaseStorage.loadUserFiles(userId);
      if (filesMap && Object.keys(filesMap).length > 0) {
        fsService.syncCloudFiles(filesMap);
      }
    } catch (err) {
      console.warn('Failed to sync files from cloud storage:', err);
    }
  };

  // Sign In with Email & Password (Zero popups, 100% in-app)
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null; user?: FirebaseUser }> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      setUser(result.user);
      setIsGuest(false);
      localStorage.removeItem('webos_auth_mode');
      return { error: null, user: result.user };
    } catch (error) {
      console.error('Email Sign-in failed:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // Sign Up with Email & Password (Zero popups, 100% in-app)
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: Error | null; user?: FirebaseUser }> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (fullName.trim()) {
        await updateProfile(result.user, {
          displayName: fullName.trim(),
        });
      }
      setUser(result.user);
      setIsGuest(false);
      localStorage.removeItem('webos_auth_mode');
      return { error: null, user: result.user };
    } catch (error) {
      console.error('Email Sign-up failed:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  // Sign In with Google via Popup
  const signInWithGoogle = async (): Promise<{ error: Error | null; user?: FirebaseUser }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setIsGuest(false);
      localStorage.removeItem('webos_auth_mode');
      return { error: null, user: result.user };
    } catch (error) {
      console.error('Google Sign-in failed:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Error signing out:', err);
    }
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('webos_auth_mode');
    setStorageUserId(null);
    fsService.switchUser(null);
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
    setStorageUserId('guest');
    fsService.switchUser('guest');
  };

  const migrateGuestFilesToCloud = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    const allNodes = fsService.getState().nodes;
    const migrated = await firebaseStorage.migrateLocalFilesToCloud(user.uid, allNodes);
    return migrated;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        cloudStatus,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
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
