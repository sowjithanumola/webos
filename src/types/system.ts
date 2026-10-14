export type ThemeMode = 'dark' | 'light';
export type WallpaperId = 'cosmos' | 'nordic' | 'obsidian' | 'cobalt' | 'sunset' | 'slate';
export type AccentColor = 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
export type DockPosition = 'bottom' | 'left' | 'right';
export type DockSize = 'sm' | 'md' | 'lg';
export type TimeFormat = '12h' | '24h';

export interface UserProfile {
  name: string;
  avatarColor: string; // hex or tailwind class
  avatarIcon: string;
}

export interface UserSettings {
  profile: UserProfile;
  theme: ThemeMode;
  wallpaper: WallpaperId;
  accentColor: AccentColor;
  dockPosition: DockPosition;
  dockSize: DockSize;
  dockAutoHide: boolean;
  timeFormat: TimeFormat;
  showSeconds: boolean;
  showDate: boolean;
  interfaceScale: number; // 90, 100, 110
  soundEffects: boolean;
  reducedMotion: boolean;
  nightLight: boolean;
  nightLightWarmth: number; // 0 to 100
  startupScreen: boolean; // Boot to lock screen vs directly to desktop
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  appId?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
}

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  color?: string;
  description?: string;
}

export interface WebOSBackup {
  version: string;
  exportedAt: number;
  settings: UserSettings;
  filesystem: {
    nodes: Record<string, unknown>;
    rootId: string;
  };
  notes?: unknown[];
  calendarEvents?: CalendarEventItem[];
}
