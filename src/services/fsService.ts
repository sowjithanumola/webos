import { VirtualFile, VirtualFolder, FileSystemState, FileType } from '../types/fs';
import { loadFromStorage, saveToStorage, StorageKeys } from './storage';

const ROOT_ID = 'root';
const HOME_ID = 'folder_home';
const USER_ID = 'folder_user';
const DOCS_ID = 'folder_documents';
const DOWNLOADS_ID = 'folder_downloads';
const PICTURES_ID = 'folder_pictures';
const TRASH_ID = 'folder_trash';

export const INITIAL_FS: FileSystemState = {
  rootId: ROOT_ID,
  nodes: {
    [ROOT_ID]: {
      id: ROOT_ID,
      name: '/',
      type: 'folder',
      path: '/',
      parentId: '',
      childrenIds: [HOME_ID],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSystem: true,
    } as VirtualFolder,

    [HOME_ID]: {
      id: HOME_ID,
      name: 'home',
      type: 'folder',
      path: '/home',
      parentId: ROOT_ID,
      childrenIds: [USER_ID],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSystem: true,
    } as VirtualFolder,

    [USER_ID]: {
      id: USER_ID,
      name: 'user',
      type: 'folder',
      path: '/home/user',
      parentId: HOME_ID,
      childrenIds: [DOCS_ID, DOWNLOADS_ID, PICTURES_ID, TRASH_ID],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSystem: true,
    } as VirtualFolder,

    [DOCS_ID]: {
      id: DOCS_ID,
      name: 'Documents',
      type: 'folder',
      path: '/home/user/Documents',
      parentId: USER_ID,
      childrenIds: ['file_welcome', 'file_guide', 'file_sample_code'],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as VirtualFolder,

    [DOWNLOADS_ID]: {
      id: DOWNLOADS_ID,
      name: 'Downloads',
      type: 'folder',
      path: '/home/user/Downloads',
      parentId: USER_ID,
      childrenIds: ['file_license'],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as VirtualFolder,

    [PICTURES_ID]: {
      id: PICTURES_ID,
      name: 'Pictures',
      type: 'folder',
      path: '/home/user/Pictures',
      parentId: USER_ID,
      childrenIds: ['file_abstract_svg'],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as VirtualFolder,

    [TRASH_ID]: {
      id: TRASH_ID,
      name: 'Trash',
      type: 'trash',
      path: '/home/user/Trash',
      parentId: USER_ID,
      childrenIds: [],
      size: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isSystem: true,
    } as VirtualFolder,

    // Seed Files
    file_welcome: {
      id: 'file_welcome',
      name: 'Welcome.md',
      type: 'markdown',
      path: '/home/user/Documents/Welcome.md',
      parentId: DOCS_ID,
      content: `# Welcome to WebOS

WebOS is a full-featured browser-based operating system built with React, TypeScript, and modern web standards.

## Features at a Glance
- **Virtual Filesystem**: Create, edit, rename, move, duplicate, and delete files and folders.
- **Window Management**: Drag, resize, minimize, maximize, snap, and switch windows.
- **Productivity Suite**:
  - **Notes**: Auto-saving notes with checklists and formatting.
  - **Text Editor**: Plain text and Markdown editing with live preview and find/replace.
  - **Calculator**: Safe mathematical evaluator with history and scientific functions.
  - **Terminal**: Unix-style shell linked directly to your virtual filesystem.
- **Utilities**:
  - **Clock & Stopwatch & Timer**: Audio alerts and lap counter.
  - **Calendar**: Interactive monthly view with persistent events.
  - **Image Viewer & Media Player**: View images and listen to audio.
- **Data & Privacy**:
  - 100% client-side. Zero external servers.
  - Complete backup and restore via JSON.

Double-click on any file to open it in its default app!`,
      size: 1042,
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },

    file_guide: {
      id: 'file_guide',
      name: 'Keyboard_Shortcuts.txt',
      type: 'text',
      path: '/home/user/Documents/Keyboard_Shortcuts.txt',
      parentId: DOCS_ID,
      content: `WebOS System Keyboard Shortcuts:

Global Navigation:
- Alt + Tab : Switch between open application windows
- Escape    : Close context menus, modals, and app launcher
- Alt + Space / Win : Open Application Launcher

Application Window Controls:
- Ctrl + S  : Save file in Text Editor or Notes
- Ctrl + F  : Search within active application
- Ctrl + W  : Close active window
- Ctrl + M  : Minimize active window
- F11       : Toggle window maximize / restore

Terminal Commands:
- help      : Show list of available terminal commands
- ls [dir]  : List files in current or specified folder
- cd <dir>  : Change working directory
- pwd       : Print working directory
- mkdir <n> : Create a new directory
- touch <n> : Create a new empty file
- cat <f>   : Display file content
- rm <f>    : Remove a file
- clear     : Clear terminal output
- webfetch  : Display WebOS system specifications`,
      size: 920,
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
    },

    file_sample_code: {
      id: 'file_sample_code',
      name: 'Algorithm.js',
      type: 'code',
      path: '/home/user/Documents/Algorithm.js',
      parentId: DOCS_ID,
      content: `// Binary Search Algorithm
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Index of 23:", binarySearch(numbers, 23));`,
      size: 420,
      createdAt: Date.now() - 10800000,
      updatedAt: Date.now() - 10800000,
    },

    file_license: {
      id: 'file_license',
      name: 'LICENSE.txt',
      type: 'text',
      path: '/home/user/Downloads/LICENSE.txt',
      parentId: DOWNLOADS_ID,
      content: `Apache License 2.0
Licensed under the Apache License, Version 2.0 (the "License").
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0`,
      size: 160,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },

    file_abstract_svg: {
      id: 'file_abstract_svg',
      name: 'Cosmic_Orbit.svg',
      type: 'image',
      path: '/home/user/Pictures/Cosmic_Orbit.svg',
      parentId: PICTURES_ID,
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="g1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="60%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="400" fill="#0b0f19" />
  <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(99,102,241,0.2)" stroke-width="1.5" stroke-dasharray="6 4" />
  <circle cx="200" cy="200" r="90" fill="none" stroke="rgba(56,189,248,0.3)" stroke-width="1.5" />
  <circle cx="200" cy="200" r="42" fill="url(#g1)" filter="url(#glow)" />
  <circle cx="110" cy="150" r="8" fill="#38bdf8" filter="url(#glow)" />
  <circle cx="270" cy="250" r="6" fill="#a855f7" filter="url(#glow)" />
</svg>`,
      size: 1100,
      createdAt: Date.now() - 50000000,
      updatedAt: Date.now() - 50000000,
    },
  },
};

export class FileSystemService {
  private state: FileSystemState;
  private currentUserId: string | null = null;
  private listeners: ((state: FileSystemState) => void)[] = [];

  constructor() {
    this.state = loadFromStorage<FileSystemState>(StorageKeys.FILESYSTEM, INITIAL_FS);
    // Sanity check to ensure required folders exist
    if (!this.state.nodes[ROOT_ID] || !this.state.nodes[TRASH_ID]) {
      this.state = JSON.parse(JSON.stringify(INITIAL_FS));
      this.persist();
    }
  }

  public subscribe(listener: (state: FileSystemState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    const freshState = this.getState();
    this.listeners.forEach((l) => l(freshState));
  }

  private persist(): void {
    saveToStorage(StorageKeys.FILESYSTEM, this.state, this.currentUserId);
    this.notifyListeners();
  }

  public switchUser(newUserId: string | null): void {
    this.currentUserId = newUserId;
    const loaded = loadFromStorage<FileSystemState>(
      StorageKeys.FILESYSTEM,
      INITIAL_FS,
      newUserId
    );
    if (!loaded.nodes[ROOT_ID] || !loaded.nodes[TRASH_ID]) {
      this.state = JSON.parse(JSON.stringify(INITIAL_FS));
    } else {
      this.state = loaded;
    }
    this.notifyListeners();
  }

  public resetUserFiles(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_FS));
    this.persist();
  }

  public syncCloudFiles(cloudFiles: Record<string, VirtualFile>): void {
    let changed = false;
    for (const [id, file] of Object.entries(cloudFiles)) {
      if (!this.state.nodes[id]) {
        this.state.nodes[id] = file;
        const parent = this.state.nodes[file.parentId] as VirtualFolder | undefined;
        if (parent && parent.childrenIds && !parent.childrenIds.includes(id)) {
          parent.childrenIds.push(id);
        }
        changed = true;
      }
    }
    if (changed) {
      this.persist();
    }
  }

  public getState(): FileSystemState {
    return {
      rootId: this.state.rootId,
      nodes: { ...this.state.nodes },
    };
  }

  public getNode(id: string): VirtualFile | undefined {
    return this.state.nodes[id];
  }

  public getNodeByPath(path: string): VirtualFile | undefined {
    const normalized = this.normalizePath(path);
    return Object.values(this.state.nodes).find((n) => n.path === normalized);
  }

  public getChildren(folderId: string): VirtualFile[] {
    const folder = this.state.nodes[folderId] as VirtualFolder;
    if (!folder || !folder.childrenIds) return [];
    return folder.childrenIds
      .map((id) => this.state.nodes[id])
      .filter((n): n is VirtualFile => Boolean(n));
  }

  public normalizePath(path: string, currentWorkingDir: string = '/home/user'): string {
    let p = path.trim();
    if (p.startsWith('~')) {
      p = '/home/user' + p.slice(1);
    } else if (!p.startsWith('/')) {
      p = `${currentWorkingDir}/${p}`;
    }

    const segments = p.split('/').filter(Boolean);
    const resolved: string[] = [];

    for (const seg of segments) {
      if (seg === '.') continue;
      if (seg === '..') {
        resolved.pop();
      } else {
        resolved.push(seg);
      }
    }

    return '/' + resolved.join('/');
  }

  public createFolder(parentId: string, name: string): VirtualFolder {
    const parent = this.state.nodes[parentId] as VirtualFolder;
    if (!parent) throw new Error('Parent directory not found');

    const cleanName = name.trim();
    if (!cleanName) throw new Error('Folder name cannot be empty');
    if (cleanName.includes('/')) throw new Error('Folder name cannot contain "/"');

    const existingChildren = this.getChildren(parentId);
    if (existingChildren.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Item named "${cleanName}" already exists in this folder`);
    }

    const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const folderPath = parent.path === '/' ? `/${cleanName}` : `${parent.path}/${cleanName}`;

    const newFolder: VirtualFolder = {
      id,
      name: cleanName,
      type: 'folder',
      path: folderPath,
      parentId,
      childrenIds: [],
      size: 4096,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.state.nodes[id] = newFolder;
    parent.childrenIds = [...parent.childrenIds, id];
    parent.updatedAt = Date.now();

    this.persist();
    return newFolder;
  }

  public createFile(parentId: string, name: string, content: string = '', type?: FileType): VirtualFile {
    const parent = this.state.nodes[parentId] as VirtualFolder;
    if (!parent) throw new Error('Parent directory not found');

    const cleanName = name.trim();
    if (!cleanName) throw new Error('File name cannot be empty');
    if (cleanName.includes('/')) throw new Error('File name cannot contain "/"');

    const existingChildren = this.getChildren(parentId);
    if (existingChildren.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Item named "${cleanName}" already exists in this folder`);
    }

    let detectedType: FileType = type || 'text';
    if (!type) {
      if (cleanName.endsWith('.md')) detectedType = 'markdown';
      else if (cleanName.endsWith('.json')) detectedType = 'json';
      else if (cleanName.endsWith('.js') || cleanName.endsWith('.ts') || cleanName.endsWith('.py')) detectedType = 'code';
      else if (cleanName.endsWith('.svg') || cleanName.endsWith('.png') || cleanName.endsWith('.jpg')) detectedType = 'image';
      else if (cleanName.endsWith('.mp3') || cleanName.endsWith('.wav')) detectedType = 'audio';
    }

    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const filePath = parent.path === '/' ? `/${cleanName}` : `${parent.path}/${cleanName}`;

    const newFile: VirtualFile = {
      id,
      name: cleanName,
      type: detectedType,
      path: filePath,
      parentId,
      content,
      size: new Blob([content]).size,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.state.nodes[id] = newFile;
    parent.childrenIds = [...parent.childrenIds, id];
    parent.updatedAt = Date.now();

    this.persist();
    return newFile;
  }

  public updateContent(fileId: string, content: string): VirtualFile {
    const file = this.state.nodes[fileId];
    if (!file) throw new Error('File not found');
    if (file.type === 'folder' || file.type === 'trash') throw new Error('Cannot write content to folder');

    file.content = content;
    file.size = new Blob([content]).size;
    file.updatedAt = Date.now();

    this.persist();
    return file;
  }

  public rename(nodeId: string, newName: string): VirtualFile {
    const node = this.state.nodes[nodeId];
    if (!node) throw new Error('Node not found');
    if (node.isSystem) throw new Error('System items cannot be renamed');

    const clean = newName.trim();
    if (!clean) throw new Error('Name cannot be empty');
    if (clean.includes('/')) throw new Error('Name cannot contain "/"');

    const parent = this.state.nodes[node.parentId] as VirtualFolder;
    if (parent) {
      const siblings = this.getChildren(node.parentId);
      if (siblings.some((s) => s.id !== nodeId && s.name.toLowerCase() === clean.toLowerCase())) {
        throw new Error(`An item named "${clean}" already exists in this folder`);
      }
    }

    node.name = clean;
    const oldPath = node.path;
    const pathSegments = oldPath.split('/');
    pathSegments[pathSegments.length - 1] = clean;
    const newPath = pathSegments.join('/');
    node.path = newPath;
    node.updatedAt = Date.now();

    // If it is a folder, recursively update paths of children
    if (node.type === 'folder') {
      this.updateDescendantPaths(nodeId, newPath);
    }

    this.persist();
    return node;
  }

  private updateDescendantPaths(folderId: string, currentPath: string): void {
    const folder = this.state.nodes[folderId] as VirtualFolder;
    if (!folder || !folder.childrenIds) return;

    for (const childId of folder.childrenIds) {
      const child = this.state.nodes[childId];
      if (!child) continue;
      const childPath = `${currentPath}/${child.name}`;
      child.path = childPath;
      if (child.type === 'folder') {
        this.updateDescendantPaths(childId, childPath);
      }
    }
  }

  public deleteNode(nodeId: string, permanent: boolean = false): boolean {
    const node = this.state.nodes[nodeId];
    if (!node) return false;
    if (node.isSystem) throw new Error('System items cannot be deleted');

    const parentId = node.parentId;
    const isAlreadyInTrash = parentId === TRASH_ID;

    if (permanent || isAlreadyInTrash) {
      // 1. Remove from parent's children list
      if (parentId && this.state.nodes[parentId]) {
        const parent = this.state.nodes[parentId] as VirtualFolder;
        if (parent && parent.childrenIds) {
          parent.childrenIds = parent.childrenIds.filter((id) => id !== nodeId);
          parent.updatedAt = Date.now();
        }
      }

      // Also remove from trash if it was listed there
      const trash = this.state.nodes[TRASH_ID] as VirtualFolder;
      if (trash && trash.childrenIds) {
        trash.childrenIds = trash.childrenIds.filter((id) => id !== nodeId);
        trash.updatedAt = Date.now();
      }

      // 2. Recursively delete item and all descendant children
      this.recursivelyDelete(nodeId);
      this.state.nodes = { ...this.state.nodes };
      this.persist();
      return true;
    }

    // Soft delete: move to Trash
    if (parentId && this.state.nodes[parentId]) {
      const oldParent = this.state.nodes[parentId] as VirtualFolder;
      if (oldParent && oldParent.childrenIds) {
        oldParent.childrenIds = oldParent.childrenIds.filter((id) => id !== nodeId);
        oldParent.updatedAt = Date.now();
      }
    }

    const trash = this.state.nodes[TRASH_ID] as VirtualFolder;
    node.originalPath = node.path;
    node.parentId = TRASH_ID;
    node.path = `/home/user/Trash/${node.name}`;
    node.updatedAt = Date.now();

    if (trash) {
      trash.childrenIds = Array.from(new Set([...(trash.childrenIds || []).filter((id) => id !== nodeId), nodeId]));
      trash.updatedAt = Date.now();
    }

    this.state.nodes = { ...this.state.nodes };
    this.persist();
    return true;
  }

  public restoreFromTrash(nodeId: string): boolean {
    const node = this.state.nodes[nodeId];
    if (!node || node.parentId !== TRASH_ID) return false;

    const trash = this.state.nodes[TRASH_ID] as VirtualFolder;
    if (trash && trash.childrenIds) {
      trash.childrenIds = trash.childrenIds.filter((id) => id !== nodeId);
      trash.updatedAt = Date.now();
    }

    // Find original destination or default to Documents
    const originalPath = node.originalPath || `/home/user/Documents/${node.name}`;
    const segments = originalPath.split('/');
    segments.pop(); // remove filename
    const parentPath = segments.join('/') || '/home/user/Documents';
    const targetParent =
      (Object.values(this.state.nodes).find((n) => n.path === parentPath && n.type === 'folder') as VirtualFolder) ||
      (this.state.nodes[DOCS_ID] as VirtualFolder);

    node.parentId = targetParent.id;
    node.path = `${targetParent.path}/${node.name}`;
    node.originalPath = undefined;
    node.updatedAt = Date.now();

    targetParent.childrenIds = Array.from(new Set([...(targetParent.childrenIds || []), nodeId]));
    targetParent.updatedAt = Date.now();

    this.state.nodes = { ...this.state.nodes };
    this.persist();
    return true;
  }

  public emptyTrash(): void {
    const trash = this.state.nodes[TRASH_ID] as VirtualFolder;
    if (!trash) return;

    const idsToDelete = [...(trash.childrenIds || [])];
    for (const childId of idsToDelete) {
      this.recursivelyDelete(childId);
    }
    trash.childrenIds = [];
    trash.updatedAt = Date.now();
    this.state.nodes = { ...this.state.nodes };
    this.persist();
  }

  private recursivelyDelete(nodeId: string): void {
    const node = this.state.nodes[nodeId];
    if (!node) return;

    if (node.type === 'folder' || node.type === 'trash') {
      const folder = node as VirtualFolder;
      if (folder.childrenIds && folder.childrenIds.length > 0) {
        for (const childId of folder.childrenIds) {
          this.recursivelyDelete(childId);
        }
      }
    }
    delete this.state.nodes[nodeId];
  }

  public moveNode(nodeId: string, newParentId: string): boolean {
    const node = this.state.nodes[nodeId];
    const newParent = this.state.nodes[newParentId] as VirtualFolder;
    if (!node || !newParent) return false;
    if (node.isSystem) throw new Error('Cannot move system items');
    if (node.id === newParentId) throw new Error('Cannot move folder into itself');

    // Prevent moving folder into its own descendants
    if (node.type === 'folder' && newParent.path.startsWith(node.path)) {
      throw new Error('Cannot move folder into its own subfolder');
    }

    const oldParent = this.state.nodes[node.parentId] as VirtualFolder;
    if (oldParent) {
      oldParent.childrenIds = oldParent.childrenIds.filter((id) => id !== nodeId);
    }

    node.parentId = newParentId;
    const newPath = newParent.path === '/' ? `/${node.name}` : `${newParent.path}/${node.name}`;
    node.path = newPath;
    node.updatedAt = Date.now();

    if (node.type === 'folder') {
      this.updateDescendantPaths(nodeId, newPath);
    }

    newParent.childrenIds = [...newParent.childrenIds, nodeId];
    newParent.updatedAt = Date.now();

    this.persist();
    return true;
  }

  public duplicateNode(nodeId: string): VirtualFile {
    const node = this.state.nodes[nodeId];
    if (!node) throw new Error('Item not found');
    if (node.isSystem) throw new Error('System items cannot be duplicated');

    const parent = this.state.nodes[node.parentId] as VirtualFolder;
    if (!parent) throw new Error('Parent not found');

    const nameParts = node.name.split('.');
    let baseName = nameParts[0];
    const ext = nameParts.length > 1 ? `.${nameParts.slice(1).join('.')}` : '';
    let copyName = `${baseName} (Copy)${ext}`;
    let counter = 2;

    const existingNames = this.getChildren(node.parentId).map((c) => c.name.toLowerCase());
    while (existingNames.includes(copyName.toLowerCase())) {
      copyName = `${baseName} (Copy ${counter})${ext}`;
      counter++;
    }

    if (node.type === 'folder') {
      const newFolder = this.createFolder(node.parentId, copyName);
      // Recursively duplicate children
      const folder = node as VirtualFolder;
      for (const childId of folder.childrenIds) {
        this.duplicateChildToFolder(childId, newFolder.id);
      }
      return newFolder;
    } else {
      return this.createFile(node.parentId, copyName, node.content || '', node.type);
    }
  }

  private duplicateChildToFolder(childId: string, destFolderId: string): void {
    const child = this.state.nodes[childId];
    if (!child) return;
    if (child.type === 'folder') {
      const newSub = this.createFolder(destFolderId, child.name);
      const subFolder = child as VirtualFolder;
      for (const subChildId of subFolder.childrenIds) {
        this.duplicateChildToFolder(subChildId, newSub.id);
      }
    } else {
      this.createFile(destFolderId, child.name, child.content || '', child.type);
    }
  }

  public exportFile(fileId: string): void {
    const file = this.state.nodes[fileId];
    if (!file || file.type === 'folder') return;

    let blob: Blob;
    if (file.content?.startsWith('data:')) {
      // Base64 data URL
      const arr = file.content.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mime });
    } else {
      blob = new Blob([file.content || ''], { type: 'text/plain;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public resetToFactory(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_FS));
    this.persist();
  }

  public loadFromBackup(backupState: FileSystemState): boolean {
    if (!backupState || !backupState.nodes || !backupState.rootId) return false;
    this.state = backupState;
    this.persist();
    return true;
  }
}

export const fsService = new FileSystemService();
