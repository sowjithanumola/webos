import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VirtualFile } from '../types/fs';

// Always use the active Supabase project credentials and ignore any stale deleted project env vars
export const SUPABASE_PROJECT_URL = 'https://jhgflaywnboxrpkmzjxk.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9Fi7FXHsI0amaTvnsMJ_Hw_GQQH2J24';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZ2ZsYXl3bmJveHJwa216anhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0ODU4MDYsImV4cCI6MjEwODA2MTgwNn0.cCmYutyx7M7AAgcEDt8XAiE-ValRHK0t3riqAwmhQHY';

export const supabase: SupabaseClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type CloudSyncStatus = 'offline' | 'guest' | 'syncing' | 'synced' | 'error';

export interface CloudFileRecord {
  id: string;
  user_id: string;
  name: string;
  type: string;
  path: string;
  parent_id: string;
  content?: string;
  size: number;
  is_system?: boolean;
  is_trash?: boolean;
  original_path?: string;
  created_at: string;
  updated_at: string;
}

export class CloudStorageService {
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

  // Upsert user profile in public.profiles table
  public async upsertUserProfile(userId: string, email: string, fullName: string): Promise<void> {
    if (!userId) return;
    try {
      await supabase.from('profiles').upsert(
        {
          id: userId,
          email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // Profile sync is best-effort if table not yet created
    }
  }

  // Load user files from Supabase Postgres
  public async loadUserFiles(userId: string): Promise<Record<string, VirtualFile> | null> {
    if (!userId) return null;
    this.setStatus('syncing');

    try {
      const { data, error } = await supabase
        .from('user_files')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('[Supabase Cloud] Error fetching user files:', error);
        this.setStatus('error');
        return null;
      }

      if (!data || data.length === 0) {
        this.setStatus('synced');
        return null;
      }

      const nodes: Record<string, VirtualFile> = {};
      data.forEach((row: CloudFileRecord) => {
        nodes[row.id] = {
          id: row.id,
          name: row.name,
          type: row.type as VirtualFile['type'],
          path: row.path,
          parentId: row.parent_id,
          content: row.content,
          size: row.size || 0,
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: new Date(row.updated_at).getTime(),
          isSystem: row.is_system,
          originalPath: row.original_path,
        };
      });

      this.setStatus('synced');
      return nodes;
    } catch (err) {
      console.error('[Supabase Cloud] Failed to load user files:', err);
      this.setStatus('error');
      return null;
    }
  }

  // Save/Upsert single file or folder to Supabase
  public async saveFileToCloud(userId: string, file: VirtualFile): Promise<boolean> {
    if (!userId) return false;
    this.setStatus('syncing');

    try {
      const record: Partial<CloudFileRecord> = {
        id: file.id,
        user_id: userId,
        name: file.name,
        type: file.type,
        path: file.path,
        parent_id: file.parentId,
        content: file.content || '',
        size: file.size || 0,
        is_system: file.isSystem || false,
        is_trash: file.parentId === 'folder_trash',
        original_path: file.originalPath || undefined,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_files')
        .upsert(record, { onConflict: 'id,user_id' });

      if (error) {
        console.warn('[Supabase Cloud] Upsert error:', error);
        this.setStatus('error');
        return false;
      }

      this.setStatus('synced');
      return true;
    } catch {
      this.setStatus('error');
      return false;
    }
  }

  // Delete file or folder from Supabase
  public async deleteFileFromCloud(userId: string, fileId: string): Promise<boolean> {
    if (!userId) return false;
    this.setStatus('syncing');

    try {
      const { error } = await supabase
        .from('user_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[Supabase Cloud] Delete error:', error);
        this.setStatus('error');
        return false;
      }

      this.setStatus('synced');
      return true;
    } catch {
      this.setStatus('error');
      return false;
    }
  }

  // Migrate all local guest files to signed-in user's Supabase account
  public async migrateLocalFilesToCloud(userId: string, localNodes: Record<string, VirtualFile>): Promise<number> {
    if (!userId || !localNodes) return 0;
    this.setStatus('syncing');

    try {
      const records = Object.values(localNodes).map((node) => ({
        id: node.id,
        user_id: userId,
        name: node.name,
        type: node.type,
        path: node.path,
        parent_id: node.parentId,
        content: node.content || '',
        size: node.size || 0,
        is_system: Boolean(node.isSystem),
        is_trash: node.parentId === 'folder_trash',
        original_path: node.originalPath || undefined,
        created_at: new Date(node.createdAt).toISOString(),
        updated_at: new Date(node.updatedAt).toISOString(),
      }));

      let migrated = 0;
      for (let i = 0; i < records.length; i += 50) {
        const chunk = records.slice(i, i + 50);
        const { error } = await supabase.from('user_files').upsert(chunk, { onConflict: 'id,user_id' });
        if (error) {
          console.error('[Supabase Cloud] Batch migration error:', error);
          this.setStatus('error');
          return migrated;
        }
        migrated += chunk.length;
      }

      this.setStatus('synced');
      return migrated;
    } catch (err) {
      console.error('[Supabase Cloud] Migration failed:', err);
      this.setStatus('error');
      return 0;
    }
  }
}

export const cloudStorage = new CloudStorageService();
