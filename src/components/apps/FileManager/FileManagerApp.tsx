import React, { useState, useMemo, useRef } from 'react';
import {
  Folder,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Search,
  Grid,
  List,
  Upload,
  Download,
  Plus,
  Trash2,
  Copy,
  Edit2,
  RefreshCw,
  HardDrive,
  FilePlus,
  FolderPlus,
  AlertTriangle,
} from 'lucide-react';
import { useOS } from '../../../context/OSContext';
import { VirtualFile, VirtualFolder, FileType } from '../../../types/fs';
import { FileIcon } from '../../common/AppIcon';

export const FileManagerApp: React.FC = () => {
  const {
    fs,
    createFolder,
    createFile,
    renameFSNode,
    deleteFSNode,
    restoreFromTrash,
    emptyTrash,
    duplicateFSNode,
    exportFSFile,
    moveFSNode,
    openWindow,
    addNotification,
  } = useOS();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string>('folder_documents');
  const [history, setHistory] = useState<string[]>(['folder_documents']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Search & view modes
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & prompts
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    type: 'newFile' | 'newFolder' | 'rename';
    title: string;
    value: string;
    targetId?: string;
  }>({
    isOpen: false,
    type: 'newFolder',
    title: '',
    value: '',
  });

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    permanent: boolean;
    targetIds: string[];
  }>({
    isOpen: false,
    permanent: false,
    targetIds: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFolder = (fs.nodes[currentFolderId] as VirtualFolder) || (fs.nodes['folder_user'] as VirtualFolder);
  const isCurrentTrash = currentFolder?.type === 'trash';

  // Navigate to folder
  const navigateTo = (folderId: string) => {
    if (!fs.nodes[folderId]) return;
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(folderId);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setCurrentFolderId(folderId);
    setSelectedIds([]);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentFolderId(history[newIdx]);
      setSelectedIds([]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentFolderId(history[newIdx]);
      setSelectedIds([]);
    }
  };

  const goUp = () => {
    if (currentFolder && currentFolder.parentId && fs.nodes[currentFolder.parentId]) {
      navigateTo(currentFolder.parentId);
    }
  };

  // Get children and apply search + sort
  const items = useMemo(() => {
    if (!currentFolder || !currentFolder.childrenIds) return [];

    let list = currentFolder.childrenIds
      .map((id) => fs.nodes[id])
      .filter((n): n is VirtualFile => Boolean(n));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      // Folders first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let valA: string | number = a.name.toLowerCase();
      let valB: string | number = b.name.toLowerCase();

      if (sortBy === 'date') {
        valA = a.updatedAt;
        valB = b.updatedAt;
      } else if (sortBy === 'size') {
        valA = a.size;
        valB = b.size;
      } else if (sortBy === 'type') {
        valA = a.type;
        valB = b.type;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [currentFolder, fs.nodes, searchQuery, sortBy, sortOrder]);

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string; name: string }[] = [];
    let curr: VirtualFile | undefined = currentFolder;
    while (curr) {
      crumbs.unshift({ id: curr.id, name: curr.name });
      curr = curr.parentId ? fs.nodes[curr.parentId] : undefined;
    }
    return crumbs;
  }, [currentFolder, fs.nodes]);

  // Handle open item
  const handleOpenItem = (item: VirtualFile) => {
    if (item.type === 'folder' || item.type === 'trash') {
      navigateTo(item.id);
    } else if (item.type === 'markdown' || item.type === 'text' || item.type === 'code' || item.type === 'json') {
      openWindow('text-editor', {
        title: `${item.name} — Text Editor`,
        payload: { fileId: item.id, filePath: item.path },
      });
    } else if (item.type === 'image') {
      openWindow('image-viewer', {
        title: `${item.name} — Image Viewer`,
        payload: { fileId: item.id, filePath: item.path },
      });
    } else if (item.type === 'audio') {
      openWindow('media-player', {
        title: `${item.name} — Media Player`,
        payload: { fileId: item.id, filePath: item.path },
      });
    }
  };

  // Toggle selection
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  // Import from real computer
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          let fileType: FileType = 'text';
          if (isImg) fileType = 'image';
          else if (file.name.endsWith('.md')) fileType = 'markdown';
          else if (file.name.endsWith('.json')) fileType = 'json';
          else if (file.name.endsWith('.js') || file.name.endsWith('.ts')) fileType = 'code';

          createFile(currentFolderId, file.name, content, fileType);
          addNotification('File Imported', `Imported "${file.name}" into WebOS storage.`, 'success');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          addNotification('Import Error', msg, 'error');
        }
      };

      if (isImg) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm delete handler
  const executeDelete = () => {
    const permanent = confirmDeleteModal.permanent;
    let deletedCount = 0;
    confirmDeleteModal.targetIds.forEach((id) => {
      try {
        const ok = deleteFSNode(id, permanent);
        if (ok) deletedCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error deleting item';
        addNotification('Delete Error', msg, 'error');
      }
    });
    if (deletedCount > 0) {
      addNotification(
        permanent ? 'Deleted Permanently' : 'Moved to Trash',
        `${deletedCount} item(s) ${permanent ? 'permanently deleted' : 'moved to Trash'}.`,
        'success'
      );
    }
    setSelectedIds([]);
    setConfirmDeleteModal({ isOpen: false, permanent: false, targetIds: [] });
  };

  // Format bytes
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Sidebar shortcuts
  const sidebarItems = [
    { id: 'folder_user', name: 'Home', icon: HardDrive },
    { id: 'folder_documents', name: 'Documents', icon: Folder },
    { id: 'folder_downloads', name: 'Downloads', icon: Download },
    { id: 'folder_pictures', name: 'Pictures', icon: Folder },
    { id: 'folder_trash', name: 'Trash', icon: Trash2 },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-slate-900/95 text-slate-200 text-xs select-none">
      {/* Top Navigation & Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-950/60 gap-2">
        {/* Nav arrows & Breadcrumbs */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={goBack}
            disabled={historyIndex === 0}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Back"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Forward"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={goUp}
            disabled={!currentFolder?.parentId}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Up one folder"
          >
            <ArrowUp size={14} />
          </button>

          {/* Breadcrumb pills */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <span className="text-slate-500">/</span>}
                <button
                  onClick={() => navigateTo(crumb.id)}
                  className={`hover:text-blue-400 truncate ${idx === breadcrumbs.length - 1 ? 'font-medium text-slate-100' : 'text-slate-400'}`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Search Bar & View Mode */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded pl-7 pr-2 py-1 w-36 focus:w-48 transition-all focus:outline-none focus:border-blue-500 text-slate-200 select-text"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid View"
            >
              <Grid size={13} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-slate-800 text-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
              title="List View"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-1.5 bg-slate-950/30">
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isCurrentTrash && (
            <>
              <button
                onClick={() =>
                  setPromptModal({
                    isOpen: true,
                    type: 'newFolder',
                    title: 'New Folder',
                    value: 'New Folder',
                  })
                }
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <FolderPlus size={13} className="text-blue-400" />
                <span>New Folder</span>
              </button>

              <button
                onClick={() =>
                  setPromptModal({
                    isOpen: true,
                    type: 'newFile',
                    title: 'New File',
                    value: 'Document.txt',
                  })
                }
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                <FilePlus size={13} className="text-indigo-400" />
                <span>New File</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Import local files from your device into WebOS virtual storage"
              >
                <Upload size={13} className="text-emerald-400" />
                <span>Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleImportFile}
              />
            </>
          )}

          {isCurrentTrash && (
            <button
              onClick={emptyTrash}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50"
            >
              <Trash2 size={13} />
              <span>Empty Trash</span>
            </button>
          )}

          {selectedIds.length === 1 && !isCurrentTrash && (
            <>
              <button
                onClick={() => {
                  const node = fs.nodes[selectedIds[0]];
                  if (node && !node.isSystem) {
                    setPromptModal({
                      isOpen: true,
                      type: 'rename',
                      title: 'Rename',
                      value: node.name,
                      targetId: node.id,
                    });
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300"
              >
                <Edit2 size={12} />
                <span>Rename</span>
              </button>

              <button
                onClick={() => duplicateFSNode(selectedIds[0])}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300"
              >
                <Copy size={12} />
                <span>Duplicate</span>
              </button>

              {fs.nodes[selectedIds[0]]?.type !== 'folder' && (
                <button
                  onClick={() => exportFSFile(selectedIds[0])}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300"
                  title="Download this file to your computer"
                >
                  <Download size={12} className="text-cyan-400" />
                  <span>Export</span>
                </button>
              )}
            </>
          )}

          {selectedIds.length > 0 && isCurrentTrash && (
            <button
              onClick={() => {
                selectedIds.forEach((id) => restoreFromTrash(id));
                setSelectedIds([]);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300"
            >
              <RefreshCw size={12} />
              <span>Restore Selected</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={() =>
                setConfirmDeleteModal({
                  isOpen: true,
                  permanent: isCurrentTrash,
                  targetIds: selectedIds,
                })
              }
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-950/50 text-rose-300 transition-colors"
            >
              <Trash2 size={12} />
              <span>{isCurrentTrash ? 'Delete Permanently' : 'Delete'}</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          <span>{items.length} items</span>
          {selectedIds.length > 0 && <span> · {selectedIds.length} selected</span>}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-44 border-r border-slate-800 bg-slate-950/40 p-2 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Locations
            </div>
            {sidebarItems.map((sb) => {
              const IconComp = sb.icon;
              const isActive = currentFolderId === sb.id;
              return (
                <button
                  key={sb.id}
                  onClick={() => navigateTo(sb.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <IconComp size={14} className={isActive ? 'text-blue-400' : 'text-slate-400'} />
                  <span className="truncate">{sb.name}</span>
                </button>
              );
            })}
          </div>

          {/* Virtual Storage Notice */}
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <HardDrive size={11} className="text-blue-400" />
              <span>Virtual Storage</span>
            </div>
            <p className="leading-tight text-slate-400">
              Isolated WebOS filesystem stored locally in your browser.
            </p>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div
          className="flex-1 overflow-y-auto p-4 select-none"
          onClick={() => setSelectedIds([])}
        >
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <Folder size={36} className="text-slate-400/50" />
              <p className="text-sm">Folder is empty</p>
              {!isCurrentTrash && (
                <button
                  onClick={() =>
                    setPromptModal({
                      isOpen: true,
                      type: 'newFile',
                      title: 'Create Document',
                      value: 'Notes.txt',
                    })
                  }
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                >
                  Create a file
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(e, item.id);
                    }}
                    onDoubleClick={() => handleOpenItem(item)}
                    className={`flex flex-col items-center p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/25 border-blue-500/60 text-white shadow-sm'
                        : 'border-transparent hover:bg-slate-800/60 hover:border-slate-700/50 text-slate-200'
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-1.5">
                      <FileIcon type={item.type} name={item.name} size={32} />
                    </div>
                    <span className="text-center text-xs truncate max-w-full px-1" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {item.type === 'folder' ? 'Folder' : formatSize(item.size)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full">
              <div className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-800 text-[11px] font-medium text-slate-400 px-2">
                <span className="col-span-6">Name</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-2">Size</span>
                <span className="col-span-2">Modified</span>
              </div>
              <div className="divide-y divide-slate-800/40">
                {items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(e, item.id);
                      }}
                      onDoubleClick={() => handleOpenItem(item)}
                      className={`grid grid-cols-12 gap-2 py-1.5 px-2 items-center cursor-pointer rounded transition-colors ${
                        isSelected
                          ? 'bg-blue-600/25 text-white'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="col-span-6 flex items-center gap-2 truncate">
                        <FileIcon type={item.type} name={item.name} size={15} />
                        <span className="truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <span className="col-span-2 text-slate-400 uppercase text-[10px]">
                        {item.type}
                      </span>
                      <span className="col-span-2 text-slate-400 tabular-nums">
                        {item.type === 'folder' ? '—' : formatSize(item.size)}
                      </span>
                      <span className="col-span-2 text-slate-400 tabular-nums text-[10px]">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Modal (Create / Rename) */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-80 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl">
            <h3 className="font-semibold text-sm text-slate-100 mb-2">{promptModal.title}</h3>
            <input
              type="text"
              autoFocus
              value={promptModal.value}
              onChange={(e) => setPromptModal((prev) => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = promptModal.value.trim();
                  if (!val) return;
                  if (promptModal.type === 'newFolder') {
                    createFolder(currentFolderId, val);
                  } else if (promptModal.type === 'newFile') {
                    createFile(currentFolderId, val, '');
                  } else if (promptModal.type === 'rename' && promptModal.targetId) {
                    renameFSNode(promptModal.targetId, val);
                  }
                  setPromptModal((prev) => ({ ...prev, isOpen: false }));
                } else if (e.key === 'Escape') {
                  setPromptModal((prev) => ({ ...prev, isOpen: false }));
                }
              }}
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-700 focus:outline-none focus:border-blue-500 text-slate-200 select-text mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = promptModal.value.trim();
                  if (!val) return;
                  if (promptModal.type === 'newFolder') {
                    createFolder(currentFolderId, val);
                  } else if (promptModal.type === 'newFile') {
                    createFile(currentFolderId, val, '');
                  } else if (promptModal.type === 'rename' && promptModal.targetId) {
                    renameFSNode(promptModal.targetId, val);
                  }
                  setPromptModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-80 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-2 font-semibold">
              <AlertTriangle size={16} />
              <span>{confirmDeleteModal.permanent ? 'Permanent Deletion' : 'Move to Trash'}</span>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              {confirmDeleteModal.permanent
                ? `Are you sure you want to permanently delete ${confirmDeleteModal.targetIds.length} item(s)? This action cannot be undone.`
                : `Move ${confirmDeleteModal.targetIds.length} item(s) to the WebOS Trash?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteModal({ isOpen: false, permanent: false, targetIds: [] })}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium"
              >
                {confirmDeleteModal.permanent ? 'Delete Forever' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
