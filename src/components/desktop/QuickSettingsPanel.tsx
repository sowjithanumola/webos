import React, { useRef, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Eye,
  BellOff,
  Image,
  Lock,
  Power,
  Sliders,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';
import { WALLPAPER_OPTIONS } from '../../config/wallpapers';
import { WallpaperId } from '../../types/system';

export const QuickSettingsPanel: React.FC = () => {
  const {
    isQuickSettingsOpen,
    toggleQuickSettings,
    settings,
    updateSettings,
    lockOS,
    shutDownOS,
  } = useOS();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[title="Quick Settings"]')
      ) {
        toggleQuickSettings(false);
      }
    };

    if (isQuickSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuickSettingsOpen, toggleQuickSettings]);

  if (!isQuickSettingsOpen) return null;

  const currentVol = sound.getVolume();
  const isMuted = sound.getIsMuted();

  return (
    <div
      ref={panelRef}
      className="fixed top-11 right-3 w-80 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl z-50 p-4 text-xs text-slate-200 select-none space-y-4"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="font-semibold text-slate-100 flex items-center gap-1.5">
          <Sliders size={14} className="text-blue-400" />
          Quick Settings
        </span>
        <button
          onClick={() => toggleQuickSettings(false)}
          className="text-slate-400 hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {/* Quick Toggle Tiles */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
            settings.theme === 'dark'
              ? 'border-blue-500/60 bg-blue-600/20 text-blue-300'
              : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} className="text-amber-400" />}
          <div>
            <div className="font-medium">{settings.theme === 'dark' ? 'Dark' : 'Light'} Mode</div>
            <div className="text-[10px] text-slate-400">Appearance</div>
          </div>
        </button>

        <button
          onClick={() => updateSettings({ nightLight: !settings.nightLight })}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
            settings.nightLight
              ? 'border-amber-500/60 bg-amber-600/20 text-amber-300'
              : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Eye size={16} className={settings.nightLight ? 'text-amber-400' : ''} />
          <div>
            <div className="font-medium">Night Light</div>
            <div className="text-[10px] text-slate-400">{settings.nightLight ? 'Active' : 'Off'}</div>
          </div>
        </button>

        <button
          onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
            settings.soundEffects
              ? 'border-emerald-500/60 bg-emerald-600/20 text-emerald-300'
              : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800'
          }`}
        >
          {settings.soundEffects ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <div>
            <div className="font-medium">Sound Effects</div>
            <div className="text-[10px] text-slate-400">{settings.soundEffects ? 'Enabled' : 'Muted'}</div>
          </div>
        </button>

        <button
          onClick={() => {
            toggleQuickSettings(false);
            lockOS();
          }}
          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800 transition-all text-left"
        >
          <Lock size={16} className="text-amber-400" />
          <div>
            <div className="font-medium">Lock Screen</div>
            <div className="text-[10px] text-slate-400">Protect session</div>
          </div>
        </button>
      </div>

      {/* Volume Slider */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Volume2 size={13} className="text-blue-400" />
            Master Audio Volume
          </span>
          <span className="tabular-nums font-mono">
            {isMuted ? 'Muted' : `${Math.round(currentVol * 100)}%`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => sound.setMuted(!isMuted)}
            className="text-slate-400 hover:text-slate-200"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : currentVol}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              sound.setVolume(val);
              sound.setMuted(false);
            }}
            className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Wallpaper Switcher */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-slate-400 block font-medium">Quick Wallpaper</span>
        <div className="grid grid-cols-6 gap-1.5">
          {WALLPAPER_OPTIONS.map((wp) => (
            <button
              key={wp.id}
              onClick={() => updateSettings({ wallpaper: wp.id as WallpaperId })}
              style={{ background: wp.previewGradient }}
              className={`h-8 rounded-lg border transition-all ${
                settings.wallpaper === wp.id
                  ? 'border-blue-400 ring-2 ring-blue-500/40 scale-105'
                  : 'border-slate-800 hover:scale-105'
              }`}
              title={wp.name}
            />
          ))}
        </div>
      </div>

      {/* Bottom Session control */}
      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-400">
        <span>Session: {settings.profile.name}</span>
        <button
          onClick={() => {
            toggleQuickSettings(false);
            shutDownOS();
          }}
          className="flex items-center gap-1 text-rose-400 hover:text-rose-300"
        >
          <Power size={12} />
          <span>Shut Down</span>
        </button>
      </div>
    </div>
  );
};
