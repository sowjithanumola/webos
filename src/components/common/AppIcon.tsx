import React from 'react';
import {
  Folder,
  FileText,
  Edit3,
  Terminal,
  Calculator,
  Calendar,
  Clock,
  Image,
  Music,
  Settings,
  FileCode,
  FileJson,
  File,
  Trash2,
  Code2,
  BookOpen,
  Globe,
  Database,
} from 'lucide-react';
import { AppId } from '../../types/window';
import { FileType } from '../../types/fs';

interface AppIconProps {
  id?: AppId | string;
  name?: string;
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ id, name, className = 'w-5 h-5', size = 20 }) => {
  const target = id || name;

  switch (target) {
    case 'file-manager':
    case 'Folder':
      return <Folder size={size} className={className} />;
    case 'notes':
    case 'FileText':
      return <FileText size={size} className={className} />;
    case 'text-editor':
    case 'Edit3':
      return <Edit3 size={size} className={className} />;
    case 'terminal':
    case 'Terminal':
      return <Terminal size={size} className={className} />;
    case 'calculator':
    case 'Calculator':
      return <Calculator size={size} className={className} />;
    case 'calendar':
    case 'Calendar':
      return <Calendar size={size} className={className} />;
    case 'clock':
    case 'Clock':
      return <Clock size={size} className={className} />;
    case 'image-viewer':
    case 'Image':
      return <Image size={size} className={className} />;
    case 'media-player':
    case 'Music':
      return <Music size={size} className={className} />;
    case 'settings':
    case 'Settings':
      return <Settings size={size} className={className} />;
    case 'code-studio':
    case 'Code2':
      return <Code2 size={size} className={className} />;
    case 'docs-studio':
    case 'BookOpen':
      return <BookOpen size={size} className={className} />;
    case 'Globe':
      return <Globe size={size} className={className} />;
    case 'supabase-sql':
    case 'sql-studio':
    case 'Database':
      return <Database size={size} className={className} />;
    default:
      return <File size={size} className={className} />;
  }
};

interface FileIconProps {
  type: FileType;
  name?: string;
  className?: string;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, name, className = 'w-5 h-5', size = 20 }) => {
  if (type === 'folder') {
    return <Folder size={size} className={`text-blue-400 ${className}`} />;
  }
  if (type === 'trash') {
    return <Trash2 size={size} className={`text-rose-400 ${className}`} />;
  }
  if (type === 'markdown' || (name && name.endsWith('.md'))) {
    return <FileText size={size} className={`text-indigo-400 ${className}`} />;
  }
  if (type === 'code' || (name && (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py')))) {
    return <FileCode size={size} className={`text-emerald-400 ${className}`} />;
  }
  if (type === 'json' || (name && name.endsWith('.json'))) {
    return <FileJson size={size} className={`text-amber-400 ${className}`} />;
  }
  if (type === 'image' || (name && (name.endsWith('.svg') || name.endsWith('.png') || name.endsWith('.jpg')))) {
    return <Image size={size} className={`text-cyan-400 ${className}`} />;
  }
  if (type === 'audio' || (name && (name.endsWith('.mp3') || name.endsWith('.wav')))) {
    return <Music size={size} className={`text-purple-400 ${className}`} />;
  }
  return <File size={size} className={`text-slate-400 ${className}`} />;
};
