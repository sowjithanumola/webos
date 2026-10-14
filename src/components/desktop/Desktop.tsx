import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { WALLPAPER_OPTIONS } from '../../config/wallpapers';
import { APP_CATALOG } from '../../config/apps';
import { AppId } from '../../types/window';
import { DesktopIcon } from './DesktopIcon';
import { ContextMenu } from './ContextMenu';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { WindowManager } from '../window/WindowManager';
import { AppLauncher } from './AppLauncher';
import { QuickSettingsPanel } from './QuickSettingsPanel';
import { NotificationCenter } from './NotificationCenter';
import { NotificationToastStack } from './NotificationToastStack';
import { WindowSwitcher } from './WindowSwitcher';

export const Desktop: React.FC = () => {
  const {
    settings,
    openWindow,
    toggleLauncher,
    toggleQuickSettings,
    toggleNotificationCenter,
  } = useOS();

  // Desktop selection state
  const [selectedAppId, setSelectedAppId] = useState<AppId | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const activeWallpaper =
    WALLPAPER_OPTIONS.find((wp) => wp.id === settings.wallpaper) || WALLPAPER_OPTIONS[0];

  const handleDesktopClick = () => {
    setSelectedAppId(null);
    if (contextMenu.isOpen) {
      setContextMenu({ isOpen: false, x: 0, y: 0 });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Apps to display as desktop shortcuts
  const desktopApps = APP_CATALOG;

  return (
    <div
      onClick={handleDesktopClick}
      onContextMenu={handleContextMenu}
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${activeWallpaper.className}`}
    >
      {/* Night Light Warm Screen Filter Overlay */}
      {settings.nightLight && (
        <div
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            pointerEvents: 'none',
          }}
          className="fixed inset-0 z-50 mix-blend-color-burn"
        />
      )}

      {/* Top Bar */}
      <TopBar />

      {/* Desktop Workspace Stage */}
      <main className="relative w-full h-[calc(100vh-36px)] overflow-hidden">
        {/* Desktop Icons Grid */}
        <div className="p-4 grid grid-flow-col auto-cols-max grid-rows-6 gap-3 z-0 w-fit pointer-events-auto">
          {desktopApps.map((app) => (
            <DesktopIcon
              key={app.id}
              id={app.id}
              name={app.name}
              isSelected={selectedAppId === app.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAppId(app.id);
              }}
              onDoubleClick={() => openWindow(app.id)}
              onContextMenu={(e) => {
                e.stopPropagation();
                handleContextMenu(e);
              }}
            />
          ))}
        </div>

        {/* Windows Layer */}
        <WindowManager />
      </main>

      {/* Dock */}
      <Dock />

      {/* Floating System Panels & Drawers */}
      <AppLauncher />
      <QuickSettingsPanel />
      <NotificationCenter />
      <NotificationToastStack />
      <WindowSwitcher />

      {/* Right-Click Context Menu */}
      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        />
      )}
    </div>
  );
};
