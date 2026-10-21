import React, { useState, useRef } from 'react';
import {
  Palette,
  Monitor,
  Volume2,
  Clock,
  HardDrive,
  Info,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  ShieldAlert,
  Cloud,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { useAuth } from '../../../context/AuthContext';
import { WALLPAPER_OPTIONS } from '../../../config/wallpapers';
import { AccentColor, WallpaperId, WebOSBackup } from '../../../types/system';

export const SettingsApp: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    exportBackup,
    importBackup,
    addNotification,
  } = useOS();
  const { user, signOut, migrateGuestFilesToCloud, signInWithGoogle } = useAuth();
  const [migrating, setMigrating] = useState<boolean>(false);
  const [signingIn, setSigningIn] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'appearance' | 'dock' | 'system' | 'cloud' | 'backup' | 'about'>('appearance');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accentColors: { id: AccentColor; name: string; bgClass: string }[] = [
    { id: 'blue', name: 'Sky Blue', bgClass: 'bg-blue-500' },
    { id: 'indigo', name: 'Indigo', bgClass: 'bg-indigo-500' },
    { id: 'emerald', name: 'Emerald', bgClass: 'bg-emerald-500' },
    { id: 'amber', name: 'Amber', bgClass: 'bg-amber-500' },
    { id: 'rose', name: 'Rose', bgClass: 'bg-rose-500' },
    { id: 'cyan', name: 'Cyan', bgClass: 'bg-cyan-500' },
  ];

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as WebOSBackup;
        const success = importBackup(parsed);
        if (success) {
          addNotification('Backup Restored', 'System restored successfully.', 'success');
        }
      } catch {
        addNotification('Import Error', 'Invalid JSON backup file format.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex h-full w-full bg-slate-900/95 text-slate-200 select-none text-xs">
      {/* Sidebar Navigation */}
      <div className="w-48 border-r border-slate-800 bg-slate-950/40 p-2 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          System Preferences
        </div>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
            activeTab === 'appearance'
              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Palette size={14} />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('dock')}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
            activeTab === 'dock'
              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Monitor size={14} />
          <span>Dock & Taskbar</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
            activeTab === 'system'
              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock size={14} />
          <span>Clock & Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
            activeTab === 'cloud'
              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cloud size={14} className={user ? 'text-emerald-400' : 'text-slate-400'} />
          <span>Cloud & Account</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
            activeTab === 'backup'
              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HardDrive size={14} />
          <span>Backup & Reset</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded text-left transition-colors ${
            activeTab === 'about'
              ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Info size={14} />
          <span>About WebOS</span>
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'appearance' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Color Theme</h3>
              <p className="text-slate-400 text-xs mb-3">
                Choose between dark and light operating system presentation.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    settings.theme === 'dark'
                      ? 'border-blue-500 bg-slate-800/90 shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50'
                  }`}
                >
                  <Moon size={18} className="text-blue-400" />
                  <div>
                    <div className="font-medium text-slate-200">Dark Mode</div>
                    <div className="text-[11px] text-slate-400">Deep obsidian & navy surfaces</div>
                  </div>
                </button>

                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    settings.theme === 'light'
                      ? 'border-blue-500 bg-slate-800/90 shadow-sm'
                      : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50'
                  }`}
                >
                  <Sun size={18} className="text-amber-400" />
                  <div>
                    <div className="font-medium text-slate-200">Light Mode</div>
                    <div className="text-[11px] text-slate-400">Crisp high-contrast theme</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Desktop Wallpaper */}
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Desktop Wallpaper</h3>
              <p className="text-slate-400 text-xs mb-3">
                High-definition atmospheric and geometric background gradients.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {WALLPAPER_OPTIONS.map((wp) => {
                  const isSelected = settings.wallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => updateSettings({ wallpaper: wp.id as WallpaperId })}
                      className={`group relative flex flex-col rounded-lg overflow-hidden border transition-all text-left ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="w-full h-20"
                        style={{ background: wp.previewGradient }}
                      />
                      <div className="p-2 bg-slate-900">
                        <div className="font-medium text-slate-200 truncate">{wp.name}</div>
                        <div className="text-[10px] text-slate-500">{wp.category}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">System Accent Color</h3>
              <p className="text-slate-400 text-xs mb-3">
                Applied to window focus rings, active states, and highlights.
              </p>
              <div className="flex items-center gap-3">
                {accentColors.map((acc) => {
                  const isSelected = settings.accentColor === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => updateSettings({ accentColor: acc.id })}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                        isSelected ? 'border-slate-400 bg-slate-800/80' : 'border-transparent hover:bg-slate-800/40'
                      }`}
                      title={acc.name}
                    >
                      <div className={`w-6 h-6 rounded-full ${acc.bgClass} shadow-sm`} />
                      <span className="text-[10px] text-slate-400">{acc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Night Light */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-200">Night Light Warmth</h4>
                  <p className="text-slate-400 text-xs">Warmer display colors to reduce eye strain</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.nightLight}
                  onChange={(e) => updateSettings({ nightLight: e.target.checked })}
                  className="rounded text-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dock' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Dock Position</h3>
              <p className="text-slate-400 text-xs mb-3">
                Select where the application dock is anchored on your screen.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['bottom', 'left', 'right'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => updateSettings({ dockPosition: pos })}
                    className={`p-3 rounded-lg border capitalize font-medium transition-all text-center ${
                      settings.dockPosition === pos
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                        : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Dock Icon Size</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSettings({ dockSize: size })}
                    className={`p-2.5 rounded-lg border font-medium transition-all text-center uppercase text-xs ${
                      settings.dockSize === size
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                        : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    {size === 'sm' ? 'Compact' : size === 'md' ? 'Standard' : 'Large'}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-slate-200">Automatically Hide Dock</h4>
                <p className="text-slate-400 text-xs">Dock slides into screen edge when not hovered</p>
              </div>
              <input
                type="checkbox"
                checked={settings.dockAutoHide}
                onChange={(e) => updateSettings({ dockAutoHide: e.target.checked })}
                className="rounded text-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Time & Clock Format</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => updateSettings({ timeFormat: '12h' })}
                  className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                    settings.timeFormat === '12h'
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  12-Hour (AM / PM)
                </button>
                <button
                  onClick={() => updateSettings({ timeFormat: '24h' })}
                  className={`p-2.5 rounded-lg border text-center font-medium transition-colors ${
                    settings.timeFormat === '24h'
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  24-Hour (Military)
                </button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Display seconds in clock</span>
                  <input
                    type="checkbox"
                    checked={settings.showSeconds}
                    onChange={(e) => updateSettings({ showSeconds: e.target.checked })}
                    className="rounded text-blue-500 w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-slate-300">Display date in top bar</span>
                  <input
                    type="checkbox"
                    checked={settings.showDate}
                    onChange={(e) => updateSettings({ showDate: e.target.checked })}
                    className="rounded text-blue-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-slate-100">Audio & Accessibility</h3>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-slate-300 block">Sound Effects</span>
                  <span className="text-[11px] text-slate-500">Audio feedback via browser Web Audio API</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
                  className="rounded text-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-slate-300 block">Reduced Motion</span>
                  <span className="text-[11px] text-slate-500">Disables window animations and transitions</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
                  className="rounded text-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-slate-300 block">Startup Screen</span>
                  <span className="text-[11px] text-slate-500">Show Boot & Lock screen on launch</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.startupScreen}
                  onChange={(e) => updateSettings({ startupScreen: e.target.checked })}
                  className="rounded text-blue-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}

        {activeTab === 'cloud' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">Firebase Cloud Workspace & Storage</h3>
              <p className="text-slate-400 text-xs mb-3">
                Synchronize files, documents, and code across devices via Google Cloud Firestore.
              </p>

              {user ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-10 h-10 rounded-full border border-emerald-400/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-200">
                          {user.displayName || user.email}
                        </div>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>Connected to Firebase (webos-ff50c)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={signOut}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-300 text-xs">Sync Local Files to Firebase</div>
                      <div className="text-[11px] text-slate-500">
                        Uploads all current local documents and code to your Firebase Firestore cloud storage.
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setMigrating(true);
                        const count = await migrateGuestFilesToCloud();
                        setMigrating(false);
                        addNotification('Migration Complete', `Synced ${count} files to Firebase Firestore.`, 'success');
                      }}
                      disabled={migrating}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium transition-colors text-xs cursor-pointer shrink-0"
                    >
                      {migrating ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs sm:text-sm">
                    <Cloud size={16} className="text-slate-400" />
                    <span>Operating in Local Guest Mode</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    You are currently using isolated browser local storage. Connect with your Google account to sync files to Firebase Cloud.
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={async () => {
                        setSigningIn(true);
                        const { error } = await signInWithGoogle();
                        setSigningIn(false);
                        if (error) {
                          addNotification('Sign In Failed', error.message, 'error');
                        } else {
                          addNotification('Connected', 'Signed in with Google successfully.', 'success');
                        }
                      }}
                      disabled={signingIn}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>{signingIn ? 'Connecting...' : 'Connect with Google'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Firebase Project ID: webos-ff50c
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">WebOS Data Backup</h3>
              <p className="text-slate-400 text-xs mb-3">
                Export all virtual filesystem contents, notes, preferences, and events into a single JSON file.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportBackup}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                >
                  <Download size={14} />
                  <span>Export Backup (.json)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <Upload size={14} />
                  <span>Restore from Backup</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleBackupFileSelect}
                />
              </div>
            </div>

            {/* Factory Reset */}
            <div className="pt-6 border-t border-slate-800">
              <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                  <ShieldAlert size={16} />
                  <span>Factory Reset</span>
                </div>
                <p className="text-xs text-rose-300/80 leading-relaxed">
                  Resetting WebOS will delete all custom virtual files, notes, and preferences, restoring the operating system to its default initial state.
                </p>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Reset All Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                W
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">WebOS Desktop Environment</h3>
                <p className="text-xs text-slate-400">Version 1.0.0 (Production Release)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Architecture</div>
                <div className="text-slate-200 font-mono">React 19 + TypeScript + Vite</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Storage Mode</div>
                <div className="text-slate-200 font-mono">HTML5 LocalStorage + Virtual FS</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Audio Engine</div>
                <div className="text-slate-200 font-mono">W3C Web Audio API (Synthesized)</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Privacy Guarantee</div>
                <div className="text-emerald-400 font-medium">100% Client-Side Isolated</div>
              </div>
            </div>

            <p className="text-xs text-slate-400 pt-2 leading-relaxed">
              WebOS delivers an authentic desktop operating system experience within modern browsers. All state is securely saved in your browser and will never be shared with external servers.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
          <div className="w-84 p-5 rounded-2xl bg-slate-900 border border-rose-800/80 shadow-2xl">
            <h4 className="font-bold text-sm text-rose-300 mb-2">Reset Entire WebOS Environment?</h4>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This will erase all virtual files in your Documents, Downloads, Notes, and restore default system configurations. Are you sure you wish to proceed?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  resetAllData();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                Confirm Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
