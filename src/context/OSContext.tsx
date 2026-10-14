import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppId, WindowPosition, WindowSize, WindowState } from '../types/window';
import { APP_CATALOG } from '../config/apps';
import { UserSettings, SystemNotification, WebOSBackup } from '../types/system';
import { FileSystemState, FileType, VirtualFile, VirtualFolder } from '../types/fs';
import { fsService, INITIAL_FS } from '../services/fsService';
import { loadFromStorage, saveToStorage, StorageKeys, clearAllWebOSData } from '../services/storage';
import { sound } from '../services/soundService';

const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    name: 'Administrator',
    avatarColor: '#38bdf8',
    avatarIcon: 'User',
  },
  theme: 'dark',
  wallpaper: 'cosmos',
  accentColor: 'blue',
  dockPosition: 'bottom',
  dockSize: 'md',
  dockAutoHide: false,
  timeFormat: '12h',
  showSeconds: true,
  showDate: true,
  interfaceScale: 100,
  soundEffects: true,
  reducedMotion: false,
  nightLight: false,
  nightLightWarmth: 35,
  startupScreen: true,
};

interface OSContextType {
  // Window Management
  windows: WindowState[];
  activeWindowId: string | null;
  openWindow: (appId: AppId, options?: { title?: string; payload?: Record<string, unknown> }) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, pos: WindowPosition) => void;
  updateWindowSize: (id: string, size: WindowSize) => void;
  snapWindow: (id: string, edge: 'left' | 'right' | 'top') => void;

  // Filesystem
  fs: FileSystemState;
  createFolder: (parentId: string, name: string) => VirtualFolder;
  createFile: (parentId: string, name: string, content?: string, type?: FileType) => VirtualFile;
  updateFileContent: (fileId: string, content: string) => VirtualFile;
  renameFSNode: (nodeId: string, newName: string) => VirtualFile;
  deleteFSNode: (nodeId: string, permanent?: boolean) => boolean;
  restoreFromTrash: (nodeId: string) => boolean;
  emptyTrash: () => void;
  moveFSNode: (nodeId: string, newParentId: string) => boolean;
  duplicateFSNode: (nodeId: string) => VirtualFile;
  exportFSFile: (fileId: string) => void;

  // Settings
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetAllData: () => void;
  exportBackup: () => void;
  importBackup: (backup: WebOSBackup) => boolean;

  // Notifications
  notifications: SystemNotification[];
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', action?: { label: string; onClick: () => void }) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // System State & Lifecycle
  isBooted: boolean;
  isLocked: boolean;
  isShutDown: boolean;
  bootOS: () => void;
  lockOS: () => void;
  unlockOS: () => void;
  restartOS: () => void;
  shutDownOS: () => void;

  // Panels & Launchers
  isLauncherOpen: boolean;
  toggleLauncher: (open?: boolean) => void;
  isQuickSettingsOpen: boolean;
  toggleQuickSettings: (open?: boolean) => void;
  isNotificationCenterOpen: boolean;
  toggleNotificationCenter: (open?: boolean) => void;
  isWindowSwitcherOpen: boolean;
  setWindowSwitcherOpen: (open: boolean) => void;

  // Favorites & Recents
  recentAppIds: AppId[];
  pinnedAppIds: AppId[];
  togglePinApp: (appId: AppId) => void;
}

const OSContext = createContext<OSContextType | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadFromStorage<UserSettings>(StorageKeys.SETTINGS, DEFAULT_SETTINGS)
  );

  // Filesystem
  const [fs, setFs] = useState<FileSystemState>(() => fsService.getState());

  // Windows
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [highestZIndex, setHighestZIndex] = useState<number>(10);

  // Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif_welcome',
      title: 'Welcome to WebOS',
      message: 'Explore your virtual desktop, try the Terminal, or write a note.',
      timestamp: Date.now(),
      read: false,
      type: 'info',
    },
  ]);

  // System Lifecycle
  const [isBooted, setIsBooted] = useState<boolean>(() => !settings.startupScreen);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isShutDown, setIsShutDown] = useState<boolean>(false);

  // UI Panels
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [isWindowSwitcherOpen, setIsWindowSwitcherOpen] = useState<boolean>(false);

  // Recents and Pinned Apps
  const [recentAppIds, setRecentAppIds] = useState<AppId[]>(() =>
    loadFromStorage<AppId[]>(StorageKeys.RECENTS, ['file-manager', 'text-editor', 'terminal', 'notes'])
  );

  const [pinnedAppIds, setPinnedAppIds] = useState<AppId[]>(() =>
    APP_CATALOG.filter((a) => a.isPinnedDefault).map((a) => a.id)
  );

  // Persist settings
  useEffect(() => {
    saveToStorage(StorageKeys.SETTINGS, settings);
    sound.setMuted(!settings.soundEffects);
  }, [settings]);

  // Keep sound mute state synced
  useEffect(() => {
    sound.setMuted(!settings.soundEffects);
  }, [settings.soundEffects]);

  // Save recents
  const recordAppOpened = useCallback((appId: AppId) => {
    setRecentAppIds((prev) => {
      const filtered = prev.filter((id) => id !== appId);
      const updated = [appId, ...filtered].slice(0, 8);
      saveToStorage(StorageKeys.RECENTS, updated);
      return updated;
    });
  }, []);

  const addNotification = useCallback((
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    action?: { label: string; onClick: () => void }
  ) => {
    const newNotif: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      type,
      action,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    sound.playNotification();
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Window Management functions
  const activeWindowId = useMemo(() => {
    const visible = windows.filter((w) => !w.isMinimized);
    if (visible.length === 0) return null;
    const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
    return sorted[0].id;
  }, [windows]);

  const focusWindow = useCallback((id: string) => {
    setHighestZIndex((prevZ) => {
      const nextZ = prevZ + 1;
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            return { ...w, zIndex: nextZ, isFocused: true, isMinimized: false };
          }
          return { ...w, isFocused: false };
        })
      );
      return nextZ;
    });
  }, []);

  const openWindow = useCallback(
    (appId: AppId, options?: { title?: string; payload?: Record<string, unknown> }): string => {
      sound.playClick();
      recordAppOpened(appId);

      // Close launchers
      setIsLauncherOpen(false);

      const appDef = APP_CATALOG.find((a) => a.id === appId);
      if (!appDef) return '';

      // If already open (except when custom payload requested for different file), just focus it
      if (!options?.payload) {
        const existing = windows.find((w) => w.appId === appId);
        if (existing) {
          if (existing.isMinimized) {
            setWindows((prev) =>
              prev.map((w) => (w.id === existing.id ? { ...w, isMinimized: false } : w))
            );
          }
          focusWindow(existing.id);
          return existing.id;
        }
      }

      // Calculate cascade offset position
      const offset = (windows.length % 8) * 28;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      const initialWidth = Math.min(appDef.defaultSize.width, Math.max(340, viewportWidth - 40));
      const initialHeight = Math.min(appDef.defaultSize.height, Math.max(300, viewportHeight - 120));

      const initialX = Math.max(20, Math.min(60 + offset, viewportWidth - initialWidth - 20));
      const initialY = Math.max(50, Math.min(50 + offset, viewportHeight - initialHeight - 70));

      const newId = `win_${appId}_${Date.now()}`;
      const newZ = highestZIndex + 1;
      setHighestZIndex(newZ);

      const newWindow: WindowState = {
        id: newId,
        appId,
        title: options?.title || appDef.defaultTitle,
        icon: appDef.icon,
        position: { x: initialX, y: initialY },
        size: { width: initialWidth, height: initialHeight },
        minSize: appDef.minSize,
        isMinimized: false,
        isMaximized: false,
        isFocused: true,
        zIndex: newZ,
        payload: options?.payload,
      };

      setWindows((prev) => [...prev.map((w) => ({ ...w, isFocused: false })), newWindow]);
      return newId;
    },
    [windows, highestZIndex, focusWindow, recordAppOpened]
  );

  const closeWindow = useCallback((id: string) => {
    sound.playClick();
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    sound.playClick();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    sound.playClick();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const topBarHeight = 36;
    const dockHeight = 56;

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          // Restore
          return {
            ...w,
            isMaximized: false,
            position: w.previousPosition || { x: 80, y: 80 },
            size: w.previousSize || w.minSize,
          };
        } else {
          // Maximize
          return {
            ...w,
            isMaximized: true,
            previousPosition: { ...w.position },
            previousSize: { ...w.size },
            position: { x: 0, y: topBarHeight },
            size: {
              width: viewportWidth,
              height: Math.max(300, viewportHeight - topBarHeight - dockHeight),
            },
          };
        }
      })
    );
  }, []);

  const updateWindowPosition = useCallback((id: string, pos: WindowPosition) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: pos, isMaximized: false } : w))
    );
  }, []);

  const updateWindowSize = useCallback((id: string, size: WindowSize) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size, isMaximized: false } : w))
    );
  }, []);

  const snapWindow = useCallback((id: string, edge: 'left' | 'right' | 'top') => {
    sound.playClick();
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const topBarHeight = 36;
    const dockHeight = 56;
    const workHeight = Math.max(300, viewportHeight - topBarHeight - dockHeight);

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        if (edge === 'top') {
          return {
            ...w,
            isMaximized: true,
            previousPosition: w.isMaximized ? w.previousPosition : { ...w.position },
            previousSize: w.isMaximized ? w.previousSize : { ...w.size },
            position: { x: 0, y: topBarHeight },
            size: { width: viewportWidth, height: workHeight },
          };
        } else if (edge === 'left') {
          return {
            ...w,
            isMaximized: false,
            position: { x: 0, y: topBarHeight },
            size: { width: Math.floor(viewportWidth / 2), height: workHeight },
          };
        } else {
          return {
            ...w,
            isMaximized: false,
            position: { x: Math.floor(viewportWidth / 2), y: topBarHeight },
            size: { width: Math.ceil(viewportWidth / 2), height: workHeight },
          };
        }
      })
    );
  }, []);

  // Filesystem methods
  const refreshFS = useCallback(() => {
    setFs({ ...fsService.getState() });
  }, []);

  const createFolder = useCallback((parentId: string, name: string) => {
    const res = fsService.createFolder(parentId, name);
    refreshFS();
    return res;
  }, [refreshFS]);

  const createFile = useCallback((parentId: string, name: string, content?: string, type?: FileType) => {
    const res = fsService.createFile(parentId, name, content, type);
    refreshFS();
    return res;
  }, [refreshFS]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    const res = fsService.updateContent(fileId, content);
    refreshFS();
    return res;
  }, [refreshFS]);

  const renameFSNode = useCallback((nodeId: string, newName: string) => {
    const res = fsService.rename(nodeId, newName);
    refreshFS();
    return res;
  }, [refreshFS]);

  const deleteFSNode = useCallback((nodeId: string, permanent: boolean = false) => {
    const res = fsService.deleteNode(nodeId, permanent);
    refreshFS();
    return res;
  }, [refreshFS]);

  const restoreFromTrash = useCallback((nodeId: string) => {
    const res = fsService.restoreFromTrash(nodeId);
    refreshFS();
    return res;
  }, [refreshFS]);

  const emptyTrash = useCallback(() => {
    fsService.emptyTrash();
    refreshFS();
  }, [refreshFS]);

  const moveFSNode = useCallback((nodeId: string, newParentId: string) => {
    const res = fsService.moveNode(nodeId, newParentId);
    refreshFS();
    return res;
  }, [refreshFS]);

  const duplicateFSNode = useCallback((nodeId: string) => {
    const res = fsService.duplicateNode(nodeId);
    refreshFS();
    return res;
  }, [refreshFS]);

  const exportFSFile = useCallback((fileId: string) => {
    fsService.exportFile(fileId);
  }, []);

  // Settings
  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetAllData = useCallback(() => {
    clearAllWebOSData();
    fsService.resetToFactory();
    setFs(JSON.parse(JSON.stringify(INITIAL_FS)));
    setSettings(DEFAULT_SETTINGS);
    setWindows([]);
    setNotifications([
      {
        id: 'notif_reset',
        title: 'WebOS Factory Reset Complete',
        message: 'All settings and virtual filesystem data have been reset to default.',
        timestamp: Date.now(),
        read: false,
        type: 'info',
      },
    ]);
    sound.playNotification();
  }, []);

  const exportBackup = useCallback(() => {
    const backup: WebOSBackup = {
      version: '1.0.0',
      exportedAt: Date.now(),
      settings,
      filesystem: fsService.getState(),
      notes: loadFromStorage(StorageKeys.NOTES, []),
      calendarEvents: loadFromStorage(StorageKeys.CALENDAR, []),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification('Backup Exported', 'WebOS backup saved to your local computer.', 'success');
  }, [settings, addNotification]);

  const importBackup = useCallback((backup: WebOSBackup): boolean => {
    if (!backup || !backup.version || !backup.filesystem || !backup.settings) {
      addNotification('Import Failed', 'The selected file is not a valid WebOS backup.', 'error');
      return false;
    }

    try {
      const fsSuccess = fsService.loadFromBackup(backup.filesystem as FileSystemState);
      if (!fsSuccess) {
        addNotification('Import Failed', 'Could not parse filesystem data.', 'error');
        return false;
      }

      setFs({ ...fsService.getState() });
      setSettings(backup.settings);
      if (backup.notes) saveToStorage(StorageKeys.NOTES, backup.notes);
      if (backup.calendarEvents) saveToStorage(StorageKeys.CALENDAR, backup.calendarEvents);

      addNotification('Backup Restored', 'System restored successfully from backup.', 'success');
      return true;
    } catch (err) {
      console.error('Import error:', err);
      addNotification('Import Error', 'Failed to restore backup.', 'error');
      return false;
    }
  }, [addNotification]);

  // System Lifecycle
  const bootOS = useCallback(() => {
    setIsBooted(true);
    setIsLocked(false);
    setIsShutDown(false);
    sound.playClick();
  }, []);

  const lockOS = useCallback(() => {
    setIsLocked(true);
    sound.playClick();
  }, []);

  const unlockOS = useCallback(() => {
    setIsLocked(false);
    sound.playClick();
  }, []);

  const restartOS = useCallback(() => {
    sound.playClick();
    setIsShutDown(true);
    setTimeout(() => {
      setWindows([]);
      setIsShutDown(false);
      setIsBooted(false);
      setIsLocked(false);
    }, 1200);
  }, []);

  const shutDownOS = useCallback(() => {
    sound.playClick();
    setWindows([]);
    setIsShutDown(true);
  }, []);

  // UI Panels toggles
  const toggleLauncher = useCallback((open?: boolean) => {
    sound.playClick();
    setIsLauncherOpen((prev) => (open !== undefined ? open : !prev));
    setIsQuickSettingsOpen(false);
    setIsNotificationCenterOpen(false);
  }, []);

  const toggleQuickSettings = useCallback((open?: boolean) => {
    sound.playClick();
    setIsQuickSettingsOpen((prev) => (open !== undefined ? open : !prev));
    setIsLauncherOpen(false);
    setIsNotificationCenterOpen(false);
  }, []);

  const toggleNotificationCenter = useCallback((open?: boolean) => {
    sound.playClick();
    setIsNotificationCenterOpen((prev) => (open !== undefined ? open : !prev));
    setIsLauncherOpen(false);
    setIsQuickSettingsOpen(false);
  }, []);

  const togglePinApp = useCallback((appId: AppId) => {
    setPinnedAppIds((prev) => {
      if (prev.includes(appId)) {
        return prev.filter((id) => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes open overlays
      if (e.key === 'Escape') {
        setIsLauncherOpen(false);
        setIsQuickSettingsOpen(false);
        setIsNotificationCenterOpen(false);
        setIsWindowSwitcherOpen(false);
      }

      // Alt+Space to toggle App Launcher
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        toggleLauncher();
      }

      // Alt+Tab for Window Switcher
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        setIsWindowSwitcherOpen(true);
      }

      // Ctrl+W or Alt+W to close active window
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        // Only if not in a standard browser input
        if (activeWindowId) {
          e.preventDefault();
          closeWindow(activeWindowId);
        }
      }

      // Ctrl+M to minimize active window
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        if (activeWindowId) {
          e.preventDefault();
          minimizeWindow(activeWindowId);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsWindowSwitcherOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeWindowId, closeWindow, minimizeWindow, toggleLauncher]);

  const value: OSContextType = {
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    snapWindow,

    fs,
    createFolder,
    createFile,
    updateFileContent,
    renameFSNode,
    deleteFSNode,
    restoreFromTrash,
    emptyTrash,
    moveFSNode,
    duplicateFSNode,
    exportFSFile,

    settings,
    updateSettings,
    resetAllData,
    exportBackup,
    importBackup,

    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,

    isBooted,
    isLocked,
    isShutDown,
    bootOS,
    lockOS,
    unlockOS,
    restartOS,
    shutDownOS,

    isLauncherOpen,
    toggleLauncher,
    isQuickSettingsOpen,
    toggleQuickSettings,
    isNotificationCenterOpen,
    toggleNotificationCenter,
    isWindowSwitcherOpen,
    setWindowSwitcherOpen: setIsWindowSwitcherOpen,

    recentAppIds,
    pinnedAppIds,
    togglePinApp,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
};

export const useOS = (): OSContextType => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
