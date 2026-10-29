/**
 * Storage service with multi-tenant user isolation and safe fallback for localStorage
 */

export const StorageKeys = {
  SETTINGS: 'webos_settings_v1',
  FILESYSTEM: 'webos_filesystem_v1',
  NOTES: 'webos_notes_v1',
  CALENDAR: 'webos_calendar_v1',
  WINDOW_SESSIONS: 'webos_windows_v1',
  RECENTS: 'webos_recent_apps_v1',
  DESKTOP_ICONS: 'webos_desktop_icons_v1',
  BOOT_STATE: 'webos_boot_state_v1',
  DOCS_STUDIO: 'webos_docs_studio_draft_v1',
  CODE_STUDIO: 'webos_codestudio_active_project_v1',
} as const;

let currentUserId: string | null = null;

export function setStorageUserId(userId: string | null): void {
  currentUserId = userId || null;
}

export function getStorageUserId(): string | null {
  return currentUserId;
}

/**
 * Builds a user-scoped key so users on the same machine never collide or leak data.
 */
export function getUserStorageKey(baseKey: string, specificUserId?: string | null): string {
  const uid = specificUserId !== undefined ? specificUserId : currentUserId;
  if (!uid || uid === 'guest') {
    return `${baseKey}__guest`;
  }
  const cleanUid = uid.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${baseKey}__u_${cleanUid}`;
}

export function loadFromStorage<T>(key: string, defaultValue: T, specificUserId?: string | null): T {
  try {
    const scopedKey = getUserStorageKey(key, specificUserId);
    const raw = localStorage.getItem(scopedKey);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[WebOS Storage] Failed to load key "${key}":`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T, specificUserId?: string | null): boolean {
  try {
    const scopedKey = getUserStorageKey(key, specificUserId);
    localStorage.setItem(scopedKey, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[WebOS Storage] Failed to save key "${key}":`, err);
    return false;
  }
}

export function removeFromStorage(key: string, specificUserId?: string | null): void {
  try {
    const scopedKey = getUserStorageKey(key, specificUserId);
    localStorage.removeItem(scopedKey);
  } catch (err) {
    console.warn(`[WebOS Storage] Failed to remove key "${key}":`, err);
  }
}

export function clearUserStorage(userId?: string | null): void {
  try {
    const uid = userId !== undefined ? userId : currentUserId;
    const prefix = getUserStorageKey('', uid);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('[WebOS Storage] Failed to clear user storage:', err);
  }
}

export function clearAllWebOSData(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('webos_') || k.includes('__u_') || k.includes('__guest'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('[WebOS Storage] Failed to clear data:', err);
  }
}
