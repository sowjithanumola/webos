export type AppId =
  | 'file-manager'
  | 'notes'
  | 'calculator'
  | 'terminal'
  | 'text-editor'
  | 'settings'
  | 'clock'
  | 'calendar'
  | 'image-viewer'
  | 'media-player'
  | 'code-studio'
  | 'docs-studio';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: string; // unique window instance id
  appId: AppId;
  title: string;
  icon?: string;
  position: WindowPosition;
  size: WindowSize;
  minSize: WindowSize;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
  previousPosition?: WindowPosition;
  previousSize?: WindowSize;
  // Custom payload for app (e.g. opening a specific file)
  payload?: {
    fileId?: string;
    filePath?: string;
    [key: string]: unknown;
  };
}

export interface AppDefinition {
  id: AppId;
  name: string;
  description: string;
  icon: string;
  defaultTitle: string;
  defaultSize: WindowSize;
  minSize: WindowSize;
  category: 'productivity' | 'utilities' | 'system';
  isPinnedDefault?: boolean;
}
