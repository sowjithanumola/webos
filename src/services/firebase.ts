import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { VirtualFile } from '../types/fs';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Infrastructure as mandated by Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection on Initial Startup
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or connection pending:', error.message);
      return false;
    }
    // Expected to fail with permission-denied or not-found for 'test/connection' which confirms server reached
    return true;
  }
}

// Initial connection test
testFirestoreConnection().catch(() => {});

export type CloudSyncStatus = 'offline' | 'guest' | 'syncing' | 'synced' | 'error';

export class FirebaseStorageService {
  private syncStatus: CloudSyncStatus = 'guest';
  private listeners: ((status: CloudSyncStatus) => void)[] = [];

  public getStatus(): CloudSyncStatus {
    return this.syncStatus;
  }

  public subscribeStatus(listener: (status: CloudSyncStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.syncStatus);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private setStatus(status: CloudSyncStatus) {
    this.syncStatus = status;
    this.listeners.forEach((l) => l(status));
  }

  // Upsert user profile
  public async upsertUserProfile(user: FirebaseUser): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      await setDoc(
        userRef,
        {
          id: user.uid,
          email: user.email || 'user@webos.virtual',
          fullName: user.displayName || 'WebOS User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Firebase Cloud] Upsert profile notice:', err);
      // Non-fatal if rules restrict or already exist
    }
  }

  // Load user files from Firestore subcollection: users/{userId}/files
  public async loadUserFiles(userId: string): Promise<Record<string, VirtualFile> | null> {
    if (!userId) return null;
    this.setStatus('syncing');
    const filesPath = `users/${userId}/files`;

    try {
      const filesCol = collection(db, 'users', userId, 'files');
      const snapshot = await getDocs(filesCol);

      if (snapshot.empty) {
        this.setStatus('synced');
        return null;
      }

      const nodes: Record<string, VirtualFile> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        nodes[data.id] = {
          id: data.id,
          name: data.name,
          type: data.type,
          path: data.path,
          parentId: data.parentId,
          content: data.content,
          size: data.size || 0,
          createdAt: new Date(data.createdAt).getTime(),
          updatedAt: new Date(data.updatedAt).getTime(),
          isSystem: data.isSystem || false,
          originalPath: data.originalPath,
        };
      });

      this.setStatus('synced');
      return nodes;
    } catch (err) {
      this.setStatus('error');
      handleFirestoreError(err, OperationType.LIST, filesPath);
    }
  }

  // Save single file to Firestore: users/{userId}/files/{fileId}
  public async saveFileToCloud(userId: string, file: VirtualFile): Promise<boolean> {
    if (!userId) return false;
    this.setStatus('syncing');
    const filePath = `users/${userId}/files/${file.id}`;

    try {
      const fileRef = doc(db, 'users', userId, 'files', file.id);
      await setDoc(fileRef, {
        id: file.id,
        userId,
        name: file.name,
        type: file.type,
        path: file.path,
        parentId: file.parentId,
        content: file.content || '',
        size: file.size || 0,
        isSystem: Boolean(file.isSystem),
        originalPath: file.originalPath || null,
        createdAt: new Date(file.createdAt).toISOString(),
        updatedAt: new Date(file.updatedAt).toISOString(),
      });

      this.setStatus('synced');
      return true;
    } catch (err) {
      this.setStatus('error');
      handleFirestoreError(err, OperationType.WRITE, filePath);
    }
  }

  // Delete file from Firestore: users/{userId}/files/{fileId}
  public async deleteFileFromCloud(userId: string, fileId: string): Promise<boolean> {
    if (!userId) return false;
    this.setStatus('syncing');
    const filePath = `users/${userId}/files/${fileId}`;

    try {
      const fileRef = doc(db, 'users', userId, 'files', fileId);
      await deleteDoc(fileRef);
      this.setStatus('synced');
      return true;
    } catch (err) {
      this.setStatus('error');
      handleFirestoreError(err, OperationType.DELETE, filePath);
    }
  }

  // Migrate local files to Firestore
  public async migrateLocalFilesToCloud(
    userId: string,
    localNodes: Record<string, VirtualFile>
  ): Promise<number> {
    if (!userId || !localNodes) return 0;
    this.setStatus('syncing');

    let migrated = 0;
    const filesToMigrate = Object.values(localNodes).filter(
      (node) => !node.isSystem && node.path.startsWith('/home/user')
    );

    for (const node of filesToMigrate) {
      try {
        const fileRef = doc(db, 'users', userId, 'files', node.id);
        await setDoc(fileRef, {
          id: node.id,
          userId,
          name: node.name,
          type: node.type,
          path: node.path,
          parentId: node.parentId,
          content: node.content || '',
          size: node.size || 0,
          isSystem: false,
          originalPath: node.originalPath || null,
          createdAt: new Date(node.createdAt).toISOString(),
          updatedAt: new Date(node.updatedAt).toISOString(),
        });
        migrated++;
      } catch (err) {
        console.warn(`[Firebase Cloud] Failed to migrate file ${node.name}:`, err);
      }
    }

    this.setStatus('synced');
    return migrated;
  }
}

export const firebaseStorage = new FirebaseStorageService();
