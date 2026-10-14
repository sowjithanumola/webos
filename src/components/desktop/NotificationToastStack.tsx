import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const NotificationToastStack: React.FC = () => {
  const { notifications, dismissNotification } = useOS();

  // Show only the 3 most recent notifications as toasts if created within 6 seconds
  const recentToasts = notifications.slice(0, 3);

  return (
    <div className="fixed top-12 right-4 z-50 flex flex-col gap-2 pointer-events-none select-none max-w-sm w-full">
      {recentToasts.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto p-3 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-xs text-slate-200 flex items-start gap-2.5 animate-in fade-in slide-in-from-right-4 duration-200"
        >
          <div className="mt-0.5 shrink-0">
            {notif.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {notif.type === 'error' && <AlertCircle size={16} className="text-rose-400" />}
            {notif.type === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
            {(!notif.type || notif.type === 'info') && <Info size={16} className="text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-100 truncate">{notif.title}</div>
            <div className="text-[11px] text-slate-400 leading-snug">{notif.message}</div>
          </div>

          <button
            onClick={() => dismissNotification(notif.id)}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
