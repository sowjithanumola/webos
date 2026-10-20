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
      title={name}
      className={`group flex flex-col items-center justify-start p-2 rounded-2xl w-24 min-h-[96px] cursor-pointer transition-all select-none border ${
        isSelected
          ? 'bg-blue-600/35 border-blue-400/60 shadow-lg ring-1 ring-blue-400/50 text-white'
          : 'border-transparent hover:bg-white/12 text-slate-100 hover:text-white'
      }`}
    >
      {/* App Icon Container */}
      <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-slate-900/50 backdrop-blur-md border border-white/15 group-hover:scale-105 group-hover:border-white/30 transition-transform shadow-xl shrink-0">
        <AppIcon id={id} size={26} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
      </div>

      {/* App Label with full multiline visibility (no clipping or ellipsis like '...') */}
      <div className="w-full mt-1.5 flex items-center justify-center">
        <span
          className="text-[11.5px] font-medium text-center leading-snug line-clamp-2 break-words w-full px-0.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] [text-shadow:_0_1px_3px_rgba(0,0,0,0.95)] tracking-tight"
        >
          {name}
        </span>
      </div>
    </div>
  );
};
