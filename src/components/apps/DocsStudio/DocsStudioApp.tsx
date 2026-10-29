import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FileText,
  Save,
  Download,
  Printer,
  Columns,
  Eye,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link,
  Plus,
  Trash2,
  Copy,
  Clock,
  BookOpen,
  Sparkles,
  Table,
  Minus,
  ListTree,
  FolderOpen,
  X,
  FileCheck,
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { loadFromStorage, saveToStorage, StorageKeys } from '../../../services/storage';

interface DocTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

interface OpenDoc {
  id: string;
  title: string;
  content: string;
  isSaved: boolean;
  fsFileId?: string;
}

const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'project-spec',
    name: 'Product Architecture Specification',
    description: 'System architecture, components, UX requirements, and technical constraints',
    content: `# WebOS Architecture Specification
**Author:** Lead Systems Architect  
**Status:** Approved for Implementation  
**Version:** 1.0.0  

---

## 1. Executive Summary
WebOS provides a full desktop experience inside standard web browsers. It integrates window management, local virtual persistence, a simulated Unix terminal, a Chrome-inspired browser, and developer productivity studios.

## 2. Core Subsystems
### 2.1 Window Manager
- Multi-window stacking with z-index elevation on click
- Drag-and-drop repositioning with boundary clamping
- Window snapping to screen quadrants and halves
- Smooth minimize, maximize, and restore transitions

### 2.2 Studio Applications
- **Code Studio**: Live multi-file code editor with sandboxed preview and ZIP bundling.
- **Docs Studio**: Real-time Markdown authoring with live split rendering and standalone export.
- **Web Browser**: Chrome-style tabbed browsing with omnibox and security policies.

## 3. Data Persistence Architecture
| Storage Layer | Implementation | Fallback Strategy |
| :--- | :--- | :--- |
| Virtual Filesystem | LocalStorage + JSON Tree | In-memory defaults |
| Studio Drafts | LocalStorage | Session cache |
| User Profile | System settings store | Default guest |

## 4. Immediate Milestones
- [x] Verify zero compilation errors
- [x] Implement safe sandboxed iframe live preview
- [x] Integrate Chrome-like web browser with DevTools
- [ ] Add collaborative sync extensions

> Note: All operations adhere strictly to browser sandbox limitations.`,
  },
  {
    id: 'meeting-notes',
    name: 'Executive Sync & Action Items',
    description: 'Structured agenda, attendees, key decisions, and assigned tasks',
    content: `# Executive Engineering Sync
**Date:** ${new Date().toLocaleDateString()}  
**Time:** 10:00 AM PST  
**Attendees:** Engineering, Design, QA  

---

## Agenda
1. Review Code Studio and Docs Studio integration
2. Validate Chrome-like browser experience and omnibox
3. Check calendar event management

## Key Decisions
- Standardized on sandboxed preview iframe to prevent cross-frame origin conflicts.
- Ensured virtual filesystem persists across browser refreshes.

## Action Items
- [x] Strip mock events from Calendar organizer
- [x] Add command palette to Code Studio
- [x] Implement document outline in Docs Studio`,
  },
  {
    id: 'readme-template',
    name: 'Software Project README',
    description: 'Clean developer documentation with installation and usage guide',
    content: `# Modern Web Application

A lightweight, high-performance web platform built with React, TypeScript, and Tailwind CSS.

## Getting Started
\`\`\`bash
# Clone the repository
git clone https://github.com/example/project.git

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## Features
- **Fast Vite Bundling**: Instant HMR and modern ES module builds.
- **Tailwind CSS v4**: Utility-first styling with zero runtime overhead.
- **Zero External Backend**: Completely self-contained client execution.

## License
MIT License © ${new Date().getFullYear()}`,
  },
];

export interface DocsStudioAppProps {
  payload?: {
    fileId?: string;
    filePath?: string;
  };
}

export const DocsStudioApp: React.FC<DocsStudioAppProps> = ({ payload }) => {
  const { fs, createFile, updateFileContent, addNotification } = useOS();

  // Multi-document tabs state with user-scoped draft recovery (defaults to single blank document)
  const defaultInitialDoc: OpenDoc[] = [
    {
      id: 'doc_1',
      title: 'Untitled.md',
      content: '',
      isSaved: true,
    },
  ];

  const [docs, setDocs] = useState<OpenDoc[]>(() => {
    const loaded = loadFromStorage<OpenDoc[]>(StorageKeys.DOCS_STUDIO, defaultInitialDoc);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : defaultInitialDoc;
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    const loaded = loadFromStorage<OpenDoc[]>(StorageKeys.DOCS_STUDIO, defaultInitialDoc);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded[0].id : 'doc_1';
  });
  const [viewLayout, setViewLayout] = useState<'split' | 'editor' | 'preview'>('split');
  const [showOutline, setShowOutline] = useState<boolean>(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeDoc = useMemo(() => {
    return docs.find((d) => d.id === activeDocId) || docs[0];
  }, [docs, activeDocId]);

  // Load file if passed via window payload
  useEffect(() => {
    if (payload?.fileId && fs.nodes[payload.fileId]) {
      const fsNode = fs.nodes[payload.fileId];
      setDocs((prev) => {
        const existing = prev.find((d) => d.fsFileId === fsNode.id || d.title === fsNode.name);
        if (existing) {
          return prev.map((d) =>
            d.id === existing.id ? { ...d, content: fsNode.content || '', isSaved: true } : d
          );
        }
        return [
          ...prev,
          {
            id: `doc_${Date.now()}`,
            title: fsNode.name,
            content: fsNode.content || '',
            isSaved: true,
            fsFileId: fsNode.id,
          },
        ];
      });
      setActiveDocId((prev) => {
        const existing = docs.find((d) => d.fsFileId === payload.fileId || d.title === fs.nodes[payload.fileId!].name);
        return existing ? existing.id : prev;
      });
    }
  }, [payload?.fileId, fs.nodes]);

  // Persist docs draft to user-isolated storage
  useEffect(() => {
    saveToStorage(StorageKeys.DOCS_STUDIO, docs);
  }, [docs]);

  // Derive metrics (words, chars, reading time)
  const metrics = useMemo(() => {
    const text = activeDoc?.content?.trim() || '';
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const readingTimeMins = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;
    return { words, chars, readingTimeMins };
  }, [activeDoc?.content]);

  // Extract outline (headings)
  const outline = useMemo(() => {
    if (!activeDoc?.content) return [];
    const lines = activeDoc.content.split('\n');
    const headings: { level: number; text: string; lineIndex: number }[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,3})\s+(.*)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          lineIndex: index,
        });
      }
    });
    return headings;
  }, [activeDoc?.content]);

  const handleContentChange = (val: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === activeDocId ? { ...d, content: val, isSaved: false } : d))
    );

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 1500);
  };

  const handleTitleChange = (val: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === activeDocId ? { ...d, title: val, isSaved: false } : d))
    );
  };

  const handleSave = useCallback(() => {
    if (!activeDoc) return;
    try {
      if (activeDoc.fsFileId && fs.nodes[activeDoc.fsFileId]) {
        updateFileContent(activeDoc.fsFileId, activeDoc.content);
      } else {
        const file = createFile('folder_documents', activeDoc.title, activeDoc.content, 'markdown');
        setDocs((prev) =>
          prev.map((d) => (d.id === activeDoc.id ? { ...d, isSaved: true, fsFileId: file.id } : d))
        );
      }
      setDocs((prev) =>
        prev.map((d) => (d.id === activeDoc.id ? { ...d, isSaved: true } : d))
      );
      addNotification('Document Saved', `Saved "${activeDoc.title}" to Documents.`, 'success');
    } catch {
      // transient
    }
  }, [activeDoc, fs.nodes, updateFileContent, createFile, addNotification]);

  // Insert formatting markup
  const insertFormat = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el || !activeDoc) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = activeDoc.content.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const nextContent = activeDoc.content.substring(0, start) + replacement + activeDoc.content.substring(end);
    handleContentChange(nextContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Create new document tab (creates empty document)
  const createNewDoc = (title?: string, initialContent: string = '') => {
    const newId = `doc_${Date.now()}`;
    const newDoc: OpenDoc = {
      id: newId,
      title: title || `Untitled_${docs.length + 1}.md`,
      content: initialContent,
      isSaved: true,
    };
    setDocs((prev) => [...prev, newDoc]);
    setActiveDocId(newId);
  };

  // Close doc tab
  const closeDocTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (docs.length === 1) return;
    const nextDocs = docs.filter((d) => d.id !== id);
    setDocs(nextDocs);
    if (activeDocId === id) {
      setActiveDocId(nextDocs[nextDocs.length - 1].id);
    }
  };

  // Export Standalone HTML
  const exportHtml = () => {
    if (!activeDoc) return;
    const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${activeDoc.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px;
      color: #1e293b;
      background: #ffffff;
    }
    h1 { font-size: 2.2rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; color: #0f172a; }
    h2 { font-size: 1.6rem; margin-top: 28px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; color: #1e293b; }
    h3 { font-size: 1.25rem; margin-top: 20px; color: #334155; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 16px 0; color: #64748b; font-style: italic; background: #f8fafc; border-radius: 0 8px 8px 0; padding: 12px 16px; }
    code { background: #f1f5f9; color: #e11d48; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; }
    ul, ol { padding-left: 24px; margin: 12px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  ${renderMarkdownToHtml(activeDoc.content)}
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDoc.title.replace(/\.md$/, '') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('Export Complete', 'Exported standalone HTML document.', 'success');
  };

  const exportMarkdown = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDoc.title.endsWith('.md') ? activeDoc.title : `${activeDoc.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('Export Complete', 'Exported Markdown document.', 'success');
  };

  // Convert markdown to clean HTML string for preview
  function renderMarkdownToHtml(md: string): string {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/~~(.*?)~~/gim, '<del>$1</del>')
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      .replace(/^---$/gim, '<hr />')
      .replace(/\n$/gim, '<br />')
      .replace(/\n/gim, '<br />');
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 select-none text-xs">
      {/* Document Tab Strip */}
      <div className="flex items-center bg-slate-900 border-b border-slate-800 px-2 pt-1 gap-1 overflow-x-auto">
        {docs.map((doc) => {
          const isActive = doc.id === activeDocId;
          return (
            <div
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer text-xs max-w-[200px] truncate transition-colors ${
                isActive
                  ? 'bg-slate-950 text-indigo-300 font-medium border-t-2 border-t-indigo-500 border-x border-slate-800'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <FileText size={12} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
              <span className="truncate flex-1">{doc.title}</span>
              {!doc.isSaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
              {docs.length > 1 && (
                <button
                  onClick={(e) => closeDocTab(doc.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-800 text-slate-400"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => createNewDoc()}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="New Document"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Top Header & Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30">
            <BookOpen size={14} />
            <span>Docs Studio</span>
          </div>

          <input
            type="text"
            value={activeDoc?.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:border-indigo-500 w-48 select-text"
          />

          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            {activeDoc?.isSaved ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <FileCheck size={11} /> Saved
              </span>
            ) : (
              <span className="text-amber-400">Unsaved...</span>
            )}
          </span>
        </div>

        {/* View Switcher, Templates & Exports */}
        <div className="flex items-center gap-2">
          {/* Templates dropdown */}
          <select
            onChange={(e) => {
              const tmpl = DOC_TEMPLATES.find((t) => t.id === e.target.value);
              if (tmpl) {
                createNewDoc(`${tmpl.name.replace(/\s+/g, '_')}.md`, tmpl.content);
              }
            }}
            defaultValue=""
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-400 font-medium focus:outline-none focus:border-indigo-500 text-xs"
          >
            <option value="" disabled>Templates...</option>
            {DOC_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Outline Toggle */}
          <button
            onClick={() => setShowOutline(!showOutline)}
            className={`p-1.5 rounded transition-colors ${showOutline ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
            title="Toggle Outline / Table of Contents"
          >
            <ListTree size={13} />
          </button>

          {/* View Modes */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setViewLayout('editor')}
              className={`p-1 rounded ${viewLayout === 'editor' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}
              title="Editor only"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => setViewLayout('split')}
              className={`p-1 rounded ${viewLayout === 'split' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}
              title="Split View"
            >
              <Columns size={13} />
            </button>
            <button
              onClick={() => setViewLayout('preview')}
              className={`p-1 rounded ${viewLayout === 'preview' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}
              title="Preview only"
            >
              <Eye size={13} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            title="Save to Virtual Filesystem (Ctrl+S)"
          >
            <Save size={12} />
            <span>Save</span>
          </button>

          <button
            onClick={exportMarkdown}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Export as Markdown .md file"
          >
            <Download size={12} />
            <span>.md</span>
          </button>

          <button
            onClick={exportHtml}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Export as standalone HTML file"
          >
            <Download size={12} />
            <span>HTML</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Print or save as PDF"
          >
            <Printer size={13} />
          </button>
        </div>
      </div>

      {/* Formatting Tools Strip */}
      {viewLayout !== 'preview' && (
        <div className="flex items-center gap-1 px-3 py-1 border-b border-slate-800 bg-slate-950/70 text-slate-400 overflow-x-auto">
          <button
            onClick={() => insertFormat('# ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Heading 1"
          >
            <Heading1 size={14} />
          </button>
          <button
            onClick={() => insertFormat('## ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Heading 2"
          >
            <Heading2 size={14} />
          </button>
          <button
            onClick={() => insertFormat('### ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Heading 3"
          >
            <Heading3 size={14} />
          </button>
          <div className="w-px h-3.5 bg-slate-800 mx-1" />
          <button
            onClick={() => insertFormat('**', '**')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            onClick={() => insertFormat('*', '*')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            onClick={() => insertFormat('~~', '~~')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </button>
          <div className="w-px h-3.5 bg-slate-800 mx-1" />
          <button
            onClick={() => insertFormat('> ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Blockquote"
          >
            <Quote size={14} />
          </button>
          <button
            onClick={() => insertFormat('`', '`')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Inline Code"
          >
            <Code size={14} />
          </button>
          <button
            onClick={() => insertFormat('- ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Bullet list"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => insertFormat('1. ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Numbered list"
          >
            <ListOrdered size={14} />
          </button>
          <button
            onClick={() => insertFormat('- [ ] ')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Checklist item"
          >
            <CheckSquare size={14} />
          </button>
          <button
            onClick={() => insertFormat('| Column 1 | Column 2 |\n| :--- | :--- |\n| Data | Data |\n')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Table"
          >
            <Table size={14} />
          </button>
          <button
            onClick={() => insertFormat('\n---\n')}
            className="p-1 rounded hover:bg-slate-800 hover:text-slate-200"
            title="Horizontal Divider"
          >
            <Minus size={14} />
          </button>
        </div>
      )}

      {/* Editor & Preview Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Outline Sidebar */}
        {showOutline && (
          <div className="w-48 border-r border-slate-800 bg-slate-950/70 p-3 overflow-y-auto hidden md:block">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Table of Contents
            </div>
            {outline.length === 0 ? (
              <div className="text-slate-600 italic text-[11px]">Add headings (#, ##) to see outline</div>
            ) : (
              <div className="space-y-1">
                {outline.map((item, idx) => (
                  <div
                    key={idx}
                    style={{ paddingLeft: `${(item.level - 1) * 8}px` }}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 truncate cursor-pointer py-0.5"
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Editor Area */}
        {viewLayout !== 'preview' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden bg-slate-900/50">
            <textarea
              ref={textareaRef}
              value={activeDoc?.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing..."
              className="w-full flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-sans text-sm leading-relaxed select-text"
            />
          </div>
        )}

        {/* Live Formatted Markdown Preview */}
        {viewLayout !== 'editor' && (
          <div className="flex-1 border-l border-slate-800 bg-slate-950 p-6 overflow-y-auto select-text">
            {(!activeDoc?.content || activeDoc.content.trim() === '') ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic text-center p-8 select-none">
                <FileText size={28} className="mb-2 opacity-30 text-slate-500" />
                <span>Start writing to preview your document...</span>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-3 leading-relaxed">
                {(activeDoc?.content || '').split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-xl font-bold text-white border-b border-slate-800 pb-2 mt-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-base font-semibold text-slate-100 mt-4 mb-1">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="text-sm font-semibold text-indigo-400 mt-3">{line.slice(4)}</h3>;
                }
                if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
                  return (
                    <div key={idx} className="flex items-center gap-2 text-slate-400 line-through">
                      <input type="checkbox" checked readOnly className="rounded text-indigo-500" />
                      <span>{line.slice(6)}</span>
                    </div>
                  );
                }
                if (line.startsWith('- [ ] ')) {
                  return (
                    <div key={idx} className="flex items-center gap-2 text-slate-200">
                      <input type="checkbox" checked={false} readOnly className="rounded text-indigo-500" />
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
                    <blockquote key={idx} className="pl-3 border-l-2 border-indigo-500 text-slate-400 italic">
                      {line.slice(2)}
                    </blockquote>
                  );
                }
                if (line.startsWith('```')) {
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto my-2">
                      {line.replace(/```/g, '') || '// Code block'}
                    </div>
                  );
                }
                if (line.startsWith('---')) {
                  return <hr key={idx} className="border-slate-800 my-4" />;
                }
                if (line.startsWith('|')) {
                  return (
                    <div key={idx} className="font-mono text-xs text-slate-300 overflow-x-auto py-1">
                      {line}
                    </div>
                  );
                }
                if (line.trim() === '') {
                  return <div key={idx} className="h-2" />;
                }
                return <p key={idx} className="text-slate-300">{line}</p>;
              })}
            </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar with Word Count & Reading Time */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span>{metrics.words} words</span>
          <span>{metrics.chars} characters</span>
          <span>~{metrics.readingTimeMins} min read</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles size={11} />
          <span>Markdown Studio Engine v2.0</span>
        </div>
      </div>
    </div>
  );
};
