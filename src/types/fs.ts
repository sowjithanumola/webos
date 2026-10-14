export type FileType = 'folder' | 'text' | 'markdown' | 'image' | 'audio' | 'json' | 'code' | 'trash';

export interface VirtualFile {
  id: string;
  name: string;
  type: FileType;
  path: string; // e.g. '/home/user/Documents/notes.txt'
  parentId: string; // id of parent folder, or 'root'
  content?: string; // Text content or Data URL for binary/images
  size: number; // in bytes
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  icon?: string;
  isSystem?: boolean; // Cannot be deleted
  originalPath?: string; // If in trash, remembers original path
}

export interface VirtualFolder extends VirtualFile {
  type: 'folder' | 'trash';
  childrenIds: string[];
}

export interface FileSystemState {
  nodes: Record<string, VirtualFile>;
  rootId: string;
}
