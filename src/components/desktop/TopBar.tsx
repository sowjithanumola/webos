import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Sliders,
  Power,
  RotateCcw,
  Lock,
  Info,
  Settings,
  HelpCircle,
  Command,
  Cloud,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { useAuth } from '../../context/AuthContext';

export const TopBar: React.FC = () => {
  const {
    settings,
    windows,
    activeWindowId,
    openWindow,
    lockOS,
    restartOS,
    shutDownOS,
    toggleLauncher,
    toggleQuickSettings,
    toggleNotificationCenter,
    notifications,
  } = useOS();
  const { user } = useAuth();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState<boolean>(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);

  const systemMenuRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const is12 = settings.timeFormat === '12h';
      const timeFormatted = now.toLocaleTimeString(undefined, {
        hour12: is12,
        hour: 'numeric',
        minute: '2-digit',
        second: settings.showSeconds ? '2-digit' : undefined,
      });
      const dateFormatted = now.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      setTimeStr(timeFormatted);
      setDateStr(dateFormatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [settings.timeFormat, settings.showSeconds]);

  // Click outside listener for system dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (systemMenuRef.current && !systemMenuRef.current.contains(e.target as Node)) {
        setIsSystemMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeWindow = windows.find((w) => w.id === activeWindowId);
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const isLight = settings.theme === 'light';

  return (
    <>
      <header
        className={`h-9 px-3 flex items-center justify-between border-b text-xs select-none z-40 transition-colors ${
          isLight
            ? 'bg-slate-100/80 border-slate-300 text-slate-800 backdrop-blur-md'
            : 'bg-slate-950/75 border-white/10 text-slate-200 backdrop-blur-md'
        }`}
      >
        {/* Left: WebOS Logo & System Menu */}
        <div className="flex items-center gap-3">
          <div ref={systemMenuRef} className="relative">
            <button
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors font-bold text-slate-100 tracking-tight"
            >
              <div className="w-4 h-4 rounded bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-[10px]">
                W
              </div>
              <span>WebOS</span>
            </button>

            {/* System Dropdown Menu */}
            {isSystemMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-1 text-slate-200 divide-y divide-slate-800/80 z-50">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(false);
                      openWindow('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
                  >
                    <Info size={14} className="text-blue-400" />
                    <span>About WebOS</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(false);
                      openWindow('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
                  >
                    <Settings size={14} className="text-slate-400" />
                    <span>System Settings...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(false);
                      setShowShortcutsHelp(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
                  >
                    <HelpCircle size={14} className="text-emerald-400" />
                    <span>Keyboard Shortcuts</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(false);
                      lockOS();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
                  >
                    <Lock size={14} className="text-amber-400" />
                    <span>Lock Screen</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(false);
                      restartOS();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
                  >
                    <RotateCcw size={14} className="text-slate-400" />
                    <span>Restart...</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSystemMenuOpen(false);
                      shutDownOS();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-600 hover:text-white transition-colors text-left text-rose-300"
                  >
                    <Power size={14} />
                    <span>Shut Down...</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Window Title (Clean single-line indicator) */}
          {activeWindow && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-slate-700/60 pl-3">
              <span className="font-semibold text-slate-200">{activeWindow.title}</span>
            </div>
          )}
        </div>

        {/* Right: Clock & Quick Settings */}
        <div className="flex items-center gap-1.5">
          {/* Cloud Status Indicator */}
          <button
            onClick={() => openWindow('settings')}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors text-[11px]"
            title={
              user
                ? `Cloud Account: ${user.displayName || user.email}`
                : 'Local Guest Mode (Click to manage Cloud)'
            }
          >
            <Cloud size={13} className={user ? 'text-emerald-400' : 'text-slate-500'} />
            <span className="hidden lg:inline text-slate-300 text-[10px] max-w-[120px] truncate">
              {user ? (user.displayName || user.email?.split('@')[0] || 'Cloud') : 'Guest'}
            </span>
          </button>

          {/* Notification Center Trigger */}
          <button
            onClick={() => toggleNotificationCenter()}
            className="relative p-1.5 rounded hover:bg-white/10 transition-colors text-slate-300"
            title="Notification Center"
          >
            <Bell size={14} />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>

          {/* Quick Settings Trigger */}
          <button
            onClick={() => toggleQuickSettings()}
            className="p-1.5 rounded hover:bg-white/10 transition-colors text-slate-300"
            title="Quick Settings"
          >
            <Sliders size={14} />
          </button>

          {/* Clock Widget Trigger */}
          <button
            onClick={() => openWindow('calendar')}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors font-mono tabular-nums text-slate-200"
            title="Open Calendar"
          >
            {settings.showDate && <span className="hidden md:inline text-slate-400">{dateStr}</span>}
            <span className="font-semibold">{timeStr}</span>
          </button>
        </div>
      </header>

      {/* Keyboard Shortcuts Dialog Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-96 p-5 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <Command size={16} className="text-blue-400" />
                <span>WebOS Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Application Launcher</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  Alt + Space
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Switch Windows</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  Alt + Tab
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Save (Editor / Notes)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  Ctrl + S
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Search in App</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  Ctrl + F
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Close Active Window</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  Ctrl + W
                </kbd>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Minimize Window</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px]">
                  Ctrl + M
                </kbd>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
