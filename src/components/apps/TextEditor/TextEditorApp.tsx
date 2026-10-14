import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Save,
  Download,
  FolderOpen,
  FilePlus,
  Eye,
  EyeOff,
  Search,
  Check,
  Columns,
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';

interface TextEditorAppProps {
  payload?: {
    fileId?: string;
    filePath?: string;
  };
}

export const TextEditorApp: React.FC<TextEditorAppProps> = ({ payload }) => {
  const { fs, updateFileContent, createFile, exportFSFile, addNotification } = useOS();

  const [activeFileId, setActiveFileId] = useState<string | null>(payload?.fileId || null);
  const [fileName, setFileName] = useState<string>('Untitled.md');
  const [content, setContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // Find & Replace
  const [showFind, setShowFind] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');

  // Cursor position
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load file content if payload provided
  useEffect(() => {
    if (payload?.fileId && fs.nodes[payload.fileId]) {
      const file = fs.nodes[payload.fileId];
      setActiveFileId(file.id);
      setFileName(file.name);
      setContent(file.content || '');
      setIsSaved(true);
    }
  }, [payload?.fileId, fs.nodes]);

  const handleTextChange = (newVal: string) => {
    setContent(newVal);
    setIsSaved(false);
  };

  const handleCursorMove = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  // Save to Virtual FS
  const handleSave = useCallback(() => {
    if (activeFileId && fs.nodes[activeFileId]) {
      updateFileContent(activeFileId, content);
      setIsSaved(true);
      addNotification('Saved', `Saved changes to "${fileName}".`, 'success');
    } else {
      // Save As new file in Documents
      try {
        const newFile = createFile('folder_documents', fileName, content, 'markdown');
        setActiveFileId(newFile.id);
        setIsSaved(true);
        addNotification('File Created', `Saved "${fileName}" to Documents.`, 'success');
      } catch (err: unknown) {
        addNotification('Save Error', err instanceof Error ? err.message : 'Error', 'error');
      }
    }
  }, [activeFileId, fs.nodes, updateFileContent, content, fileName, addNotification, createFile]);

  // Keyboard shortcut Ctrl+S and Ctrl+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFind((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Find & Replace actions
  const matchCount = useMemo(() => {
    if (!searchQuery) return 0;
    try {
      const regex = new RegExp(searchQuery, 'gi');
      return (content.match(regex) || []).length;
    } catch {
      return 0;
    }
  }, [searchQuery, content]);

  const handleReplaceAll = () => {
    if (!searchQuery) return;
    try {
      const regex = new RegExp(searchQuery, 'gi');
      const updated = content.replace(regex, replaceQuery);
      setContent(updated);
      setIsSaved(false);
    } catch {
      // invalid regex
    }
  };

  // Text metrics
  const metrics = useMemo(() => {
    const lines = content.split('\n').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const chars = content.length;
    return { lines, words, chars };
  }, [content]);

  // Clean Markdown preview renderer (parses headings, bold, italic, code blocks, lists, quotes)
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="prose prose-invert max-w-none text-slate-200 text-xs space-y-2 select-text leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-1 mt-2">{line.slice(2)}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-base font-semibold text-slate-100 border-b border-slate-800/60 pb-1 mt-2">{line.slice(3)}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-sm font-semibold text-slate-200 mt-1">{line.slice(4)}</h3>;
          }
          if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 text-slate-400 line-through">
                <input type="checkbox" checked readOnly className="rounded text-blue-500" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- [ ] ')) {
            return (
              <div key={idx} className="flex items-center gap-2 text-slate-200">
                <input type="checkbox" checked={false} readOnly className="rounded text-blue-500" />
                <span>{line.slice(6)}</span>
              </div>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <li key={idx} className="ml-4 list-disc text-slate-300">
                {line.slice(2)}
              </li>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote key={idx} className="pl-3 border-l-2 border-blue-500 text-slate-400 italic">
                {line.slice(2)}
              </blockquote>
            );
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-2" />;
          }
          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900/95 text-slate-200 select-none text-xs">
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          {/* File Name input / badge */}
          <input
            type="text"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              setIsSaved(false);
            }}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 w-44 select-text"
          />

          <button
            onClick={handleSave}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              isSaved
                ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-blue-600 hover:bg-blue-500 text-white font-medium'
            }`}
            title="Save (Ctrl+S)"
          >
            {isSaved ? <Check size={12} className="text-emerald-400" /> : <Save size={12} />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {activeFileId && (
            <button
              onClick={() => exportFSFile(activeFileId)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300"
              title="Download to computer"
            >
              <Download size={12} className="text-cyan-400" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveFileId(null);
              setFileName('Untitled.md');
              setContent('');
              setIsSaved(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300"
            title="New blank file"
          >
            <FilePlus size={12} />
            <span>New</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowFind(!showFind)}
            className={`p-1.5 rounded transition-colors ${showFind ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
            title="Find & Replace (Ctrl+F)"
          >
            <Search size={13} />
          </button>

          <button
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              isPreviewOpen ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle Markdown Preview"
          >
            {isPreviewOpen ? <Columns size={13} /> : <Eye size={13} />}
            <span>{isPreviewOpen ? 'Split View' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {/* Find & Replace Strip */}
      {showFind && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800 bg-slate-950/80">
          <input
            type="text"
            placeholder="Find..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 select-text"
          />
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 select-text"
          />
          <button
            onClick={handleReplaceAll}
            disabled={!searchQuery}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs"
          >
            Replace All
          </button>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {matchCount} match{matchCount !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* Editor & Preview Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor text area */}
        <div className="flex-1 flex flex-col p-2 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyUp={handleCursorMove}
            onClick={handleCursorMove}
            placeholder="Enter text or markdown..."
            className="w-full flex-1 bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none select-text p-2"
          />
        </div>

        {/* Live Preview Pane */}
        {isPreviewOpen && (
          <div className="flex-1 border-l border-slate-800 bg-slate-950/50 p-4 overflow-y-auto">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2 border-b border-slate-800 pb-1">
              Markdown Preview
            </div>
            {renderMarkdownPreview(content)}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 tabular-nums">
        <div className="flex items-center gap-3">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>{metrics.lines} lines</span>
          <span>{metrics.words} words</span>
          <span>{metrics.chars} characters</span>
        </div>
        <div>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};
