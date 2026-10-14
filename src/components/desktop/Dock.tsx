import React, { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_CATALOG } from '../../config/apps';
import { AppId } from '../../types/window';
import { AppIcon } from '../common/AppIcon';

export const Dock: React.FC = () => {
  const {
    windows,
    openWindow,
    focusWindow,
    minimizeWindow,
    pinnedAppIds,
    toggleLauncher,
    isLauncherOpen,
    settings,
  } = useOS();

  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);

  // Combine pinned apps and running apps
  const runningAppIds = windows.map((w) => w.appId);
  const allDockAppIds = Array.from(new Set([...pinnedAppIds, ...runningAppIds])) as AppId[];

  const handleAppClick = (appId: AppId) => {
    const existingWindow = windows.find((w) => w.appId === appId);
    if (!existingWindow) {
      openWindow(appId);
    } else {
      if (existingWindow.isMinimized) {
        focusWindow(existingWindow.id);
      } else if (existingWindow.isFocused) {
        minimizeWindow(existingWindow.id);
      } else {
        focusWindow(existingWindow.id);
      }
    }
  };

  const isLight = settings.theme === 'light';
  const pos = settings.dockPosition;
  const isHorizontal = pos === 'bottom';

  // Size styles
  const iconSize = settings.dockSize === 'sm' ? 18 : settings.dockSize === 'lg' ? 26 : 22;
  const buttonPadding = settings.dockSize === 'sm' ? 'p-1.5' : settings.dockSize === 'lg' ? 'p-2.5' : 'p-2';

  // Position wrapper styles
  const positionClasses = {
    bottom: 'bottom-2 left-1/2 -translate-x-1/2 flex-row',
    left: 'left-2 top-1/2 -translate-y-1/2 flex-col',
    right: 'right-2 top-1/2 -translate-y-1/2 flex-col',
  }[pos];

  return (
    <div
      className={`fixed ${positionClasses} z-40 flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-200 select-none ${
        isLight ? 'glass-panel-dock-light' : 'glass-panel-dock'
      }`}
    >
      {/* App Launcher Button */}
      <button
        onClick={() => toggleLauncher()}
        onMouseEnter={() => setHoveredAppId('launcher')}
        onMouseLeave={() => setHoveredAppId(null)}
        className={`relative ${buttonPadding} rounded-xl hover:bg-white/20 transition-transform active:scale-95 group ${
          isLauncherOpen ? 'bg-blue-600/30 text-blue-400' : 'text-slate-200'
        }`}
        title="Application Launcher (Alt+Space)"
      >
        <LayoutGrid size={iconSize} />
        {hoveredAppId === 'launcher' && (
          <div
            className={`absolute ${
              isHorizontal ? '-top-8 left-1/2 -translate-x-1/2' : 'left-full ml-2 top-1/2 -translate-y-1/2'
            } px-2 py-0.5 rounded-md bg-slate-900/90 text-[11px] text-white border border-slate-700 shadow-lg whitespace-nowrap pointer-events-none`}
          >
            Applications
          </div>
        )}
      </button>

      {/* Divider */}
      <div
        className={`${
          isHorizontal ? 'w-px h-6 mx-0.5' : 'h-px w-6 my-0.5'
        } ${isLight ? 'bg-slate-300' : 'bg-slate-700/60'}`}
      />

      {/* Dock Apps */}
      {allDockAppIds.map((appId) => {
        const appDef = APP_CATALOG.find((a) => a.id === appId);
        if (!appDef) return null;

        const isRunning = runningAppIds.includes(appId);
        const activeWin = windows.find((w) => w.appId === appId && w.isFocused && !w.isMinimized);

        return (
          <button
            key={appId}
            onClick={() => handleAppClick(appId)}
            onMouseEnter={() => setHoveredAppId(appId)}
            onMouseLeave={() => setHoveredAppId(null)}
            className={`relative ${buttonPadding} rounded-xl hover:bg-white/20 transition-all active:scale-90 flex flex-col items-center justify-center ${
              activeWin ? 'bg-white/15' : ''
            }`}
          >
            <AppIcon id={appId} size={iconSize} className="text-slate-100 drop-shadow" />

            {/* Running Indicator Dot */}
            {isRunning && (
              <span
                className={`absolute ${
                  isHorizontal ? 'bottom-0.5' : 'right-0.5'
                } w-1 h-1 rounded-full bg-blue-400 shadow-sm`}
              />
            )}

            {/* Tooltip */}
            {hoveredAppId === appId && (
              <div
                className={`absolute ${
                  isHorizontal ? '-top-8 left-1/2 -translate-x-1/2' : 'left-full ml-2 top-1/2 -translate-y-1/2'
                } px-2 py-0.5 rounded-md bg-slate-900/95 text-[11px] text-white border border-slate-700 shadow-lg whitespace-nowrap pointer-events-none z-50`}
              >
                {appDef.name}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
