import React, { useRef, useEffect } from 'react';
import { Bell, Trash2, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const NotificationCenter: React.FC = () => {
  const {
    isNotificationCenterOpen,
    toggleNotificationCenter,
    notifications,
    dismissNotification,
    clearAllNotifications,
  } = useOS();

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[title="Notification Center"]')
      ) {
        toggleNotificationCenter(false);
      }
    };

    if (isNotificationCenterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationCenterOpen, toggleNotificationCenter]);

  if (!isNotificationCenterOpen) return null;

  return (
    <div
      ref={drawerRef}
      className="fixed top-11 right-3 w-80 max-h-[460px] rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl z-50 p-4 text-xs text-slate-200 select-none flex flex-col"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 font-semibold text-slate-100">
          <Bell size={14} className="text-blue-400" />
          <span>Notification Center</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
            {notifications.length}
          </span>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={12} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Bell size={28} className="mx-auto mb-2 opacity-30" />
            <p>No new notifications</p>
          </div>
        ) : (
          notifications.map((notif) => {
            return (
              <div
                key={notif.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-1 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    {notif.type === 'success' && <CheckCircle2 size={13} className="text-emerald-400" />}
                    {notif.type === 'error' && <AlertCircle size={13} className="text-rose-400" />}
                    {notif.type === 'warning' && <AlertTriangle size={13} className="text-amber-400" />}
                    {(!notif.type || notif.type === 'info') && <Info size={13} className="text-blue-400" />}
                    <span className="truncate">{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{notif.message}</p>

                {notif.action && (
                  <button
                    onClick={notif.action.onClick}
                    className="mt-1 px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors text-[10px]"
                  >
                    {notif.action.label}
                  </button>
                )}

                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-300 transition-opacity"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
