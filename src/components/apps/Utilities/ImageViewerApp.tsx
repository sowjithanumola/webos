import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Info } from 'lucide-react';
import { useOS } from '../../../context/OSContext';

interface ImageViewerProps {
  payload?: {
    fileId?: string;
    filePath?: string;
  };
}

export const ImageViewerApp: React.FC<ImageViewerProps> = ({ payload }) => {
  const { fs } = useOS();
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  // Default to abstract SVG in pictures or payload file
  const activeFile = payload?.fileId ? fs.nodes[payload.fileId] : fs.nodes['file_abstract_svg'];

  useEffect(() => {
    // Reset transforms when file changes
    setZoom(1);
    setRotation(0);
  }, [payload?.fileId]);

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const isSvg = activeFile?.name.endsWith('.svg') || activeFile?.content?.includes('<svg');

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 select-none text-xs">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/60">
        <span className="font-medium text-slate-300 truncate max-w-xs">
          {activeFile?.name || 'No image loaded'}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <div className="w-px h-3.5 bg-slate-800 mx-1" />
          <button
            onClick={handleRotate}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Fit to Screen"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-1 rounded transition-colors ${showInfo ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Image Details"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {activeFile ? (
          <div
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out',
            }}
            className="flex items-center justify-center max-w-full max-h-full"
          >
            {isSvg ? (
              <div
                dangerouslySetInnerHTML={{ __html: activeFile.content || '' }}
                className="w-80 h-80 flex items-center justify-center shadow-2xl rounded-xl overflow-hidden"
              />
            ) : (
              <img
                src={activeFile.content || ''}
                alt={activeFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        ) : (
          <div className="text-slate-500">No image selected</div>
        )}

        {/* Info Overlay Drawer */}
        {showInfo && activeFile && (
          <div className="absolute right-4 top-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-xl p-3 shadow-2xl space-y-1.5 w-60 z-10">
            <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 text-xs">
              File Properties
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Name:</span>
              <span className="text-slate-200 truncate max-w-[120px]">{activeFile.name}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Type:</span>
              <span className="text-slate-200 uppercase">{activeFile.type}</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Size:</span>
              <span className="text-slate-200 tabular-nums">{activeFile.size} Bytes</span>
            </div>
            <div className="flex justify-between text-slate-400 text-[11px]">
              <span>Path:</span>
              <span className="text-slate-200 truncate max-w-[120px]">{activeFile.path}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
