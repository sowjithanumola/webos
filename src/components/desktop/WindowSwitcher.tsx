import React, { useEffect, useState } from 'react';
import { useOS } from '../../context/OSContext';
import { AppIcon } from '../common/AppIcon';

export const WindowSwitcher: React.FC = () => {
  const { windows, isWindowSwitcherOpen, focusWindow, setWindowSwitcherOpen } = useOS();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    if (isWindowSwitcherOpen) {
      setSelectedIndex((prev) => (windows.length > 0 ? (prev + 1) % windows.length : 0));
    }
  }, [isWindowSwitcherOpen, windows.length]);

  if (!isWindowSwitcherOpen || windows.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none">
      <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 shadow-2xl flex items-center gap-3">
        {windows.map((win, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={win.id}
              onClick={() => {
                focusWindow(win.id);
                setWindowSwitcherOpen(false);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border w-24 h-24 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-blue-600/30 border-blue-500/80 shadow-lg ring-2 ring-blue-500/40 text-white scale-105'
                  : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <AppIcon id={win.appId} size={28} className="text-blue-400 mb-2" />
              <span className="text-xs font-semibold truncate max-w-full text-center">
                {win.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
