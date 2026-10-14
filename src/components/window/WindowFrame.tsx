import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { WindowState, WindowPosition, WindowSize } from '../../types/window';
import { useOS } from '../../context/OSContext';
import { AppIcon } from '../common/AppIcon';

interface WindowFrameProps {
  window: WindowState;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({ window: win, children }) => {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowPosition,
    updateWindowSize,
    snapWindow,
    settings,
  } = useOS();

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<WindowPosition>({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<WindowPosition>(win.position);
  const [currentSize, setCurrentSize] = useState<WindowSize>(win.size);
  const [snapCandidate, setSnapCandidate] = useState<'left' | 'right' | 'top' | null>(null);

  const windowRef = useRef<HTMLDivElement>(null);

  // Sync internal pos/size with state updates
  useEffect(() => {
    setCurrentPos(win.position);
  }, [win.position]);

  useEffect(() => {
    setCurrentSize(win.size);
  }, [win.size]);

  // Window Dragging
  const handleTitleMouseDown = (e: React.MouseEvent) => {
    if (win.isMaximized) return;
    if ((e.target as HTMLElement).closest('.window-control-btn')) return;

    focusWindow(win.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Keep within bounds
      newY = Math.max(32, newY); // Don't go above topbar

      // Check snap threshold
      const screenW = window.innerWidth;
      if (e.clientX <= 20) {
        setSnapCandidate('left');
      } else if (e.clientX >= screenW - 20) {
        setSnapCandidate('right');
      } else if (e.clientY <= 38) {
        setSnapCandidate('top');
      } else {
        setSnapCandidate(null);
      }

      setCurrentPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (snapCandidate) {
        snapWindow(win.id, snapCandidate);
        setSnapCandidate(null);
      } else {
        updateWindowPosition(win.id, currentPos);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, currentPos, snapCandidate, win.id, snapWindow, updateWindowPosition]);

  // Window Resizing from 8 directions
  const startResize = useCallback(
    (direction: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (win.isMaximized) return;

      focusWindow(win.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = currentSize.width;
      const startH = currentSize.height;
      const startPosX = currentPos.x;
      const startPosY = currentPos.y;

      const handleResizeMove = (moveEvt: MouseEvent) => {
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;

        let newW = startW;
        let newH = startH;
        let newX = startPosX;
        let newY = startPosY;

        if (direction.includes('e')) {
          newW = Math.max(win.minSize.width, startW + dx);
        }
        if (direction.includes('s')) {
          newH = Math.max(win.minSize.height, startH + dy);
        }
        if (direction.includes('w')) {
          const potentialW = startW - dx;
          if (potentialW >= win.minSize.width) {
            newW = potentialW;
            newX = startPosX + dx;
          }
        }
        if (direction.includes('n')) {
          const potentialH = startH - dy;
          if (potentialH >= win.minSize.height) {
            newH = potentialH;
            newY = startPosY + dy;
          }
        }

        setCurrentSize({ width: newW, height: newH });
        setCurrentPos({ x: newX, y: newY });
      };

      const handleResizeUp = () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeUp);
        updateWindowSize(win.id, currentSize);
        updateWindowPosition(win.id, currentPos);
      };

      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
    },
    [win.id, win.isMaximized, win.minSize, currentSize, currentPos, focusWindow, updateWindowSize, updateWindowPosition]
  );

  if (win.isMinimized) return null;

  const isLight = settings.theme === 'light';

  return (
    <div
      ref={windowRef}
      onMouseDown={() => focusWindow(win.id)}
      style={{
        transform: win.isMaximized ? 'none' : `translate3d(${currentPos.x}px, ${currentPos.y}px, 0)`,
        width: win.isMaximized ? '100%' : `${currentSize.width}px`,
        height: win.isMaximized ? 'calc(100vh - 90px)' : `${currentSize.height}px`,
        top: win.isMaximized ? '36px' : 0,
        left: win.isMaximized ? 0 : 0,
        zIndex: win.zIndex,
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
      }}
      className={`absolute flex flex-col rounded-xl overflow-hidden shadow-2xl border ${
        win.isFocused
          ? 'border-slate-600/70 shadow-black/60 ring-1 ring-blue-500/25'
          : 'border-slate-800/80 shadow-black/30 opacity-95'
      } ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900/95 text-slate-100'}`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
        className={`h-9 px-3 flex items-center justify-between border-b cursor-default select-none transition-colors ${
          win.isFocused
            ? isLight
              ? 'bg-slate-200/90 border-slate-300'
              : 'bg-slate-950/80 border-slate-800 text-slate-100'
            : isLight
            ? 'bg-slate-100/70 border-slate-200 text-slate-500'
            : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
        }`}
      >
        {/* Left window info */}
        <div className="flex items-center gap-2 truncate">
          <AppIcon id={win.appId} size={15} className={win.isFocused ? 'text-blue-400' : 'text-slate-500'} />
          <span className="font-semibold text-xs truncate max-w-sm tracking-tight">{win.title}</span>
        </div>

        {/* Window action controls */}
        <div className="flex items-center gap-1 window-control-btn">
          <button
            onClick={() => minimizeWindow(win.id)}
            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            title="Minimize"
          >
            <Minus size={12} />
          </button>
          <button
            onClick={() => maximizeWindow(win.id)}
            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            title={win.isMaximized ? 'Restore' : 'Maximize'}
          >
            {win.isMaximized ? <Copy size={11} /> : <Square size={11} />}
          </button>
          <button
            onClick={() => closeWindow(win.id)}
            className="p-1.5 rounded hover:bg-rose-600/80 hover:text-white text-slate-400 transition-colors"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Window Body / Application Viewport */}
      <div className="flex-1 overflow-hidden relative">{children}</div>

      {/* Resize Handles (8 directions) */}
      {!win.isMaximized && (
        <>
          <div
            onMouseDown={(e) => startResize('n', e)}
            className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize"
          />
          <div
            onMouseDown={(e) => startResize('s', e)}
            className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize"
          />
          <div
            onMouseDown={(e) => startResize('w', e)}
            className="absolute left-0 top-2 bottom-2 w-1 cursor-ew-resize"
          />
          <div
            onMouseDown={(e) => startResize('e', e)}
            className="absolute right-0 top-2 bottom-2 w-1 cursor-ew-resize"
          />
          <div
            onMouseDown={(e) => startResize('nw', e)}
            className="absolute top-0 left-0 w-2.5 h-2.5 cursor-nwse-resize"
          />
          <div
            onMouseDown={(e) => startResize('ne', e)}
            className="absolute top-0 right-0 w-2.5 h-2.5 cursor-nesw-resize"
          />
          <div
            onMouseDown={(e) => startResize('sw', e)}
            className="absolute bottom-0 left-0 w-2.5 h-2.5 cursor-nesw-resize"
          />
          <div
            onMouseDown={(e) => startResize('se', e)}
            className="absolute bottom-0 right-0 w-2.5 h-2.5 cursor-nwse-resize"
          />
        </>
      )}
    </div>
  );
};
