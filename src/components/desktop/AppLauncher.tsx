import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Pin,
  Lock,
  RotateCcw,
  Power,
  Settings,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_CATALOG } from '../../config/apps';
import { AppId } from '../../types/window';
import { AppIcon } from '../common/AppIcon';

export const AppLauncher: React.FC = () => {
  const {
    isLauncherOpen,
    toggleLauncher,
    openWindow,
    recentAppIds,
    pinnedAppIds,
    togglePinApp,
    lockOS,
    restartOS,
    shutDownOS,
    settings,
  } = useOS();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'productivity' | 'utilities' | 'system'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isLauncherOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isLauncherOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        launcherRef.current &&
        !launcherRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[title="Application Launcher (Alt+Space)"]')
      ) {
        toggleLauncher(false);
      }
    };

    if (isLauncherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLauncherOpen, toggleLauncher]);

  const filteredApps = useMemo(() => {
    return APP_CATALOG.filter((app) => {
      if (selectedCategory !== 'all' && app.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
    });
  }, [search, selectedCategory]);

  const recentApps = useMemo(() => {
    return recentAppIds
      .map((id) => APP_CATALOG.find((a) => a.id === id))
      .filter((a): a is typeof APP_CATALOG[0] => Boolean(a));
  }, [recentAppIds]);

  if (!isLauncherOpen) return null;

  return (
    <div
      ref={launcherRef}
      className="fixed bottom-16 left-1/2 -translate-x-1/2 w-[540px] max-w-[95vw] h-[520px] rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl z-50 flex flex-col overflow-hidden text-xs text-slate-200 select-none"
    >
      {/* Top Search Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2">
        <Search size={15} className="text-slate-400 ml-1" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search apps, tools and utilities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-xs select-text"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-[11px] text-slate-400 hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/80 bg-slate-950/30">
        {[
          { id: 'all', label: 'All Apps' },
          { id: 'productivity', label: 'Productivity' },
          { id: 'utilities', label: 'Utilities' },
          { id: 'system', label: 'System' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as typeof selectedCategory)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === tab.id
                ? 'bg-blue-600/25 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Apps View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Recents section if not searching */}
        {!search && recentApps.length > 0 && selectedCategory === 'all' && (
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Recently Opened
            </div>
            <div className="grid grid-cols-4 gap-2">
              {recentApps.slice(0, 4).map((app) => (
                <button
                  key={app.id}
                  onClick={() => openWindow(app.id)}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-800 hover:border-slate-700 transition-all text-left"
                >
                  <AppIcon id={app.id} size={18} className="text-blue-400" />
                  <span className="font-medium text-slate-200 truncate">{app.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All / Filtered Grid */}
        <div>
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {selectedCategory === 'all' ? 'All Applications' : `${selectedCategory} Tools`}
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-10 text-slate-500">No applications match your search.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredApps.map((app) => {
                const isPinned = pinnedAppIds.includes(app.id);
                return (
                  <div
                    key={app.id}
                    onClick={() => openWindow(app.id)}
                    className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-slate-700 hover:bg-slate-800/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <AppIcon id={app.id} size={18} className="text-blue-400" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 truncate">{app.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{app.description}</div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinApp(app.id);
                      }}
                      className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700 ${
                        isPinned ? 'text-amber-400 opacity-100' : 'text-slate-500'
                      }`}
                      title={isPinned ? 'Unpin from dock' : 'Pin to dock'}
                    >
                      <Pin size={12} className={isPinned ? 'fill-amber-400' : ''} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer with User & Power Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            style={{ backgroundColor: settings.profile.avatarColor }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs"
          >
            {settings.profile.name[0] || 'U'}
          </div>
          <div>
            <div className="font-semibold text-slate-200 text-xs">{settings.profile.name}</div>
            <div className="text-[10px] text-slate-400">WebOS Local Profile</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              toggleLauncher(false);
              openWindow('settings');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => {
              toggleLauncher(false);
              lockOS();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title="Lock Screen"
          >
            <Lock size={14} />
          </button>
          <button
            onClick={() => {
              toggleLauncher(false);
              restartOS();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Restart OS"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => {
              toggleLauncher(false);
              shutDownOS();
            }}
            className="p-1.5 rounded-lg hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
            title="Shut Down"
          >
            <Power size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
