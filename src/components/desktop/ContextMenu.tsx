import React, { useEffect, useRef } from 'react';
import {
  FolderPlus,
  FilePlus,
  Terminal,
  Settings,
  RefreshCw,
  Image,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose }) => {
  const { openWindow, createFolder, createFile } = useOS();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay inside viewport
  const safeX = Math.min(x, window.innerWidth - 180);
  const safeY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      ref={menuRef}
      style={{ left: `${safeX}px`, top: `${safeY}px` }}
      className="fixed z-50 w-44 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-1 text-slate-200 text-xs select-none divide-y divide-slate-800/80"
    >
      <div className="py-0.5">
        <button
          onClick={() => {
            createFolder('folder_documents', `Folder_${Date.now().toString().slice(-4)}`);
            openWindow('file-manager');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
        >
          <FolderPlus size={14} className="text-blue-400" />
          <span>New Folder</span>
        </button>

        <button
          onClick={() => {
            createFile('folder_documents', `Note_${Date.now().toString().slice(-4)}.md`, '');
            openWindow('text-editor');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
        >
          <FilePlus size={14} className="text-indigo-400" />
          <span>New Text Document</span>
        </button>
      </div>

      <div className="py-0.5">
        <button
          onClick={() => {
            openWindow('terminal');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
        >
          <Terminal size={14} className="text-emerald-400" />
          <span>Open Terminal</span>
        </button>

        <button
          onClick={() => {
            openWindow('settings');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
        >
          <Image size={14} className="text-purple-400" />
          <span>Change Wallpaper</span>
        </button>

        <button
          onClick={() => {
            openWindow('settings');
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
        >
          <Settings size={14} className="text-slate-400" />
          <span>Display Settings</span>
        </button>
      </div>

      <div className="py-0.5">
        <button
          onClick={() => {
            window.location.reload();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors text-left"
        >
          <RefreshCw size={13} className="text-slate-400" />
          <span>Refresh Desktop</span>
        </button>
      </div>
    </div>
  );
};
