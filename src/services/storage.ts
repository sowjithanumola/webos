/**
 * Storage service with safe fallback for localStorage
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
} as const;

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[WebOS Storage] Failed to load key "${key}":`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[WebOS Storage] Failed to save key "${key}":`, err);
    return false;
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[WebOS Storage] Failed to remove key "${key}":`, err);
  }
}

export function clearAllWebOSData(): void {
  try {
    Object.values(StorageKeys).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (err) {
    console.error('[WebOS Storage] Failed to clear data:', err);
  }
}
