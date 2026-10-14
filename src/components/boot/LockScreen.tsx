import React, { useState, useEffect } from 'react';
import { ArrowRight, Lock, Power, RotateCcw } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const LockScreen: React.FC = () => {
  const { unlockOS, restartOS, shutDownOS, settings } = useOS();
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Enter key unlocks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Space') {
        unlockOS();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [unlockOS]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 select-none backdrop-blur-3xl animate-in fade-in duration-200">
      {/* Top Clock */}
      <div className="flex flex-col items-center mt-16 space-y-1">
        <div className="text-6xl sm:text-7xl font-extralight tracking-tight font-mono tabular-nums text-white">
          {timeStr}
        </div>
        <div className="text-base text-slate-400 font-light">{dateStr}</div>
      </div>

      {/* Center Unlock Capsule */}
      <div className="flex flex-col items-center space-y-4">
        <div
          style={{ backgroundColor: settings.profile.avatarColor }}
          className="w-16 h-16 rounded-full flex items-center justify-center text-slate-950 font-bold text-2xl shadow-2xl ring-4 ring-white/10"
        >
          {settings.profile.name[0] || 'U'}
        </div>

        <div className="text-center">
          <h2 className="text-base font-semibold text-white">{settings.profile.name}</h2>
          <p className="text-xs text-slate-400">Locked Session</p>
        </div>

        <button
          onClick={unlockOS}
          className="px-6 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-xs flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg"
        >
          <span>Unlock Desktop</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Bottom Power Actions */}
      <div className="flex items-center gap-4 text-slate-400 text-xs">
        <button
          onClick={restartOS}
          className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 hover:text-slate-200 transition-colors"
        >
          <RotateCcw size={13} />
          <span>Restart</span>
        </button>
        <button
          onClick={shutDownOS}
          className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 hover:text-rose-400 transition-colors"
        >
          <Power size={13} />
          <span>Shut Down</span>
        </button>
      </div>
    </div>
  );
};
