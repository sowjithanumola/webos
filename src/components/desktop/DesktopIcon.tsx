import React from 'react';
import { AppId } from '../../types/window';
import { AppIcon } from '../common/AppIcon';

interface DesktopIconProps {
  id: AppId;
  name: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  name,
  isSelected,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      className={`group flex flex-col items-center justify-center p-2 rounded-xl w-20 h-22 cursor-pointer transition-all select-none border ${
        isSelected
          ? 'bg-blue-600/30 border-blue-500/50 shadow-md ring-1 ring-blue-400/40 text-white'
          : 'border-transparent hover:bg-white/10 text-slate-100 hover:text-white'
      }`}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900/40 backdrop-blur-md border border-white/10 group-hover:scale-105 transition-transform shadow-lg">
        <AppIcon id={id} size={24} className="text-white drop-shadow" />
      </div>
      <span className="text-[11px] font-medium mt-1.5 text-center truncate w-full px-1 drop-shadow-md">
        {name}
      </span>
    </div>
  );
};
