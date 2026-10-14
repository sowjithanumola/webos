import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Pin,
  Clock,
  CheckSquare,
  List,
  Heading1,
  Heading2,
  Bold,
  Italic,
  FileText,
  Check,
} from 'lucide-react';
import { NoteItem } from '../../../types/notes';
import { loadFromStorage, saveToStorage, StorageKeys } from '../../../services/storage';

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note_1',
    title: 'Project Roadmap',
    content: `# WebOS System Roadmap
- [x] Complete modular window manager
- [x] Integrate virtual filesystem
- [x] Support terminal commands
- [ ] Build additional utilities and media tools
- [ ] Add customizable desktop widgets`,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    pinned: true,
    category: 'Work',
  },
  {
    id: 'note_2',
    title: 'Meeting Notes',
    content: `## Architecture Sync
Discussed client-side persistence and Web Audio API integration.
Next steps:
- Ensure 100% offline functionality
- Zero external network dependencies`,
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
    pinned: false,
    category: 'Ideas',
  },
];

export const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    loadFromStorage<NoteItem[]>(StorageKeys.NOTES, INITIAL_NOTES)
  );

  const [activeNoteId, setActiveNoteId] = useState<string>(() =>
    notes.length > 0 ? notes[0].id : ''
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeNote = useMemo(() => notes.find((n) => n.id === activeNoteId), [notes, activeNoteId]);

  // Persist notes
  useEffect(() => {
    saveToStorage(StorageKeys.NOTES, notes);
  }, [notes]);

  const createNewNote = () => {
    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const deleteCurrentNote = () => {
    if (!activeNoteId) return;
    const remaining = notes.filter((n) => n.id !== activeNoteId);
    setNotes(remaining);
    setActiveNoteId(remaining.length > 0 ? remaining[0].id : '');
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleContentChange = (content: string) => {
    setIsSaved(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Derive title from first line
    const lines = content.trim().split('\n');
    let title = lines[0] ? lines[0].replace(/^[#\s\-\*\[\]x]+/, '').trim() : 'Untitled Note';
    if (!title) title = 'Untitled Note';
    if (title.length > 40) title = title.substring(0, 40) + '...';

    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeNoteId
          ? {
              ...n,
              title,
              content,
              updatedAt: Date.now(),
            }
          : n
      )
    );

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaved(true);
    }, 400);
  };

  // Formatting insert helpers
  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('notes-editor') as HTMLTextAreaElement;
    if (!textarea || !activeNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeNote.content;
    const selected = current.substring(start, end);

    const replacement = `${prefix}${selected}${suffix}`;
    const updated = current.substring(0, start) + replacement + current.substring(end);

    handleContentChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, searchQuery]);

  return (
    <div className="flex h-full w-full bg-slate-900/95 text-slate-200 select-none text-xs">
      {/* Sidebar Note List */}
      <div className="w-56 border-r border-slate-800 bg-slate-950/40 flex flex-col justify-between">
        <div>
          {/* Header & Search */}
          <div className="p-2 border-b border-slate-800 flex items-center justify-between gap-1">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 select-text"
              />
            </div>
            <button
              onClick={createNewNote}
              className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              title="Create New Note"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Notes items */}
          <div className="overflow-y-auto max-h-[calc(100vh-220px)] p-1.5 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No notes found</div>
            ) : (
              filteredNotes.map((note) => {
                const isActive = note.id === activeNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    className={`group p-2 rounded-lg cursor-pointer transition-colors border ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500/40 text-slate-100'
                        : 'border-transparent hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate text-xs">{note.title}</span>
                      <button
                        onClick={(e) => togglePin(note.id, e)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-700 ${
                          note.pinned ? 'opacity-100 text-amber-400' : 'text-slate-500'
                        }`}
                        title={note.pinned ? 'Unpin' : 'Pin note'}
                      >
                        <Pin size={11} className={note.pinned ? 'fill-amber-400' : ''} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate line-clamp-1 mb-1">
                      {note.content.replace(/[#\-\*]/g, '').trim() || 'No additional text'}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      {note.pinned && <span className="text-amber-400/80">Pinned</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{notes.length} total notes</span>
        </div>
      </div>

      {/* Editor & Formatting View */}
      <div className="flex-1 flex flex-col bg-slate-900/80">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 bg-slate-950/40">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => insertText('# ')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Heading 1"
                >
                  <Heading1 size={14} />
                </button>
                <button
                  onClick={() => insertText('## ')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Heading 2"
                >
                  <Heading2 size={14} />
                </button>
                <div className="w-px h-3.5 bg-slate-800 mx-1" />
                <button
                  onClick={() => insertText('**', '**')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => insertText('*', '*')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
                <div className="w-px h-3.5 bg-slate-800 mx-1" />
                <button
                  onClick={() => insertText('- ')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Bullet List"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => insertText('- [ ] ')}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Checklist Item"
                >
                  <CheckSquare size={14} />
                </button>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  {isSaved ? (
                    <>
                      <Check size={11} className="text-emerald-400" />
                      <span>Autosaved</span>
                    </>
                  ) : (
                    <>
                      <Clock size={11} className="text-amber-400 animate-spin" />
                      <span>Saving...</span>
                    </>
                  )}
                </span>
                <button
                  onClick={deleteCurrentNote}
                  className="p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Note Textarea */}
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                id="notes-editor"
                value={activeNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start typing your note here... Use # for headings and - [ ] for checklists."
                className="w-full flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none font-sans text-sm leading-relaxed select-text"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <FileText size={40} className="text-slate-600" />
            <p>No note selected</p>
            <button
              onClick={createNewNote}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
