import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, firebaseStorage, CloudSyncStatus } from '../services/firebase';
import { fsService } from '../services/fsService';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isGuest: boolean;
  cloudStatus: CloudSyncStatus;
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

        // Upsert user profile & sync cloud files
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

  // Sync files from Firestore down to local virtual filesystem
  const syncUserFilesFromCloud = async (userId: string) => {
    try {
      const filesMap = await firebaseStorage.loadUserFiles(userId);
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
      console.warn('Failed to sync files from Firebase Firestore:', err);
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
      console.warn('Error signing out from Firebase:', err);
    }
    setUser(null);
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('webos_auth_mode', 'guest');
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
