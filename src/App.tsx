import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OSProvider, useOS } from './context/OSContext';
import { BootScreen } from './components/boot/BootScreen';
import { LockScreen } from './components/boot/LockScreen';
import { Desktop } from './components/desktop/Desktop';
import { Power } from 'lucide-react';

const OSContent: React.FC = () => {
  const { isBooted, isLocked, isShutDown, bootOS } = useOS();

  if (isShutDown) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-slate-400 select-none space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
          <Power size={28} />
        </div>
        <div className="text-center">
          <h2 className="text-base font-semibold text-slate-200">WebOS is Powered Off</h2>
          <p className="text-xs text-slate-500 mt-1">Virtual machine has entered power-save state.</p>
        </div>
        <button
          onClick={bootOS}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          Power On WebOS
        </button>
      </div>
    );
  }

  if (!isBooted) {
    return <BootScreen />;
  }

  if (isLocked) {
    return <LockScreen />;
  }

  return <Desktop />;
};

const OSRoot: React.FC = () => {
  const { user, isGuest } = useAuth();
  // Keying OSProvider by authenticated user ID guarantees that when a user logs out
  // or a different user logs in, the entire desktop OS state (windows, active apps,
  // file explorer buffers) is completely torn down and rebuilt fresh for the active session.
  const sessionKey = user ? `user_${user.uid}` : (isGuest ? 'guest' : 'boot');

  return (
    <OSProvider key={sessionKey}>
      <OSContent />
    </OSProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <OSRoot />
    </AuthProvider>
  );
}
